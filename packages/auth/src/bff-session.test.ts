import { afterEach, describe, expect, it, vi } from "vitest";
import type { BffSessionResponse, SessionPayload } from "./types";

vi.mock("@repo/platform", () => ({
  getEnv: vi.fn((key: string): string | undefined => {
    if (key === "CIVIS_CORE_URL") return "http://localhost:8080";
    if (key === "CAS_ISSUER_URL") return "http://localhost:9000";
    if (key === "CAS_BFF_CLIENT_ID") return "client-id";
    if (key === "CAS_BFF_CLIENT_SECRET") return "client-secret";
    if (key === "CIVIS_UI_AUTH_SESSION_API_SECRET") {
      return "session-api-secret";
    }
    return undefined;
  }),
}));

const nowSeconds = () => Math.floor(Date.now() / 1000);

function payload(overrides: Partial<SessionPayload> = {}): SessionPayload {
  return {
    at: "access-token-old",
    it: "id-token-old",
    rt: "refresh-token-old",
    exp: nowSeconds() - 10,
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

function refreshFailure(): Response {
  return new Response(JSON.stringify({ error: "invalid_grant" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ensureBffSession()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("re-reads and returns the stored session when a parallel request already refreshed it", async () => {
    const expiringPayload = payload();
    const refreshedPayload = payload({
      at: "access-token-new",
      it: "id-token-new",
      rt: "refresh-token-new",
      exp: nowSeconds() + 3600,
    });

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(sessionResponse(activeSession(expiringPayload)))
      .mockResolvedValueOnce(refreshFailure())
      .mockResolvedValueOnce(sessionResponse(activeSession(refreshedPayload)));

    const { ensureBffSession } = await import("./bff-session");
    const result = await ensureBffSession("session-handle", {
      touch: true,
      refreshThresholdSeconds: 60,
    });

    expect(result.status).toBe("ACTIVE");
    expect(result.payload).toEqual(refreshedPayload);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ handle: "session-handle", touch: true }),
    );

    const refreshBody = new URLSearchParams(
      fetchMock.mock.calls[1]?.[1]?.body as string,
    );
    expect(refreshBody.get("grant_type")).toBe("refresh_token");
    expect(refreshBody.get("refresh_token")).toBe("refresh-token-old");

    expect(fetchMock.mock.calls[2]?.[1]?.body).toBe(
      JSON.stringify({ handle: "session-handle", touch: false }),
    );
  });

  it("returns EXPIRED when refresh fails and the re-read session is unchanged", async () => {
    const expiringPayload = payload();

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(sessionResponse(activeSession(expiringPayload)))
      .mockResolvedValueOnce(refreshFailure())
      .mockResolvedValueOnce(sessionResponse(activeSession(expiringPayload)));

    const { ensureBffSession } = await import("./bff-session");
    const result = await ensureBffSession("session-handle", {
      refreshThresholdSeconds: 60,
    });

    expect(result).toEqual({
      status: "EXPIRED",
      payload: null,
      metadata: null,
    });
  });
});
