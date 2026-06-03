import type { Http } from "../http";
import type {
  CreatePolicyDefinitionRequest,
  EffectivePolicyDecision,
  PolicyBinding,
  PolicyDefinition,
  PolicyMutationDecision,
  PolicyStatus,
  UpsertPolicyBindingRequest,
} from "../types";

type PolicyMutationResponse = PolicyBinding | PolicyMutationDecision;

type TransitionRequest = {
  reason?: string;
  approvedBy?: string;
  idempotencyKey?: string;
  correlationId?: string;
};

export function createPoliciesResource(http: Http) {
  async function transition(
    policyKey: string,
    bindingId: string,
    transitionName: "activate" | "suspend" | "retire",
    req?: TransitionRequest,
  ): Promise<PolicyMutationResponse> {
    const res = await http.post<PolicyMutationResponse>(
      `/platform/api/v1/policies/${policyKey}/bindings/${bindingId}/${transitionName}`,
      req,
    );
    return res!.data;
  }

  return {
    async listBindings(
      policyKey: string,
      policyKind: string,
    ): Promise<PolicyBinding[]> {
      const res = await http.get<PolicyBinding[]>(
        `/platform/api/v1/policies/${policyKey}/bindings`,
        { policyKind },
      );
      return res.data;
    },

    async getBinding(
      policyKey: string,
      bindingId: string,
    ): Promise<PolicyBinding> {
      const res = await http.get<PolicyBinding>(
        `/platform/api/v1/policies/${policyKey}/bindings/${bindingId}`,
      );
      return res.data;
    },

    async upsertBinding(
      policyKey: string,
      req: UpsertPolicyBindingRequest,
    ): Promise<PolicyMutationResponse> {
      const res = await http.put<PolicyMutationResponse>(
        `/platform/api/v1/policies/${policyKey}/bindings`,
        req,
      );
      return res.data;
    },

    async patchBinding(
      policyKey: string,
      bindingId: string,
      req: TransitionRequest & { status?: PolicyStatus },
    ): Promise<PolicyMutationResponse> {
      const res = await http.patch<PolicyMutationResponse>(
        `/platform/api/v1/policies/${policyKey}/bindings/${bindingId}`,
        req,
      );
      return res.data;
    },

    async expireBinding(policyKey: string, bindingId: string): Promise<void> {
      await http.del(
        `/platform/api/v1/policies/${policyKey}/bindings/${bindingId}`,
      );
    },

    async activateBinding(
      policyKey: string,
      bindingId: string,
      req?: TransitionRequest,
    ): Promise<PolicyMutationResponse> {
      return transition(policyKey, bindingId, "activate", req);
    },

    async suspendBinding(
      policyKey: string,
      bindingId: string,
      req?: TransitionRequest,
    ): Promise<PolicyMutationResponse> {
      return transition(policyKey, bindingId, "suspend", req);
    },

    async retireBinding(
      policyKey: string,
      bindingId: string,
      req?: TransitionRequest,
    ): Promise<PolicyMutationResponse> {
      return transition(policyKey, bindingId, "retire", req);
    },

    async cloneBinding(
      policyKey: string,
      bindingId: string,
      req?: {
        effectiveFrom?: string;
        createdBy?: string;
        status?: PolicyStatus;
      },
    ): Promise<PolicyBinding> {
      const res = await http.post<PolicyBinding>(
        `/platform/api/v1/policies/${policyKey}/bindings/${bindingId}/clone`,
        req,
      );
      return res!.data;
    },

    async resolvePreview(req: {
      tenantId: string;
      policyKind: string;
      policyKey: string;
      subject?: { subjectType: string; subjectRef: string };
      context?: Record<string, unknown>;
      evaluationTime?: string;
    }): Promise<EffectivePolicyDecision> {
      const res = await http.post<EffectivePolicyDecision>(
        "/platform/api/v1/policies/resolve-preview",
        req,
      );
      return res!.data;
    },

    async explain(req: {
      tenantId: string;
      policyKind: string;
      policyKey: string;
      subject?: { subjectType: string; subjectRef: string };
      context?: Record<string, unknown>;
      evaluationTime?: string;
    }): Promise<EffectivePolicyDecision> {
      const res = await http.post<EffectivePolicyDecision>(
        "/platform/api/v1/policies/explain",
        req,
      );
      return res!.data;
    },

    async cacheStats(): Promise<Record<string, unknown>> {
      const res = await http.get<Record<string, unknown>>(
        "/platform/api/v1/policies/_cache/stats",
      );
      return res.data;
    },

    async invalidateCache(): Promise<void> {
      await http.del("/platform/api/v1/policies/_cache");
    },

    async createDefinition(
      req: CreatePolicyDefinitionRequest,
    ): Promise<PolicyDefinition> {
      const res = await http.post<PolicyDefinition>(
        "/platform/api/v1/policies/definitions",
        req,
      );
      return res!.data;
    },

    async listDefinitionVersions(
      policyKind: string,
    ): Promise<PolicyDefinition[]> {
      const res = await http.get<PolicyDefinition[]>(
        `/platform/api/v1/policies/definitions/${policyKind}/versions`,
      );
      return res.data;
    },

    async activateDefinition(
      policyKind: string,
      schemaVersion: number,
    ): Promise<PolicyDefinition> {
      const res = await http.post<PolicyDefinition>(
        `/platform/api/v1/policies/definitions/${policyKind}/versions/${schemaVersion}/activate`,
      );
      return res!.data;
    },

    async validateDefinitionValue(
      policyKind: string,
      schemaVersion: number,
      value: Record<string, unknown>,
    ): Promise<{ valid: boolean }> {
      const res = await http.post<{ valid: boolean }>(
        `/platform/api/v1/policies/definitions/${policyKind}/versions/${schemaVersion}/validate-value`,
        { value },
      );
      return res!.data;
    },

    async deprecateDefinition(
      policyKind: string,
      schemaVersion: number,
      force = false,
    ): Promise<PolicyDefinition> {
      const res = await http.post<PolicyDefinition>(
        `/platform/api/v1/policies/definitions/${policyKind}/versions/${schemaVersion}/deprecate?force=${String(force)}`,
      );
      return res!.data;
    },

    transition,
  };
}
