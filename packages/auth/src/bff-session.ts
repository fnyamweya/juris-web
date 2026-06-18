import { getEnv } from "@repo/platform";
import type { BffSessionResponse, BffSessionResult, StoredTenant } from "./types";

const CLIENT_ID_HEADER = "X-Civis-Bff-Client-Id";
const CLIENT_SECRET_HEADER = "X-Civis-Bff-Client-Secret";
const DEV_BFF_CLIENT_ID = "identity-bff";
const DEV_BFF_CLIENT_SECRET = "dev-identity-bff-secret-change-me";

type ApiEnvelope<T> = {
  data?: T;
};

type SessionRequestOptions = {
  touch?: boolean;
};

type CreateSessionParams = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tenants: StoredTenant[];
  activeTenantId?: string;
  deviceFingerprint?: string;
};

type ReplaceTokensParams = {
  handle: string;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
};

type ReactivateSessionParams = ReplaceTokensParams & {
  reauthStartedAt?: string;
};

function coreUrl(): string | null {
  const configured = getEnv("CIVIS_CORE_URL");
  if (configured) return configured.replace(/\/+$/, "");

  const casIssuer = getEnv("CAS_ISSUER_URL");
  if (!casIssuer) return null;
  return casIssuer.replace(/\/+$/, "").replace(":9000", ":8080");
}

function clientCredentials(): { clientId: string; clientSecret: string } {
  return {
    clientId: getEnv("CIVIS_UI_BFF_CLIENT_ID") ?? DEV_BFF_CLIENT_ID,
    clientSecret: getEnv("CIVIS_UI_BFF_CLIENT_SECRET") ?? DEV_BFF_CLIENT_SECRET,
  };
}

async function postSession<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  const base = coreUrl();
  if (!base) return null;

  const { clientId, clientSecret } = clientCredentials();
  const response = await fetch(`${base}/v1/ui/sessions${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      [CLIENT_ID_HEADER]: clientId,
      [CLIENT_SECRET_HEADER]: clientSecret,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) return null;

  const envelope = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;
  return envelope?.data ?? null;
}

function invalidSession(status: BffSessionResponse["status"] = "INVALID") {
  return { status, payload: null, metadata: null } satisfies BffSessionResponse;
}

export async function createBffSession(
  params: CreateSessionParams,
): Promise<BffSessionResult | null> {
  return postSession<BffSessionResult>("", params);
}

export async function readBffSession(
  handle: string,
  touch = false,
): Promise<BffSessionResponse> {
  return (
    (await postSession<BffSessionResponse>("/introspect", { handle, touch })) ??
    invalidSession()
  );
}

export async function replaceBffSessionTokens(
  params: ReplaceTokensParams,
): Promise<BffSessionResponse> {
  return (
    (await postSession<BffSessionResponse>("/tokens", params)) ??
    invalidSession()
  );
}

export async function reactivateBffSession(
  params: ReactivateSessionParams,
): Promise<BffSessionResponse> {
  return (
    (await postSession<BffSessionResponse>("/reactivate", params)) ??
    invalidSession()
  );
}

export async function revokeBffSession(
  handle: string,
): Promise<BffSessionResponse> {
  return (
    (await postSession<BffSessionResponse>("/revoke", { handle })) ??
    invalidSession()
  );
}

/**
 * Force-refreshes UI permissions for all active sessions of the given user.
 *
 * Resets the permission epoch on every active session so the next introspect
 * re-derives permissions from the DB. Use after role changes, suspension, or
 * any event that requires immediate revocation without waiting for token rotation.
 *
 * Returns the number of sessions updated, or null if the store is unreachable.
 */
export async function refreshUserPermissions(
  userId: string,
): Promise<{ sessionsUpdated: number } | null> {
  return postSession<{ userId: string; sessionsUpdated: number }>(
    "/permissions/refresh",
    { userId },
  ).then((r) => (r ? { sessionsUpdated: r.sessionsUpdated } : null));
}

/**
 * Introspects the BFF session, trusting the store's response: token refresh,
 * idle-timeout enforcement, and permission re-resolution all happen server-side
 * (UiBffSessionService.introspect, AUTH-006/AUTH-007) under a row lock that
 * serializes concurrent callers.
 *
 * INVALID can also mean a transient store error (e.g. a dropped connection), so
 * this retries once before giving up.
 */
export async function ensureBffSession(
  handle: string,
  options: SessionRequestOptions = {},
): Promise<BffSessionResponse> {
  const touch = options.touch ?? false;
  const session = await readBffSession(handle, touch);
  if (session.status !== "INVALID") {
    return session;
  }
  return readBffSession(handle, touch);
}
