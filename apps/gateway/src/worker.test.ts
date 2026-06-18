import { describe, expect, it, vi } from "vitest";
import worker from "./worker";

describe("gateway worker", () => {
  it("applies security headers to health responses", async () => {
    const response = await worker.fetch(
      new Request("https://gateway.example.com/api/health/live"),
      {},
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'self'",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("applies security headers to 404 responses", async () => {
    const response = await worker.fetch(
      new Request("https://gateway.example.com/does-not-exist"),
      {},
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("content-security-policy")).toBeTruthy();

    const body = await response.json();
    expect(body).toMatchObject({
      success: false,
      error: { code: "route_not_found" },
    });
  });

  it("does not leak the service binding name when binding is missing in production", async () => {
    const response = await worker.fetch(
      new Request("https://gateway.example.com/en/console"),
      { ENVIRONMENT: "production" },
    );

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("binding_missing");
    expect(body.error.message).not.toContain("console");
    expect(body.error.message).not.toContain("CONSOLE");
  });

  it("includes the route name when binding is missing outside production", async () => {
    const response = await worker.fetch(
      new Request("https://gateway.example.com/en/console"),
      { ENVIRONMENT: "local" },
    );

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.message).toContain("console");
  });

  it("rejects state-changing requests from untrusted origins", async () => {
    const response = await worker.fetch(
      new Request("https://gateway.example.com/en/console", {
        method: "POST",
        headers: { origin: "https://evil.example.com" },
      }),
      {},
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("origin_not_allowed");
  });

  it("allows state-changing requests from trusted origins", async () => {
    const response = await worker.fetch(
      new Request("https://gateway.example.com/en/console", {
        method: "POST",
        headers: { origin: "https://juris.example.com" },
      }),
      { ENVIRONMENT: "local" },
    );

    // Passes the origin check; falls through to binding_missing since no
    // CONSOLE binding is configured in this test env.
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("binding_missing");
  });

  it("returns 429 when the rate limiter rejects the request", async () => {
    const limiter = { limit: vi.fn().mockResolvedValue({ success: false }) };

    const response = await worker.fetch(
      new Request("https://gateway.example.com/en/console", {
        headers: { "cf-connecting-ip": "203.0.113.5" },
      }),
      { GATEWAY_RATE_LIMITER: limiter },
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    const body = await response.json();
    expect(body.error.code).toBe("rate_limited");
    expect(limiter.limit).toHaveBeenCalledWith({ key: "203.0.113.5" });
  });

  it("uses the auth rate limiter for identity routes", async () => {
    const authLimiter = {
      limit: vi.fn().mockResolvedValue({ success: false }),
    };
    const generalLimiter = {
      limit: vi.fn().mockResolvedValue({ success: true }),
    };

    const response = await worker.fetch(
      new Request("https://gateway.example.com/en/login"),
      {
        AUTH_RATE_LIMITER: authLimiter,
        GATEWAY_RATE_LIMITER: generalLimiter,
      },
    );

    expect(response.status).toBe(429);
    expect(authLimiter.limit).toHaveBeenCalled();
    expect(generalLimiter.limit).not.toHaveBeenCalled();
  });

  it("returns a sanitized 502 when the upstream binding throws", async () => {
    const response = await worker.fetch(
      new Request("https://gateway.example.com/en/console"),
      {
        CONSOLE: {
          fetch: vi.fn().mockRejectedValue(new Error("ECONNREFUSED 10.0.0.5:3003")),
        },
      },
    );

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error.code).toBe("upstream_error");
    expect(JSON.stringify(body)).not.toContain("10.0.0.5");
  });

  it("proxies to the matching service binding when available", async () => {
    const upstreamResponse = new Response("ok");
    const response = await worker.fetch(
      new Request("https://gateway.example.com/en/console"),
      { CONSOLE: { fetch: vi.fn().mockResolvedValue(upstreamResponse) } },
    );

    expect(response).toBe(upstreamResponse);
  });
});
