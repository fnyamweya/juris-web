import { describe, expect, it } from "vitest";
import {
  decodePkceState,
  decodeSessionCookie,
  encodePkceState,
  encodeSessionCookie,
  PKCE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "./session-codec";
import type { PkcePayload, SessionPayload } from "./types";

const SECRET = "test-session-secret-for-codec-tests";
const WRONG_SECRET = "wrong-secret-that-will-fail-decryption";

const SESSION: SessionPayload = {
  at: "header.eyJ1c2VyX2lkIjoidGVzdCJ9.sig",
  it: "header.eyJuYW1lIjoidGVzdCJ9.sig",
  rt: "opaque-refresh-token",
  exp: Math.floor(Date.now() / 1000) + 3600,
  tenants: [{ id: "t1", name: "Acme", slug: "acme" }],
};

const PKCE: PkcePayload = {
  state: "random-state-value",
  nonce: "random-nonce-value",
  codeVerifier: "random-verifier",
  locale: "en",
  returnTo: "/en/console",
};

describe("cookie names", () => {
  it("SESSION_COOKIE_NAME is defined", () => {
    expect(SESSION_COOKIE_NAME).toBe("juris-session");
  });

  it("PKCE_COOKIE_NAME is defined", () => {
    expect(PKCE_COOKIE_NAME).toBe("juris-pkce");
  });
});

describe("encodeSessionCookie / decodeSessionCookie", () => {
  it("round-trips a full session payload", async () => {
    const encoded = await encodeSessionCookie(SESSION, SECRET);
    const decoded = await decodeSessionCookie(encoded, SECRET);
    expect(decoded).toEqual(SESSION);
  });

  it("returns null with the wrong secret", async () => {
    const encoded = await encodeSessionCookie(SESSION, SECRET);
    expect(await decodeSessionCookie(encoded, WRONG_SECRET)).toBeNull();
  });

  it("returns null for a tampered cookie value", async () => {
    const encoded = await encodeSessionCookie(SESSION, SECRET);
    const tampered = encoded.slice(0, -4) + "XXXX";
    expect(await decodeSessionCookie(tampered, SECRET)).toBeNull();
  });

  it("returns null for an empty string", async () => {
    expect(await decodeSessionCookie("", SECRET)).toBeNull();
  });

  it("returns null for non-JSON payload (impossible via normal encode, tested for robustness)", async () => {
    // Encrypt a non-JSON string manually
    const { encrypt } = await import("./crypto");
    const bad = await encrypt("not-json{{{{", SECRET);
    expect(await decodeSessionCookie(bad, SECRET)).toBeNull();
  });

  it("produces different ciphertexts on repeated encode (random IV)", async () => {
    const a = await encodeSessionCookie(SESSION, SECRET);
    const b = await encodeSessionCookie(SESSION, SECRET);
    expect(a).not.toBe(b);
  });
});

describe("encodePkceState / decodePkceState", () => {
  it("round-trips a full PKCE payload", async () => {
    const encoded = await encodePkceState(PKCE, SECRET);
    const decoded = await decodePkceState(encoded, SECRET);
    expect(decoded).toEqual(PKCE);
  });

  it("returns null with the wrong secret", async () => {
    const encoded = await encodePkceState(PKCE, SECRET);
    expect(await decodePkceState(encoded, WRONG_SECRET)).toBeNull();
  });

  it("returns null for a tampered value", async () => {
    const encoded = await encodePkceState(PKCE, SECRET);
    expect(await decodePkceState(encoded.slice(0, -8) + "YYYYYYYY", SECRET)).toBeNull();
  });
});
