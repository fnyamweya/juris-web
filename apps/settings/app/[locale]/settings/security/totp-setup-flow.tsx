"use client";

import { Button, Input, Label } from "@repo/ui";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Step = "scan" | "verify" | "backup-codes";

interface EnrollStartResult {
  secret: string;
  keyUri: string;
  issuer: string;
}

interface Props {
  onClose: () => void;
}

function groupSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

function QrCode({ keyUri }: { keyUri: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !keyUri) return;
    let cancelled = false;

    void import("qrcode").then((QRCode) => {
      if (cancelled || !canvasRef.current) return;
      void QRCode.toCanvas(canvasRef.current, keyUri, { width: 200, margin: 1 });
    });

    return () => {
      cancelled = true;
    };
  }, [keyUri]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border"
      width={200}
      height={200}
    />
  );
}

export function TotpSetupFlow({ onClose }: Props) {
  const [step, setStep] = useState<Step>("scan");
  const [enrollData, setEnrollData] = useState<EnrollStartResult | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/mfa/totp/enroll/start", { method: "POST", body: "{}" })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const text = await res.text();
          setError(text || "Failed to start enrollment. Please try again.");
          return;
        }
        const data = (await res.json()) as EnrollStartResult;
        if (!cancelled) setEnrollData(data);
      })
      .catch(() => {
        if (!cancelled) setError("Network error. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleVerify() {
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mfa/totp/enroll/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Verification failed. Check the code and try again.");
        return;
      }
      const data = (await res.json()) as { backupCodes: string[] };
      setBackupCodes(data.backupCodes);
      setStep("backup-codes");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function downloadCodes() {
    const text = backupCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "juris-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyAll() {
    void navigator.clipboard.writeText(backupCodes.join("\n")).then(() => {
      toast.success("Backup codes copied to clipboard");
    });
  }

  if (step === "scan") {
    return (
      <div className="space-y-4">
        {loading && !enrollData && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {enrollData && (
          <>
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app (e.g. Google
              Authenticator, Authy, or 1Password).
            </p>
            <div className="flex justify-center">
              <QrCode keyUri={enrollData.keyUri} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Or enter this key manually:
              </p>
              <p className="rounded-md border bg-muted px-3 py-2 font-mono text-sm tracking-widest">
                {groupSecret(enrollData.secret)}
              </p>
              <p className="text-xs text-muted-foreground">
                Issuer: {enrollData.issuer}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={() => setStep("verify")} disabled={loading}>
                I've scanned it
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code shown in your authenticator app to confirm
          setup.
        </p>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="totp-code">Verification code</Label>
          <Input
            id="totp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleVerify();
            }}
            className="w-40 font-mono tracking-widest"
            disabled={loading}
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setStep("scan");
              setError(null);
              setCode("");
            }}
            disabled={loading}
          >
            Back
          </Button>
          <Button onClick={handleVerify} disabled={loading || code.length !== 6}>
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Save these backup codes somewhere safe. Each code can only be used
        once to sign in if you lose access to your authenticator app.
      </p>
      <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted p-4">
        {backupCodes.map((c) => (
          <span key={c} className="font-mono text-sm">
            {c}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={downloadCodes}>
          Download backup codes
        </Button>
        <Button variant="outline" onClick={copyAll}>
          Copy all
        </Button>
        <Button
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            toast.success("Authenticator app set up successfully");
            onClose();
          }}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
