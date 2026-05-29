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

export async function refreshAccessToken(params: {
  casUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<CasTokenResult> {
  return postTokenRequest(
    `${params.casUrl}/oauth2/token`,
    {
      grant_type: "refresh_token",
      refresh_token: params.refreshToken,
    },
    basicAuth(params.clientId, params.clientSecret),
  );
}

export async function revokeToken(params: {
  casUrl: string;
  clientId: string;
  clientSecret: string;
  token: string;
  tokenTypeHint?: "refresh_token" | "access_token";
}): Promise<void> {
  await fetch(`${params.casUrl}/oauth2/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuth(params.clientId, params.clientSecret),
    },
    body: new URLSearchParams({
      token: params.token,
      ...(params.tokenTypeHint ? { token_type_hint: params.tokenTypeHint } : {}),
    }).toString(),
  });
}
