import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./crypto";

const SECRET = "test-secret-that-is-long-enough-for-hkdf";
const ANOTHER_SECRET = "different-secret-for-key-isolation";

describe("encrypt / decrypt", () => {
  it("round-trips a short plaintext", async () => {
    const token = await encrypt("hello", SECRET);
    expect(await decrypt(token, SECRET)).toBe("hello");
  });

  it("round-trips a JSON payload", async () => {
    const payload = JSON.stringify({ at: "access", rt: "refresh", exp: 9999 });
    const token = await encrypt(payload, SECRET);
    expect(await decrypt(token, SECRET)).toBe(payload);
  });

  it("round-trips a long plaintext (>1 AES block)", async () => {
    const long = "x".repeat(1024);
    expect(await decrypt(await encrypt(long, SECRET), SECRET)).toBe(long);
  });

  it("produces different ciphertexts for the same input (random IV)", async () => {
    const a = await encrypt("same", SECRET);
    const b = await encrypt("same", SECRET);
    expect(a).not.toBe(b);
  });

  it("returns null when decrypting with the wrong secret", async () => {
    const token = await encrypt("payload", SECRET);
    expect(await decrypt(token, ANOTHER_SECRET)).toBeNull();
  });

  it("returns null for a truncated ciphertext", async () => {
    const token = await encrypt("payload", SECRET);
    // Remove half the characters to corrupt the ciphertext
    expect(await decrypt(token.slice(0, 10), SECRET)).toBeNull();
  });

  it("returns null for an empty string", async () => {
    expect(await decrypt("", SECRET)).toBeNull();
  });

  it("returns null for a randomly corrupted ciphertext", async () => {
    const token = await encrypt("payload", SECRET);
    const corrupted = token.slice(0, -4) + "XXXX";
    expect(await decrypt(corrupted, SECRET)).toBeNull();
  });
});
