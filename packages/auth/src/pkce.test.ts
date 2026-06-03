import { describe, expect, it } from "vitest";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateNonce,
  generatePkceState,
  generateState,
} from "./pkce";

// Reference implementation: SHA-256 base64url of the verifier
async function sha256Base64Url(input: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  const bytes = new Uint8Array(hash);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

describe("generateCodeVerifier", () => {
  it("returns a string between 43 and 128 chars (PKCE spec)", () => {
    const v = generateCodeVerifier();
    expect(v.length).toBeGreaterThanOrEqual(43);
    expect(v.length).toBeLessThanOrEqual(128);
  });

  it("contains only base64url characters", () => {
    const v = generateCodeVerifier();
    expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates unique values each call", () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });
});

describe("generateCodeChallenge", () => {
  it("matches SHA-256 base64url of the verifier", async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toBe(await sha256Base64Url(verifier));
  });

  it("contains only base64url characters", async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier());
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("is deterministic for the same verifier", async () => {
    const verifier = "fixed-verifier-value";
    const a = await generateCodeChallenge(verifier);
    const b = await generateCodeChallenge(verifier);
    expect(a).toBe(b);
  });
});

describe("generateState / generateNonce", () => {
  it("generateState returns a non-empty string", () => {
    expect(generateState().length).toBeGreaterThan(0);
  });

  it("generateState values are unique", () => {
    expect(generateState()).not.toBe(generateState());
  });

  it("generateNonce values are unique", () => {
    expect(generateNonce()).not.toBe(generateNonce());
  });
});

describe("generatePkceState", () => {
  it("returns state, nonce, and codeVerifier", () => {
    const pkce = generatePkceState();
    expect(pkce.state).toBeTruthy();
    expect(pkce.nonce).toBeTruthy();
    expect(pkce.codeVerifier).toBeTruthy();
  });

  it("each call produces a unique set", () => {
    const a = generatePkceState();
    const b = generatePkceState();
    expect(a.state).not.toBe(b.state);
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
  });
});
