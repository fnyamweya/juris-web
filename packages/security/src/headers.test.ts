import { describe, expect, it } from "vitest";
import { CSP_NONCE_HEADER, getSecurityHeaders, isTrustedOrigin } from "./index";

describe("security headers", () => {
  it("generates strict defaults", () => {
    const headers = getSecurityHeaders({
      environment: "production",
      nonce: "abc",
    });
    expect(headers["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Strict-Transport-Security"]).toContain("max-age");
  });

  it("validates trusted origins", () => {
    expect(isTrustedOrigin("http://localhost:3000")).toBe(true);
    expect(isTrustedOrigin("https://app.juris.example.com")).toBe(true);
  });

  it("exposes the CSP nonce request header name", () => {
    expect(CSP_NONCE_HEADER).toBe("x-juris-csp-nonce");
  });
});
