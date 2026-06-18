"use client";

import { Button } from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";

/** Decodes a base64url string (no padding) into an ArrayBuffer for the WebAuthn API. */
function base64urlToBuffer(value: string): ArrayBuffer {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Encodes an ArrayBuffer as a base64url string (no padding) for transport back to CAS. */
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

interface CreationOptionsResponse {
  challenge: string;
  user: { id: string; name: string; displayName: string };
  excludeCredentials?: Array<{
    id: string;
    type: string;
    transports?: string[];
  }>;
  [key: string]: unknown;
}

/**
 * Registers a WebAuthn passkey through CAS's native WebAuthn endpoints. The credential becomes
 * usable for both passwordless sign-in and as a phishing-resistant MFA factor (AUTH-014).
 */
export function PasskeySetup() {
  const [isRegistering, setIsRegistering] = useState(false);

  async function register() {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      toast.error("Passkeys are not supported in this browser.");
      return;
    }

    setIsRegistering(true);
    try {
      const optionsResponse = await fetch("/api/webauthn/register/options", {
        method: "POST",
      });
      if (!optionsResponse.ok) {
        throw new Error("Could not start passkey registration. Please sign in again.");
      }
      const options = (await optionsResponse.json()) as CreationOptionsResponse;

      const publicKey = {
        ...options,
        challenge: base64urlToBuffer(options.challenge),
        user: { ...options.user, id: base64urlToBuffer(options.user.id) },
        excludeCredentials: (options.excludeCredentials ?? []).map((credential) => ({
          ...credential,
          id: base64urlToBuffer(credential.id),
        })),
      } as unknown as PublicKeyCredentialCreationOptions;

      const created = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential | null;
      if (!created) {
        throw new Error("Passkey registration was cancelled.");
      }

      const attestation = created.response as AuthenticatorAttestationResponse;
      const payload = {
        publicKey: {
          credential: {
            id: created.id,
            rawId: bufferToBase64url(created.rawId),
            type: created.type,
            response: {
              attestationObject: bufferToBase64url(attestation.attestationObject),
              clientDataJSON: bufferToBase64url(attestation.clientDataJSON),
              transports: attestation.getTransports?.() ?? [],
            },
            clientExtensionResults: created.getClientExtensionResults(),
            authenticatorAttachment: created.authenticatorAttachment ?? undefined,
          },
          label: `Passkey · ${new Date().toLocaleDateString()}`,
        },
      };

      const registerResponse = await fetch("/api/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!registerResponse.ok) {
        throw new Error("Could not save the passkey. Please try again.");
      }

      toast.success("Passkey registered. You can use it to sign in and for MFA.");
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Passkey registration was cancelled or timed out."
          : error instanceof Error
            ? error.message
            : "Passkey registration failed.";
      toast.error(message);
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Add a passkey (Face ID, Touch ID, Windows Hello, or a security key) for
        phishing-resistant sign-in and MFA. You can register more than one.
      </p>
      <Button type="button" onClick={register} disabled={isRegistering}>
        {isRegistering ? "Follow your browser prompts…" : "Add a passkey"}
      </Button>
    </div>
  );
}
