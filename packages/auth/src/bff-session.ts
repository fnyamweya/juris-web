import { getEnv } from "@repo/platform";
import { refreshAccessToken } from "./cas-client";
import type {
  BffSessionResponse,
  BffSessionResult,
  SessionPayload,
  StoredTenant,
} from "./types";

const SESSION_SECRET_HEADER = "X-Civis-Bff-Session-Secret";
const DEV_SESSION_STORE_SECRET = "dev-ui-bff-session-secret-change-me";
const DEFAULT_REFRESH_THRESHOLD_SECONDS = 60;

type ApiEnvelope<T> = {
  data?: T;
};

type SessionRequestOptions = {
  touch?: boolean;
  refreshThresholdSeconds?: number;
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

function storeSecret(): string {
  return (
    getEnv("CIVIS_UI_AUTH_SESSION_API_SECRET") ??
    getEnv("BFF_SESSION_STORE_SECRET") ??
    DEV_SESSION_STORE_SECRET
  );
}

async function postSession<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  const base = coreUrl();
  if (!base) return null;

  const response = await fetch(`${base}/v1/ui/sessions${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      [SESSION_SECRET_HEADER]: storeSecret(),
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

export async function ensureBffSession(
  handle: string,
  options: SessionRequestOptions = {},
): Promise<BffSessionResponse> {
  const session = await readBffSession(handle, options.touch ?? false);
  if (session.status !== "ACTIVE" || !session.payload) {
    return session;
  }

  const threshold =
    options.refreshThresholdSeconds ?? DEFAULT_REFRESH_THRESHOLD_SECONDS;
  if (!shouldRefresh(session.payload, threshold)) {
    return session;
  }

  const refreshed = await refreshStoredTokens(handle, session.payload);
  if (refreshed && refreshed.status !== "INVALID") {
    return refreshed;
  }

  const recovered = await recoverAfterRefreshFailure(
    handle,
    session.payload,
    threshold,
  );
  return recovered ?? invalidSession("EXPIRED");
}

async function recoverAfterRefreshFailure(
  handle: string,
  previousPayload: SessionPayload,
  thresholdSeconds: number,
): Promise<BffSessionResponse | null> {
  const latest = await readBffSession(handle, false);
  if (latest.status !== "ACTIVE" || !latest.payload) {
    return latest;
  }

  if (!shouldRefresh(latest.payload, thresholdSeconds)) {
    return latest;
  }

  // A parallel request may have rotated tokens just before this refresh failed.
  // Trust the store if the token payload changed, even when it is still near
  // the threshold, so the losing request does not clear the session cookie.
  return tokenPayloadChanged(previousPayload, latest.payload) ? latest : null;
}

function shouldRefresh(
  payload: Pick<SessionPayload, "exp">,
  thresholdSeconds: number,
): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp - nowSeconds < thresholdSeconds;
}

function tokenPayloadChanged(
  previous: SessionPayload,
  latest: SessionPayload,
): boolean {
  return (
    previous.at !== latest.at ||
    previous.it !== latest.it ||
    previous.rt !== latest.rt ||
    previous.exp !== latest.exp
  );
}

async function refreshStoredTokens(
  handle: string,
  payload: SessionPayload,
): Promise<BffSessionResponse | null> {
  const casUrl = getEnv("CAS_ISSUER_URL");
  const clientId = getEnv("CAS_BFF_CLIENT_ID");
  const clientSecret = getEnv("CAS_BFF_CLIENT_SECRET");
  if (!casUrl || !clientId || !clientSecret) return null;

  const result = await refreshAccessToken({
    casUrl,
    clientId,
    clientSecret,
    refreshToken: payload.rt,
  }).catch(() => null);

  if (!result?.ok) return null;

  const { access_token, id_token, refresh_token, expires_in } = result.tokens;
  return replaceBffSessionTokens({
    handle,
    accessToken: access_token,
    idToken: id_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
  });
}
