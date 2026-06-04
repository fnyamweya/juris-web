"use client";

import type { LegalDocument } from "@repo/civis";
import { useEffect, useState } from "react";

interface Props {
  documents: LegalDocument[];
  locale: string;
  children: React.ReactNode;
}

export function LegalAcceptanceFlow({ documents, locale, children }: Props) {
  const [remaining, setRemaining] = useState<LegalDocument[]>(documents);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setChecked(false);
    setError(null);
  }, [currentIdx]);

  if (remaining.length === 0) {
    return children;
  }

  const doc: LegalDocument | undefined = remaining[currentIdx];
  if (!doc) return children;

  const { id: docId, title: docTitle, version: docVersion, effectiveFrom: docEffectiveFrom, contentUrl: docContentUrl } = doc;
  const isLast = currentIdx === remaining.length - 1;

  function handleCheckChange(e: React.ChangeEvent<HTMLInputElement>) {
    setChecked(e.target.checked);
  }

  async function handleAccept() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/legal/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, locale }),
      });
      if (!res.ok) { setError("Failed to record acceptance. Please try again."); setSubmitting(false); return; }
      if (isLast) { setRemaining([]); } else { setCurrentIdx((c) => c + 1); }
    } catch { setError("Network error. Please check your connection and try again."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{currentIdx + 1} of {remaining.length} required</p>
          <h2 className="text-lg font-semibold">{docTitle}</h2>
          <p className="text-sm text-muted-foreground">Version {docVersion} &mdash; effective {new Date(docEffectiveFrom).toLocaleDateString()}</p>
        </div>
        <div className="rounded-md border bg-muted/50 p-3 text-sm">
          Please read the document before accepting.{" "}
          <a href={docContentUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">Open {docTitle} ↗</a>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={checked} onChange={handleCheckChange} className="h-4 w-4 rounded border" disabled={submitting} />
          <span className="text-sm">I have read and accept the {docTitle}</span>
        </label>
        {error !== null && <p className="text-sm text-destructive">{error}</p>}
        <button onClick={() => void handleAccept()} disabled={!checked || submitting} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {submitting ? "Saving…" : isLast ? "Accept & Continue" : "Accept & Next"}
        </button>
      </div>
    </div>
  );
}
