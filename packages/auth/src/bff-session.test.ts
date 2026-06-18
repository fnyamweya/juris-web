import { afterEach, describe, expect, it, vi } from "vitest";
import type { BffSessionResponse, SessionPayload } from "./types";

vi.mock("@repo/platform", () => ({
  getEnv: vi.fn((key: string): string | undefined => {
    if (key === "CIVIS_CORE_URL") return "http://localhost:8080";
    if (key === "CAS_ISSUER_URL") return "http://localhost:9000";
    if (key === "CIVIS_UI_BFF_CLIENT_ID") return "identity-bff";
    if (key === "CIVIS_UI_BFF_CLIENT_SECRET") return "identity-bff-secret";
    return undefined;
  }),
}));

const nowSeconds = () => Math.floor(Date.now() / 1000);

function payload(overrides: Partial<SessionPayload> = {}): SessionPayload {
  return {
    at: "access-token",
    it: "id-token",
    exp: nowSeconds() + 3600,
    tenants: [],
    ...overrides,
  };
}

function sessionResponse(session: BffSessionResponse): Response {
  return new Response(JSON.stringify({ data: session }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function activeSession(sessionPayload: SessionPayload): BffSessionResponse {
  return {
    status: "ACTIVE",
    payload: sessionPayload,
    metadata: {
      subject: "user-1",
      userId: "user-1",
    },
  };
}

function invalidSession(): BffSessionResponse {
  return { status: "INVALID", payload: null, metadata: null };
}

describe("ensureBffSession()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends per-workload client credentials and trusts an ACTIVE introspect result as-is", async () => {
    const activePayload = payload();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(sessionResponse(activeSession(activePayload)));

    const { ensureBffSession } = await import("./bff-session");
    const result = await ensureBffSession("session-handle", { touch: true });

    expect(result.status).toBe("ACTIVE");
    expect(result.payload).toEqual(activePayload);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("http://localhost:8080/v1/ui/sessions/introspect");
    expect(init?.body).toBe(
      JSON.stringify({ handle: "session-handle", touch: true }),
    );
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-Civis-Bff-Client-Id"]).toBe("identity-bff");
    expect(headers["X-Civis-Bff-Client-Secret"]).toBe("identity-bff-secret");
    expect(headers).not.toHaveProperty("X-Civis-Bff-Session-Secret");
  });

  it("retries once when introspect returns INVALID, and returns the retry result", async () => {
    const activePayload = payload();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(sessionResponse(invalidSession()))
      .mockResolvedValueOnce(sessionResponse(activeSession(activePayload)));

    const { ensureBffSession } = await import("./bff-session");
    const result = await ensureBffSession("session-handle", { touch: true });

    expect(result.status).toBe("ACTIVE");
    expect(result.payload).toEqual(activePayload);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ handle: "session-handle", touch: true }),
    );
  });

  it("returns INVALID when both introspect attempts fail", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(sessionResponse(invalidSession()))
      .mockResolvedValueOnce(sessionResponse(invalidSession()));

    const { ensureBffSession } = await import("./bff-session");
    const result = await ensureBffSession("session-handle", { touch: true });

    expect(result).toEqual(invalidSession());
  });

  it("does not retry non-INVALID statuses such as EXPIRED or REVOKED", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        sessionResponse({ status: "EXPIRED", payload: null, metadata: null }),
      );

    const { ensureBffSession } = await import("./bff-session");
    const result = await ensureBffSession("session-handle");

    expect(result.status).toBe("EXPIRED");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
