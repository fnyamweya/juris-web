export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
};

export type Session = {
  status: "anonymous" | "authenticated";
  user?: User;
  currentTenant?: Tenant;
  availableTenants: Tenant[];
  roles: string[];
  permissions: string[];
  expiresAt?: string;
};

export type AuthenticatedSession = Session & {
  status: "authenticated";
  user: User;
  currentTenant: Tenant;
};

export type EnterpriseIdentityProvider = {
  id: string;
  name: string;
  kind: "oidc" | "saml";
  signInUrl: string;
};

export type AuthProviderContract = {
  getSession(): Promise<Session>;
  refreshSession(): Promise<Session>;
  logout(): Promise<void>;
  stepUp(reason: string): Promise<void>;
};

// ─── CAS JWT claim shapes ──────────────────────────────────────────────────

export type CasTenantMembership = {
  tenant_id: string;
  roles: string[];
  mfa_required: boolean;
  password_policy: string;
  status?: string;
};

export type CasAccessTokenClaims = {
  sub: string;
  identity_type: "USER" | "SERVICE";
  user_id: string;
  platform_roles: string[];
  tenant_memberships: CasTenantMembership[];
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  jti?: string;
};

export type CasIdTokenClaims = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  nonce?: string;
};

// ─── Encrypted session cookie payload ─────────────────────────────────────

export type StoredTenant = {
  id: string;
  name: string;
  slug: string;
};

export type SessionPayload = {
  /** Raw access token JWT */
  at: string;
  /** Raw id_token JWT */
  it: string;
  /** Opaque refresh token */
  rt: string;
  /** Access token expiry as unix seconds (matches JWT `exp`) */
  exp: number;
  /** Resolved tenant display data cached at login time */
  tenants: StoredTenant[];
};

// ─── PKCE state cookie payload ─────────────────────────────────────────────

export type PkcePayload = {
  state: string;
  nonce: string;
  codeVerifier: string;
  locale: string;
  returnTo?: string;
};
