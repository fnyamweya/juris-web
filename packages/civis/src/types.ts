// ─── User preferences ─────────────────────────────────────────────────────────

export type ThemePreference = "light" | "dark" | "system";
export type DensityPreference = "compact" | "comfortable" | "spacious";
export type FontSizePreference = "sm" | "md" | "lg" | "xl";

export type AppearancePreferences = {
  theme: ThemePreference;
  density: DensityPreference;
  fontSize: FontSizePreference;
  reduceMotion: boolean;
  highContrast: boolean;
};

export type LocalePreferences = {
  language: string;
  timezone: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  numberFormat: "eu" | "us";
  currency: string;
};

export type MarketingPreferences = {
  emailMarketing: boolean;
  productUpdates: boolean;
  researchInvitations: boolean;
  partnerOffers: boolean;
};

export type PrivacyPreferences = {
  analytics: boolean;
  crashReporting: boolean;
  performanceMonitoring: boolean;
  personalization: boolean;
};

export type MfaMethodPreference = "totp" | "webauthn" | null;

export type MfaPreferences = {
  preferredMethod: MfaMethodPreference;
  rememberDeviceDays: number;
};

export type UserPreferences = {
  appearance: AppearancePreferences;
  locale: LocalePreferences;
  marketing: MarketingPreferences;
  privacy: PrivacyPreferences;
  mfa: MfaPreferences;
  updatedAt: string | null;
};

export type NotificationDigestFrequency = "instant" | "hourly" | "daily" | "weekly" | "none";

export type NotificationChannels = {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
};

export type NotificationDigest = {
  frequency: NotificationDigestFrequency;
  hourUtc: number;
};

export type NotificationCategories = {
  securityAlerts: boolean;
  memberEvents: boolean;
  billingEvents: boolean;
  systemAnnouncements: boolean;
  customEvents: boolean;
};

export type NotificationPreferences = {
  channels: NotificationChannels;
  digest: NotificationDigest;
  categories: NotificationCategories;
};

export type LocalizationPreferences = {
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  numberFormat: "eu" | "us";
  currencyDisplay: "code" | "symbol";
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export type UserTenantPreferences = {
  notifications: NotificationPreferences;
  localization: LocalizationPreferences;
  updatedAt: string | null;
};

export type TermsAcceptance = {
  id: string;
  termsVersion: string;
  acceptedAt: string;
  locale: string | null;
  channel: string;
};

export type TermsStatus = {
  latest: TermsAcceptance | null;
  history: TermsAcceptance[];
};

export type ActiveSession = {
  id: string;
  tenantId: string | null;
  status: string;
  createdAt: string;
  lastActivityAt: string;
  accessTokenExpiresAt: string;
  absoluteExpiresAt: string;
  clientIp: string | null;
  userAgentHash: string | null;
  amr: string[];
  acr: string | null;
  mfaCompletedAt: string | null;
  idleTimeoutSeconds: number;
};

export type TrustedDevice = {
  id: string;
  label: string;
  trustedAt: string;
  expiresAt: string;
  lastSeenAt: string | null;
  lastIp: string | null;
  userAgentHint: string | null;
};

// ─── Shared pagination ─────────────────────────────────────────────────────────

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

export type TenantStatus = "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type TenantPlan =
  | "FREE"
  | "STARTER"
  | "STANDARD"
  | "BUSINESS"
  | "ENTERPRISE"
  | (string & {});
export type TenantIsolationStrategy =
  | "SHARED_SCHEMA"
  | "SEPARATE_SCHEMA"
  | "SEPARATE_DATABASE";
export type TenantPlacementStatus =
  | "PENDING"
  | "READY"
  | "MIGRATING"
  | "FAILED"
  | "RETIRED";

export type Tenant = {
  tenantId: string;
  id: string;
  displayName: string;
  slug: string;
  status: TenantStatus;
  plan: TenantPlan;
  region: string;
  isolationStrategy: TenantIsolationStrategy;
  createdAt: string;
  updatedAt: string;
};

export type CreateTenantRequest = {
  tenantId?: string;
  displayName: string;
  isolationStrategy: TenantIsolationStrategy;
  region: string;
  plan: TenantPlan;
  placement: {
    placementId?: string;
    databaseGroup: string;
    databaseName?: string;
    schemaName?: string;
    datasourceKey: string;
  };
};

export type ListTenantsParams = ListParams & {
  status?: TenantStatus;
  region?: string;
  plan?: TenantPlan;
  createdAfter?: string;
  createdBefore?: string;
  sort?: string;
};

export type TenantPlacement = {
  placementId: string;
  tenantId: string;
  strategy: TenantIsolationStrategy;
  databaseGroup: string;
  databaseName?: string | null;
  schemaName?: string | null;
  datasourceKey: string;
  migrationVersion?: string | null;
  status: TenantPlacementStatus;
  createdAt: string;
  updatedAt: string;
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
  createdAfter?: string;
  createdBefore?: string;
  sort?: string;
};

export type InviteMemberRequest = {
  email: string;
  displayName: string;
  roles?: string[];
};

export type PasswordResetIssued = {
  link: string;
  expiresAt: string;
  emailDispatched: boolean;
  warning?: string | null;
};

export type AssignRoleResponse = {
  status:
    | "EXECUTED"
    | "HELD"
    | "JUSTIFICATION_REQUIRED"
    | "MFA_REQUIRED"
    | "REJECTED";
  caseId?: string | null;
  executionId?: string | null;
  reasonCodes?: string[];
  requiredControls?: Array<Record<string, unknown>>;
};

// ─── Roles ────────────────────────────────────────────────────────────────────

export type Role = {
  roleId?: string;
  id: string;
  displayName?: string;
  scope: "PLATFORM" | "TENANT";
  description?: string;
  createdAt?: string;
};

// ─── Auth config ──────────────────────────────────────────────────────────────

export type MfaMode = "OFF" | "REQUIRED_FOR_ALL" | "ROLE_BASED" | "ADAPTIVE";
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
  authorizationUri?: string;
  tokenUri?: string;
  jwksUri?: string;
  clientId?: string;
  clientSecretConfigured?: boolean;
  idpMetadataUrl?: string;
  idpMetadataXmlConfigured?: boolean;
  idpEntityId?: string;
  singleSignOnServiceUrl?: string;
  spEntityId?: string;
  acsUrl?: string;
  signingCredentialConfigured?: boolean;
  decryptionCredentialConfigured?: boolean;
  nameIdFormat?: string;
  idpVerificationCertificatesConfigured?: boolean;
  provisioning?: ProvisioningSettings;
  scopes?: string[];
  attributeMapping?: Record<string, string>;
  advancedSettings?: Record<string, unknown>;
};

