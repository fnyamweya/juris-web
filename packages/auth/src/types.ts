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
