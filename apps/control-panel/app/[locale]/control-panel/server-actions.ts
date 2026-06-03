"use server";

import {
  createCivisClient,
  type CreatePolicyDefinitionRequest,
  type PolicyEffect,
  type PolicyLane,
  type PolicyScopeKind,
  type PolicyStatus,
  type ProviderProtocol,
  type ProviderType,
  type TenantIsolationStrategy,
  type TenantMarketAssignmentType,
  type TenantOrganizationRelationshipType,
  type UpdateTenantAuthConfigRequest,
  type UpsertFederatedProviderRequest,
  type UpsertPolicyBindingRequest,
} from "@repo/civis";
import { refreshUserPermissions, requirePermission } from "@repo/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function numberValue(formData: FormData, key: string, fallback: number) {
  const parsed = Number(value(formData, key));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function enabled(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function listValue(formData: FormData, key: string) {
  return (value(formData, key) ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function jsonObject(formData: FormData, key: string) {
  const raw = value(formData, key);
  if (!raw) return {};
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${key} must be a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

export async function onboardTenant(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const client = await createCivisClient();
  const displayName = value(formData, "displayName");

  if (!displayName) {
    throw new Error("Tenant display name is required");
  }

  const tenantRequest = {
    ...(value(formData, "tenantId")
      ? { tenantId: value(formData, "tenantId") as string }
      : {}),
    displayName,
    isolationStrategy:
      (value(formData, "isolationStrategy") as
        | TenantIsolationStrategy
        | undefined) ?? "SHARED_SCHEMA",
    region: value(formData, "region") ?? "local",
    plan: value(formData, "plan") ?? "STANDARD",
    placement: {
      ...(value(formData, "placementId")
        ? { placementId: value(formData, "placementId") as string }
        : {}),
      databaseGroup: value(formData, "databaseGroup") ?? "primary",
      ...(value(formData, "databaseName")
        ? { databaseName: value(formData, "databaseName") as string }
        : {}),
      ...(value(formData, "schemaName")
        ? { schemaName: value(formData, "schemaName") as string }
        : {}),
      datasourceKey: value(formData, "datasourceKey") ?? "shared",
    },
  };

  const tenant = await client.tenants.create(tenantRequest);
  const tenantId = tenant.tenantId ?? tenant.id;

  const marketCode = value(formData, "marketCode");
  if (marketCode) {
    await client.tenantContext.assignMarket(
      tenantId,
      marketCode,
      (value(formData, "marketAssignmentType") as
        | TenantMarketAssignmentType
        | undefined) ?? "HOME",
    );
  }

  const organizationId = value(formData, "organizationId");
  if (organizationId) {
    await client.tenantContext.assignOrganization(
      tenantId,
      organizationId,
      (value(formData, "organizationRelationshipType") as
        | TenantOrganizationRelationshipType
        | undefined) ?? "OWNER",
    );
  }

  const providerKey = value(formData, "providerKey");
  const providerProtocol =
    (value(formData, "providerProtocol") as ProviderProtocol | undefined) ??
    "OIDC";
  const providers: UpsertFederatedProviderRequest[] = [];
  if (providerKey) {
    const provider: UpsertFederatedProviderRequest = {
      providerKey,
      protocol: providerProtocol,
      type:
        (value(formData, "providerType") as ProviderType | undefined) ??
        (providerProtocol === "SAML2" ? "SAML2" : "OIDC"),
      enabled: enabled(formData, "providerEnabled"),
      displayName: value(formData, "providerDisplayName") ?? providerKey,
      autoProvision: enabled(formData, "autoProvision"),
      defaultRole: value(formData, "defaultRole") ?? "TENANT_MEMBER",
      allowedDomains: listValue(formData, "allowedDomains"),
      scopes: listValue(formData, "scopes"),
      provisioning: {
        scimEnabled: enabled(formData, "scimEnabled"),
        deprovisioningAction:
          (value(formData, "deprovisioningAction") as
            | "SUSPEND"
            | "REMOVE_MEMBERSHIP"
            | "NOOP"
            | undefined) ?? "SUSPEND",
        suspendOnDisable: true,
        reactivateOnLogin: true,
      },
    };
    const optionalProviderFields = [
      "issuerUri",
      "clientId",
      "clientSecretRef",
      "idpMetadataUrl",
      "idpEntityId",
      "singleSignOnServiceUrl",
    ] as const;
    for (const field of optionalProviderFields) {
      const fieldValue = value(formData, field);
      if (fieldValue) provider[field] = fieldValue;
    }
    const scimBaseUrl = value(formData, "scimBaseUrl");
    if (scimBaseUrl)
      provider.provisioning = { ...provider.provisioning, scimBaseUrl };
    const scimTokenRef = value(formData, "scimTokenRef");
    if (scimTokenRef)
      provider.provisioning = { ...provider.provisioning, scimTokenRef };
    providers.push(provider);
  }

  const authConfig: UpdateTenantAuthConfigRequest = {
    localPasswordEnabled: enabled(formData, "localPasswordEnabled"),
    externalOidcEnabled: providers.length > 0,
    mfaRequired: enabled(formData, "mfaRequired"),
    passwordPolicy:
      (value(formData, "passwordPolicy") as
        | "STANDARD"
        | "STRICT"
        | "HIGH_ASSURANCE"
        | undefined) ?? "STANDARD",
    accessTokenTtlSeconds: numberValue(formData, "accessTokenTtlSeconds", 900),
    refreshTokenTtlSeconds: numberValue(
      formData,
      "refreshTokenTtlSeconds",
      28_800,
    ),
    mfaPolicy: {
      mode:
        (value(formData, "mfaMode") as
          | "OFF"
          | "REQUIRED_FOR_ALL"
          | "ROLE_BASED"
          | "ADAPTIVE"
          | undefined) ?? "OFF",
      allowedMethods: listValue(formData, "allowedMethods"),
      maxAgeSeconds: numberValue(formData, "mfaMaxAgeSeconds", 300),
      enrollmentGracePeriodDays: numberValue(
        formData,
        "enrollmentGracePeriodDays",
        0,
      ),
      rememberDeviceDays: numberValue(formData, "rememberDeviceDays", 0),
      stepUpForSensitiveActions: enabled(formData, "stepUpForSensitiveActions"),
    },
    passwordPolicyConfig: {
      minLength: numberValue(formData, "passwordMinLength", 12),
      requireUppercase: enabled(formData, "requireUppercase"),
      requireLowercase: enabled(formData, "requireLowercase"),
      requireNumber: enabled(formData, "requireNumber"),
      requireSymbol: enabled(formData, "requireSymbol"),
      passwordHistoryCount: numberValue(formData, "passwordHistoryCount", 5),
      maxAgeDays: numberValue(formData, "passwordMaxAgeDays", 90),
      lockoutAfterFailures: numberValue(formData, "lockoutAfterFailures", 5),
      lockoutDurationSeconds: numberValue(
        formData,
        "lockoutDurationSeconds",
        900,
      ),
    },
    sessionPolicy: {
      refreshTokenRotationEnabled: enabled(
        formData,
        "refreshTokenRotationEnabled",
      ),
      idleSessionTimeoutSeconds: numberValue(
        formData,
        "idleSessionTimeoutSeconds",
        3600,
      ),
      maxSessionLifetimeSeconds: numberValue(
        formData,
        "maxSessionLifetimeSeconds",
        43_200,
      ),
      absoluteRefreshTokenLifetimeSeconds: numberValue(
        formData,
        "absoluteRefreshTokenLifetimeSeconds",
        604_800,
      ),
    },
    externalIdentityProviders: providers,
  };

  const preview = await client.authConfig.preview(tenantId, authConfig);
  if (!preview.valid) {
    throw new Error(
      preview.violations.map((violation) => violation.message).join(", "),
    );
  }
  await client.authConfig.update(tenantId, authConfig);

  const ownerEmail = value(formData, "ownerEmail");
  if (ownerEmail) {
    await client.members.create(tenantId, {
      email: ownerEmail,
      displayName: value(formData, "ownerDisplayName") ?? ownerEmail,
      identityProviderSubject:
        value(formData, "ownerIdentityProviderSubject") ??
        `civis-auth|${ownerEmail}`,
      roles: listValue(formData, "ownerRoles"),
    });
  }

  const policyKey = value(formData, "policyKey");
  const policyKind = value(formData, "policyKind");
  if (policyKey && policyKind) {
    const policyRequest: UpsertPolicyBindingRequest = {
      policyKind,
      schemaVersion: numberValue(formData, "policySchemaVersion", 1),
      scopeKind:
        (value(formData, "policyScopeKind") as PolicyScopeKind | undefined) ??
        "TENANT",
      scopeRef: value(formData, "policyScopeRef") ?? tenantId,
      lane:
        (value(formData, "policyLane") as PolicyLane | undefined) ?? "NORMAL",
      effect:
        (value(formData, "policyEffect") as PolicyEffect | undefined) ??
        "APPLY",
      status:
        (value(formData, "policyStatus") as PolicyStatus | undefined) ??
        "ACTIVE",
      precedence: numberValue(formData, "policyPrecedence", 1000),
      value: jsonObject(formData, "policyValue"),
      reason:
        value(formData, "policyReason") ?? "Tenant onboarding policy seed",
    };
    await client.policies.upsertBinding(policyKey, policyRequest);
  }

  revalidatePath(`/${locale}/control-panel`);
  redirect(`/${locale}/control-panel/tenants/${tenantId}`);
}

export async function tenantLifecycleAction(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const tenantId = value(formData, "tenantId");
  const action = value(formData, "action");

  if (!tenantId) throw new Error("tenantId is required");

  const client = await createCivisClient();
  if (action === "activate") await client.tenants.activate(tenantId);
  if (action === "suspend") await client.tenants.suspend(tenantId);
  if (action === "archive") await client.tenants.archive(tenantId);

  revalidatePath(`/${locale}/control-panel/tenants/${tenantId}`);
}

export async function inviteTenantMember(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const tenantId = value(formData, "tenantId");
  const email = value(formData, "email");

  if (!tenantId || !email) throw new Error("tenantId and email are required");

  const client = await createCivisClient();
  await client.members.create(tenantId, {
    email,
    displayName: value(formData, "displayName") ?? email,
    identityProviderSubject:
      value(formData, "identityProviderSubject") ?? `civis-auth|${email}`,
    roles: listValue(formData, "roles"),
  });

  revalidatePath(`/${locale}/control-panel/tenants/${tenantId}`);
}

export async function tenantMemberLifecycleAction(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const tenantId = value(formData, "tenantId");
  const userId = value(formData, "userId");
  const action = value(formData, "action");

  if (!tenantId || !userId) throw new Error("tenantId and userId are required");

  const client = await createCivisClient();
  if (action === "activate") await client.members.activate(tenantId, userId);
  if (action === "suspend") await client.members.suspend(tenantId, userId);
  if (action === "remove") await client.members.remove(tenantId, userId);

  // Status changes affect what the user can access — propagate immediately.
  await refreshUserPermissions(userId).catch(() => {});

  revalidatePath(`/${locale}/control-panel/tenants/${tenantId}`);
}

export async function assignTenantRole(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const tenantId = value(formData, "tenantId");
  const userId = value(formData, "userId");
  const roleId = value(formData, "roleId");

  if (!tenantId || !userId || !roleId) {
    throw new Error("tenantId, userId, and roleId are required");
  }

  const client = await createCivisClient();
  await client.members.assignRole(tenantId, userId, roleId);

  // Role change — propagate updated permissions to active sessions immediately.
  await refreshUserPermissions(userId).catch(() => {});

  revalidatePath(`/${locale}/control-panel/tenants/${tenantId}`);
}

export async function updateTenantAuthPolicies(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const tenantId = value(formData, "tenantId");

  if (!tenantId) throw new Error("tenantId is required");

  const client = await createCivisClient();
  await client.authConfig.updateMfaPolicy(tenantId, {
    mode:
      (value(formData, "mfaMode") as
        | "OFF"
        | "REQUIRED_FOR_ALL"
        | "ROLE_BASED"
        | "ADAPTIVE"
        | undefined) ?? "OFF",
    allowedMethods: listValue(formData, "allowedMethods"),
    maxAgeSeconds: numberValue(formData, "mfaMaxAgeSeconds", 300),
    enrollmentGracePeriodDays: numberValue(
      formData,
      "enrollmentGracePeriodDays",
      0,
    ),
    rememberDeviceDays: numberValue(formData, "rememberDeviceDays", 0),
    stepUpForSensitiveActions: enabled(formData, "stepUpForSensitiveActions"),
  });
  await client.authConfig.updateSessionPolicy(tenantId, {
    refreshTokenRotationEnabled: enabled(
      formData,
      "refreshTokenRotationEnabled",
    ),
    idleSessionTimeoutSeconds: numberValue(
      formData,
      "idleSessionTimeoutSeconds",
      3600,
    ),
    maxSessionLifetimeSeconds: numberValue(
      formData,
      "maxSessionLifetimeSeconds",
      43_200,
    ),
    absoluteRefreshTokenLifetimeSeconds: numberValue(
      formData,
      "absoluteRefreshTokenLifetimeSeconds",
      604_800,
    ),
  });

  revalidatePath(`/${locale}/control-panel/tenants/${tenantId}`);
}

export async function assignTenantContext(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const tenantId = value(formData, "tenantId");
  const marketCode = value(formData, "marketCode");
  const organizationId = value(formData, "organizationId");

  if (!tenantId) throw new Error("tenantId is required");

  const client = await createCivisClient();
  if (marketCode) {
    await client.tenantContext.assignMarket(
      tenantId,
      marketCode,
      (value(formData, "marketAssignmentType") as
        | TenantMarketAssignmentType
        | undefined) ?? "OPERATING",
    );
  }
  if (organizationId) {
    await client.tenantContext.assignOrganization(
      tenantId,
      organizationId,
      (value(formData, "organizationRelationshipType") as
        | TenantOrganizationRelationshipType
        | undefined) ?? "OPERATING",
    );
  }

  revalidatePath(`/${locale}/control-panel/tenants/${tenantId}`);
}

export async function upsertPolicyBinding(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const tenantId = value(formData, "tenantId");
  const policyKey = value(formData, "policyKey");
  const policyKind = value(formData, "policyKind");

  if (!policyKey || !policyKind) {
    throw new Error("policyKey and policyKind are required");
  }

  const client = await createCivisClient();
  const scopeRef = value(formData, "scopeRef") ?? tenantId;
  const request: UpsertPolicyBindingRequest = {
    policyKind,
    schemaVersion: numberValue(formData, "schemaVersion", 1),
    scopeKind:
      (value(formData, "scopeKind") as PolicyScopeKind | undefined) ?? "TENANT",
    lane: (value(formData, "lane") as PolicyLane | undefined) ?? "NORMAL",
    effect: (value(formData, "effect") as PolicyEffect | undefined) ?? "APPLY",
    status: (value(formData, "status") as PolicyStatus | undefined) ?? "ACTIVE",
    precedence: numberValue(formData, "precedence", 1000),
    value: jsonObject(formData, "policyValue"),
    reason: value(formData, "reason") ?? "Control panel policy update",
  };
  if (scopeRef) request.scopeRef = scopeRef;
  await client.policies.upsertBinding(policyKey, request);

  revalidatePath(`/${locale}/control-panel/policies`);
  if (tenantId) revalidatePath(`/${locale}/control-panel/tenants/${tenantId}`);
}

export async function createPolicyDefinition(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const policyKind = value(formData, "policyKind");

  if (!policyKind) {
    throw new Error("policyKind is required");
  }

  const request: CreatePolicyDefinitionRequest = {
    policyKind,
    schemaVersion: numberValue(formData, "schemaVersion", 1),
    valueSchema: jsonObject(formData, "valueSchema"),
    requiresFallback: enabled(formData, "requiresFallback"),
    supportedScopeKinds: listValue(
      formData,
      "supportedScopeKinds",
    ) as PolicyScopeKind[],
    supportedPolicyKeys: listValue(formData, "supportedPolicyKeys"),
  };

  const description = value(formData, "description");
  if (description) request.description = description;

  const compatibilityMode = value(formData, "compatibilityMode");
  if (compatibilityMode) request.compatibilityMode = compatibilityMode;

  const defaultResolutionProfileId = value(
    formData,
    "defaultResolutionProfileId",
  );
  if (defaultResolutionProfileId) {
    request.defaultResolutionProfileId = defaultResolutionProfileId;
  }

  const client = await createCivisClient();
  await client.policies.createDefinition(request);

  revalidatePath(`/${locale}/control-panel/policies`);
}

export async function policyDefinitionLifecycleAction(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const policyKind = value(formData, "policyKind");
  const action = value(formData, "action");

  if (!policyKind || !action) {
    throw new Error("policyKind and action are required");
  }

  const schemaVersion = numberValue(formData, "schemaVersion", 1);
  const client = await createCivisClient();

  if (action === "activate") {
    await client.policies.activateDefinition(policyKind, schemaVersion);
  }
  if (action === "deprecate") {
    await client.policies.deprecateDefinition(
      policyKind,
      schemaVersion,
      enabled(formData, "force"),
    );
  }

  revalidatePath(`/${locale}/control-panel/policies`);
}

export async function invalidatePolicyCache(formData: FormData) {
  await requirePermission("control-panel:write");

  const locale = value(formData, "locale") ?? "en";
  const client = await createCivisClient();
  await client.policies.invalidateCache();

  revalidatePath(`/${locale}/control-panel/policies`);
}
