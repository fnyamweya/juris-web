// ─── Shared pagination ────────────────────────────────────────────────────────

export type CursorPage<T> = {
  data: T[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
  };
};

export type ListParams = {
  limit?: number;
  cursor?: string;
  search?: string;
};

// ─── Tenants ──────────────────────────────────────────────────────────────────

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED" | "PENDING";
export type TenantPlan = "FREE" | "STARTER" | "BUSINESS" | "ENTERPRISE";

export type Tenant = {
  id: string;
  displayName: string;
  slug: string;
  status: TenantStatus;
  plan: TenantPlan;
  region: string;
  isolationStrategy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTenantRequest = {
  tenantId?: string;
  displayName: string;
  isolationStrategy?: string;
  region?: string;
  plan?: TenantPlan;
};

export type ListTenantsParams = ListParams & {
  status?: TenantStatus;
  region?: string;
  plan?: TenantPlan;
};

// ─── Platform users ───────────────────────────────────────────────────────────

export type UserStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE" | "PENDING";

export type PlatformUser = {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  platformRoles: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateUserRequest = {
  email: string;
  displayName: string;
  identityProviderSubject?: string;
};

export type ListUsersParams = ListParams & {
  status?: UserStatus;
  role?: string;
  tenantId?: string;
};

// ─── Tenant members ───────────────────────────────────────────────────────────

export type MemberStatus = "ACTIVE" | "SUSPENDED" | "REMOVED" | "PENDING";

export type TenantMember = {
  userId: string;
  tenantId: string;
  email: string;
  displayName: string;
  status: MemberStatus;
  roles: string[];
  mfaRequired: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateMemberRequest = {
  email: string;
  displayName: string;
  identityProviderSubject?: string;
  roles?: string[];
};

export type ListMembersParams = ListParams & {
  status?: MemberStatus;
  role?: string;
};

export type AssignRoleResponse = {
  status: "APPLIED" | "HELD" | "MFA_REQUIRED";
  caseId?: string;
  requiredControls?: string[];
};

// ─── Roles ────────────────────────────────────────────────────────────────────

export type Role = {
  id: string;
  displayName: string;
  scope: "PLATFORM" | "TENANT";
  description?: string;
};

// ─── Auth config ──────────────────────────────────────────────────────────────

export type MfaMode = "DISABLED" | "OPTIONAL" | "REQUIRED";
export type ProviderType =
  | "GOOGLE"
  | "MICROSOFT"
  | "OKTA"
  | "ONELOGIN"
  | "PING_IDENTITY"
  | "OIDC"
  | "SAML2";
export type ProviderProtocol = "OIDC" | "SAML2";

export type FederatedProvider = {
  providerKey: string;
  type: ProviderType;
  protocol: ProviderProtocol;
  displayName: string;
  enabled: boolean;
  allowedDomains?: string[];
  autoProvision?: boolean;
  defaultRole?: string;
  issuerUri?: string;
  clientId?: string;
};

export type MfaPolicy = {
  mode: MfaMode;
  maxAgeSeconds?: number;
  allowedMethods?: string[];
  roleRequirements?: Array<{ role: string; required: boolean }>;
};

export type SessionPolicy = {
  refreshTokenRotationEnabled?: boolean;
  idleSessionTimeoutSeconds?: number;
  absoluteSessionTimeoutSeconds?: number;
};

export type TenantAuthConfig = {
  tenantId: string;
  mfaPolicy: MfaPolicy;
  sessionPolicy: SessionPolicy;
  federatedProviders: FederatedProvider[];
  version: number;
  updatedAt: string;
};

export type UpdateMfaPolicyRequest = {
  mode: MfaMode;
  maxAgeSeconds?: number;
  allowedMethods?: string[];
  roleRequirements?: Array<{ role: string; required: boolean }>;
};

export type UpdateSessionPolicyRequest = {
  refreshTokenRotationEnabled?: boolean;
  idleSessionTimeoutSeconds?: number;
  absoluteSessionTimeoutSeconds?: number;
};

export type UpsertFederatedProviderRequest = {
  providerKey: string;
  type: ProviderType;
  protocol: ProviderProtocol;
  displayName: string;
  enabled: boolean;
  issuerUri?: string;
  clientId?: string;
  clientSecretRef?: string;
  allowedDomains?: string[];
  autoProvision?: boolean;
  defaultRole?: string;
  attributeMapping?: Record<string, string>;
};

export type FederatedProviderSetup = {
  spMetadataUrl: string;
  acsUrl: string;
  entityId: string;
  readinessChecks: Array<{ name: string; passed: boolean; message?: string }>;
};

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditSeverity = "info" | "warning" | "critical";

export type AuditEvent = {
  id: string;
  actor: string;
  actorId?: string;
  action: string;
  resourceKind?: string;
  resourceId?: string;
  target?: string;
  tenantId?: string;
  severity: AuditSeverity;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

export type ListAuditEventsParams = ListParams & {
  tenantId?: string;
  actorId?: string;
  severity?: AuditSeverity;
  action?: string;
  from?: string;
  to?: string;
};