export type MfaPolicy = {
  mode: MfaMode;
  maxAgeSeconds?: number;
  enrollmentGracePeriodDays?: number;
  rememberDeviceDays?: number;
  stepUpForSensitiveActions?: boolean;
  allowedMethods?: string[];
  roleRequirements?: Array<{
    role: string;
    requirement: "REQUIRED" | "OPTIONAL" | "DISABLED";
    methods?: string[];
    maxAgeSeconds?: number;
  }>;
};

export type SessionPolicy = {
  refreshTokenRotationEnabled?: boolean;
  idleSessionTimeoutSeconds?: number;
  maxSessionLifetimeSeconds?: number;
  absoluteRefreshTokenLifetimeSeconds?: number;
  /** Seconds before idle expiry to show the session warning. Must be < idleSessionTimeoutSeconds. */
  warningBeforeTimeoutSeconds?: number;
  /** Maximum concurrent active sessions per user. Oldest session is revoked when exceeded. null = unlimited. */
  maxConcurrentSessions?: number | null;
};

export type SsoEnforcementMode = "OPTIONAL" | "PREFERRED" | "REQUIRED";

export type AccountLifecyclePolicy = {
  /** Suspend the user account after this many days of inactivity. null = disabled. */
  inactiveAccountSuspendAfterDays?: number | null;
  /** Send a warning email this many days before suspension. null = no warning. */
  inactiveAccountWarnAfterDays?: number | null;
  /** Permanently delete deactivated accounts after this many days. null = never. */
  deleteDeactivatedAfterDays?: number | null;
};

export type PasswordPolicyConfig = {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSymbol?: boolean;
  passwordHistoryCount?: number;
  maxAgeDays?: number;
  lockoutAfterFailures?: number;
  lockoutDurationSeconds?: number;
};

export type ProvisioningSettings = {
  scimEnabled?: boolean;
  scimBaseUrl?: string;
  scimTokenConfigured?: boolean;
  scimTokenRef?: string;
  deprovisioningAction?: "SUSPEND" | "REMOVE_MEMBERSHIP" | "NOOP";
  suspendOnDisable?: boolean;
  reactivateOnLogin?: boolean;
};

