function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function generateState(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

export function generateNonce(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

export async function generateCodeVerifier(): Promise<string> {
  // 96 random bytes → 128-char base64url string (within 43-128 char PKCE spec)
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(96)).buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64UrlEncode(hash);
}

export type PkceState = {
  state: string;
  nonce: string;
  codeVerifier: string;
};

export async function generatePkceState(): Promise<PkceState> {
  const codeVerifier = await generateCodeVerifier();
  return {
    state: generateState(),
    nonce: generateNonce(),
    codeVerifier,
  };
}
