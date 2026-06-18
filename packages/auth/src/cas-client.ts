export type CasTokenResponse = {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export type CasTokenError = {
  error: string;
  error_description?: string;
};

export type CasTokenResult =
  | { ok: true; tokens: CasTokenResponse }
  | { ok: false; error: CasTokenError };

async function postTokenRequest(
  tokenUrl: string,
  params: Record<string, string>,
  authorization: string,
): Promise<CasTokenResult> {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: authorization,
    },
    body: new URLSearchParams(params).toString(),
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    return { ok: false, error: data as CasTokenError };
  }

  return { ok: true, tokens: data as CasTokenResponse };
}

function basicAuth(clientId: string, clientSecret: string): string {
  return "Basic " + btoa(`${clientId}:${clientSecret}`);
}

export async function exchangeAuthorizationCode(params: {
  casUrl: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<CasTokenResult> {
  return postTokenRequest(
    `${params.casUrl}/oauth2/token`,
    {
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
    },
    basicAuth(params.clientId, params.clientSecret),
  );
}

type CasCsrfTokenResponse = {
  token: string;
  headerName: string;
  parameterName: string;
};

/**
 * Fetches a CSRF token bound to the caller's CAS session via `GET /csrf`, for forwarding on
 * mutating requests to CSRF-protected CAS endpoints (e.g. MFA factor lifecycle, AUTH-004).
 * Returns `null` if the CAS session is missing/invalid.
 */
export async function fetchCasCsrfHeaders(
  casUrl: string,
  cookie: string,
): Promise<Record<string, string> | null> {
  const response = await fetch(`${casUrl}/csrf`, { headers: { cookie } });
  if (!response.ok) {
    return null;
  }
  const { token, headerName } = (await response.json()) as CasCsrfTokenResponse;
  return { cookie, [headerName]: token };
}