export type TenantAuthConfig = {
  tenantId: string;
  localPasswordEnabled: boolean;
  externalOidcEnabled: boolean;
  externalFederationEnabled?: boolean;
  mfaRequired: boolean;
  passwordPolicy: "STANDARD" | "STRICT" | "HIGH_ASSURANCE";
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  mfaPolicy: MfaPolicy;
  passwordPolicyConfig: PasswordPolicyConfig;
  sessionPolicy: SessionPolicy;
  externalIdentityProviders: FederatedProvider[];
  federatedProviders?: FederatedProvider[];
  ssoEnforcementMode?: SsoEnforcementMode;
  accountLifecyclePolicy?: AccountLifecyclePolicy | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAccountLifecyclePolicyRequest = AccountLifecyclePolicy;

export type UpdateMfaPolicyRequest = MfaPolicy;

export type UpdateSessionPolicyRequest = SessionPolicy;

export type UpsertFederatedProviderRequest = {
  providerKey: string;
  type: ProviderType;
  protocol: ProviderProtocol;
  displayName: string;
  enabled: boolean;
  issuerUri?: string;
  clientId?: string;
  clientSecretRef?: string;
  authorizationUri?: string;
  tokenUri?: string;
  jwksUri?: string;
  idpMetadataUrl?: string;
  idpMetadataXml?: string;
  idpEntityId?: string;
  singleSignOnServiceUrl?: string;
  spEntityId?: string;
  acsUrl?: string;
  signingCredentialRefs?: string[];
  decryptionCredentialRefs?: string[];
  nameIdFormat?: string;
  idpVerificationCertificateRefs?: string[];
  idpVerificationCertificates?: string[];
  allowedDomains?: string[];
  autoProvision?: boolean;
  defaultRole?: string;
  provisioning?: ProvisioningSettings;
  scopes?: string[];
  attributeMapping?: {
    subject?: string;
    email?: string;
    displayName?: string;
    groups?: string;
  };
  advancedSettings?: Record<string, unknown>;
};

export type FederatedProviderSetup = {
  providerKey: string;
  protocol: ProviderProtocol;
  enabled: boolean;
  status: string;
  loginUrl: string;
  spMetadataUrl?: string | null;
  acsUrl?: string | null;
  expectedAudience?: string | null;
  checks: Array<{ name: string; passed: boolean; message?: string }>;
  recoveryControls?: Record<string, unknown>;
  provisioning?: ProvisioningSettings;
};

export type UpdateTenantAuthConfigRequest = {
  localPasswordEnabled: boolean;
  externalOidcEnabled: boolean;
  mfaRequired: boolean;
  passwordPolicy: "STANDARD" | "STRICT" | "HIGH_ASSURANCE";
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  mfaPolicy?: MfaPolicy;
  passwordPolicyConfig?: PasswordPolicyConfig;
  sessionPolicy?: SessionPolicy;
  externalIdentityProviders?: UpsertFederatedProviderRequest[];
};

export type TenantAuthConfigEffective = {
  config: TenantAuthConfig;
  requiresMfa: boolean;
  privilegedRolesRequireMfa: boolean;
  sources: Array<Record<string, unknown>>;
  derived: Record<string, unknown>;
};

export type TenantAuthConfigPreview = {
  valid: boolean;
  violations: Array<{ field?: string; message: string; code?: string }>;
  warnings: Array<{ field?: string; message: string; code?: string }>;
  risk?: Record<string, unknown>;
  changes: Array<Record<string, unknown>>;
  effectivePolicy: TenantAuthConfigEffective;
  proposedConfig: TenantAuthConfig;
};

export type TenantAuthConfigRevision = {
  versionId: string;
  tenantId: string;
  version: number;
  status: string;
  changeReason?: string;
  riskLevel?: string;
  riskSummary?: Record<string, unknown>;
  semanticDiff?: Array<Record<string, unknown>>;
  config: TenantAuthConfig;
  createdBy?: string;
  approvedBy?: string;
  effectiveAt?: string;
  createdAt: string;
};

export type FederatedAttributePreview = {
  providerKey: string;
  subject?: string;
  email?: string;
  displayName?: string;
  groups?: string[];
  attributes?: Record<string, unknown>;
};

export type TenantMarketAssignmentType = "HOME" | "OPERATING";
export type TenantMarketContext = {
  tenantId: string;
  homeMarketCode?: string | null;
  operatingMarketCodes: string[];
  jurisdictionCodes: string[];
  countryCodes: string[];
};

export type TenantMarketAssignment = {
  tenantId: string;
  marketCode: string;
  assignmentType: TenantMarketAssignmentType;
  validFrom: string;
  assignmentId: string;
};

export type TenantOrganizationRelationshipType =
  | "OWNER"
  | "OPERATING"
  | "BILLING";
export type TenantOrganizationContext = {
  tenantId: string;
  ownerOrganizationId?: string | null;
  billingOrganizationId?: string | null;
  operatingOrganizationIds: string[];
};

export type TenantOrganizationLink = {
  linkId: string;
  tenantId: string;
  organizationId: string;
  relationshipType: TenantOrganizationRelationshipType;
  validFrom: string;
};

export type PolicyScopeKind =
  | "GLOBAL"
  | "COUNTRY"
  | "COUNTRY_SUBDIVISION"
  | "JURISDICTION"
  | "MARKET"
  | "ORGANIZATION"
  | "TENANT"
  | "SUBJECT";
export type PolicyLane = "EMERGENCY" | "NORMAL" | "FALLBACK";
export type PolicyEffect =
  | "ENABLE"
  | "DISABLE"
  | "REQUIRE"
  | "FORBID"
  | "APPLY";
export type PolicyStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "RETIRED";

export type PolicyBinding = {
  bindingId: string;
  policyKind: string;
  policyKey: string;
  schemaVersion: number;
  scopeKind: PolicyScopeKind;
  scopeRef?: string | null;
  effect: PolicyEffect;
  value: Record<string, unknown>;
  precedence: number;
  lane: PolicyLane;
  status: PolicyStatus;
  validFrom: string;
  validTo?: string | null;
  version: number;
};

export type UpsertPolicyBindingRequest = {
  policyKind: string;
  schemaVersion: number;
  scopeKind: PolicyScopeKind;
  scopeRef?: string;
  lane?: PolicyLane;
  effect: PolicyEffect;
  value?: Record<string, unknown>;
  conditionExpr?: Record<string, unknown>;
  status?: PolicyStatus;
  precedence?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdBy?: string;
  approvedBy?: string;
  approvalRef?: string;
  reason?: string;
  idempotencyKey?: string;
  correlationId?: string;
};

export type PolicyMutationDecision = {
  status: AssignRoleResponse["status"];
  caseId?: string | null;
  executionId?: string | null;
  reasonCodes?: string[];
  requiredControls?: Array<Record<string, unknown>>;
};

export type EffectivePolicyDecision = {
  policyKind: string;
  policyKey: string;
  decision: unknown;
  source: Record<string, unknown>;
  resolution: Record<string, unknown>;
  explain?: Record<string, unknown> | null;
};

export type PolicyDefinition = {
  policyKind: string;
  schemaVersion: number;
  status: string;
  compatibilityMode?: string;
  requiresFallback: boolean;
  defaultResolutionProfileId?: string;
  supportedScopeKinds?: PolicyScopeKind[];
  supportedPolicyKeys?: string[];
  valueSchema: Record<string, unknown>;
};

export type CreatePolicyDefinitionRequest = {
  policyKind: string;
  schemaVersion: number;
  description?: string;
  valueSchema: Record<string, unknown>;
  requiresFallback: boolean;
  supportedScopeKinds?: PolicyScopeKind[];
  supportedPolicyKeys?: string[];
  compatibilityMode?: string;
  defaultResolutionProfileId?: string;
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

// ─── Language catalog ─────────────────────────────────────────────────────────

export type LanguageStatus = "ACTIVE" | "BETA" | "DISABLED";
export type TextDirection = "ltr" | "rtl";

export type Language = {
  code: string;
  name: string;
  nativeName: string;
  direction: TextDirection;
  status: LanguageStatus;
  sortOrder: number;
};

// ─── Legal documents ──────────────────────────────────────────────────────────

export type LegalDocumentType =
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "COOKIE_POLICY"
  | "DATA_PROCESSING_AGREEMENT";

export type LegalDocumentStatus = "DRAFT" | "ACTIVE" | "SUPERSEDED" | "RETIRED";

export type LegalDocument = {
  id: string;
  documentType: LegalDocumentType;
  jurisdictionCode: string;
  tenantId: string | null;
  language: string;
  version: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  title: string;
  contentUrl: string;
  status: LegalDocumentStatus;
  requiresAcceptance: boolean;
};

export type LegalAcceptance = {
  id: string;
  documentId: string;
  documentType: LegalDocumentType;
  documentVersion: string;
  jurisdictionCode: string;
  language: string;
  acceptedAt: string;
  channel: string;
};

export type LegalStatus = {
  pendingDocumentIds: string[];
  requiresAction: boolean;
};
