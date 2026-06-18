import { describe, expect, it } from "vitest";
import { sanitizeReturnTo } from "./safe-redirect";

const FALLBACK = "/en/console";
const BACKSLASH = String.fromCharCode(92);
const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);
const NUL = String.fromCharCode(0);
const TAB = String.fromCharCode(9);

describe("sanitizeReturnTo", () => {
  describe("valid app-relative paths", () => {
    const validValues = [
      "/",
      "/en/console",
      "/en/console/settings",
      "/en/console?tab=billing",
      "/en/console#section",
      "/en/console?returnTo=%2Fen%2Fdashboard",
      "/a",
    ];

    it.each(validValues)("returns %s unchanged", (value) => {
      expect(sanitizeReturnTo(value, FALLBACK)).toBe(value);
    });
  });

  describe("missing or non-string input", () => {
    it("returns fallback for null", () => {
      expect(sanitizeReturnTo(null, FALLBACK)).toBe(FALLBACK);
    });

    it("returns fallback for undefined", () => {
      expect(sanitizeReturnTo(undefined, FALLBACK)).toBe(FALLBACK);
    });

    it("returns fallback for empty string", () => {
      expect(sanitizeReturnTo("", FALLBACK)).toBe(FALLBACK);
    });
  });

  describe("open-redirect and protocol-relative attacks", () => {
    it("rejects //evil.example", () => {
      expect(sanitizeReturnTo("//evil.example", FALLBACK)).toBe(FALLBACK);
    });

    it("rejects //evil.example/path", () => {
      expect(sanitizeReturnTo("//evil.example/path", FALLBACK)).toBe(FALLBACK);
    });

    it("rejects a leading backslash-escaped host", () => {
      expect(sanitizeReturnTo(`/${BACKSLASH}evil.example`, FALLBACK)).toBe(
        FALLBACK,
      );
    });

    it("rejects a leading backslash-slash-escaped host", () => {
      expect(sanitizeReturnTo(`/${BACKSLASH}/evil.example`, FALLBACK)).toBe(
        FALLBACK,
      );
    });

    it("rejects https://evil.example", () => {
      expect(sanitizeReturnTo("https://evil.example", FALLBACK)).toBe(
        FALLBACK,
      );
    });

    it("rejects http://evil.example/en/console", () => {
      expect(
        sanitizeReturnTo("http://evil.example/en/console", FALLBACK),
      ).toBe(FALLBACK);
    });

    it("rejects a bare hostname with no leading slash", () => {
      expect(sanitizeReturnTo("evil.example", FALLBACK)).toBe(FALLBACK);
    });

    it("rejects an embedded scheme", () => {
      expect(sanitizeReturnTo("/path://evil.example", FALLBACK)).toBe(
        FALLBACK,
      );
    });
  });

  describe("percent-encoded attacks", () => {
    const encodedMaliciousValues = [
      "/%2f%2fevil.example", // decodes to //evil.example
      "/%2F%2Fevil.example",
      "/%5Cevil.example", // decodes to /\evil.example
      "/%2f%5cevil.example",
    ];

    it.each(encodedMaliciousValues)("rejects %s", (value) => {
      expect(sanitizeReturnTo(value, FALLBACK)).toBe(FALLBACK);
    });

    it("rejects malformed percent-encoding", () => {
      expect(sanitizeReturnTo("/%E0%A4%A", FALLBACK)).toBe(FALLBACK);
    });
  });

  describe("control characters and header injection", () => {
    it("rejects embedded CR/LF", () => {
      expect(
        sanitizeReturnTo(`/en/console${CR}${LF}Set-Cookie: x=1`, FALLBACK),
      ).toBe(FALLBACK);
    });

    it("rejects percent-encoded CR/LF", () => {
      expect(
        sanitizeReturnTo("/en/console%0d%0aSet-Cookie:%20x=1", FALLBACK),
      ).toBe(FALLBACK);
    });

    it("rejects an embedded null byte", () => {
      expect(sanitizeReturnTo(`/en/console${NUL}`, FALLBACK)).toBe(FALLBACK);
    });

    it("rejects an embedded tab character", () => {
      expect(sanitizeReturnTo(`/en/${TAB}console`, FALLBACK)).toBe(FALLBACK);
    });
  });

  describe("allowedPrefixes", () => {
    const allowedPrefixes = ["/en/console", "/fr/console"];

    it("allows exact prefix match", () => {
      expect(
        sanitizeReturnTo("/en/console", FALLBACK, { allowedPrefixes }),
      ).toBe("/en/console");
    });

    it("allows a path under an allowed prefix", () => {
      expect(
        sanitizeReturnTo("/en/console/billing", FALLBACK, { allowedPrefixes }),
      ).toBe("/en/console/billing");
    });

    it("allows a query string appended to an allowed prefix", () => {
      expect(
        sanitizeReturnTo("/en/console?tab=billing", FALLBACK, {
          allowedPrefixes,
        }),
      ).toBe("/en/console?tab=billing");
    });

    it("rejects a path outside the allowlist", () => {
      expect(sanitizeReturnTo("/en/admin", FALLBACK, { allowedPrefixes })).toBe(
        FALLBACK,
      );
    });

    it("rejects a prefix-like path that isn't actually nested (no separator)", () => {
      expect(
        sanitizeReturnTo("/en/console-evil", FALLBACK, { allowedPrefixes }),
      ).toBe(FALLBACK);
    });
  });
});
