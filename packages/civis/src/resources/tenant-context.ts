import type { Http } from "../http";
import type {
  TenantMarketAssignment,
  TenantMarketAssignmentType,
  TenantMarketContext,
  TenantOrganizationContext,
  TenantOrganizationLink,
  TenantOrganizationRelationshipType,
} from "../types";

export function createTenantContextResource(http: Http) {
  return {
    async getMarketContext(tenantId: string): Promise<TenantMarketContext> {
      const res = await http.get<TenantMarketContext>(
        `/platform/api/v1/tenants/${tenantId}/market-context`,
      );
      return res.data;
    },

    async assignMarket(
      tenantId: string,
      marketCode: string,
      assignmentType: TenantMarketAssignmentType,
    ): Promise<TenantMarketAssignment> {
      const res = await http.put<TenantMarketAssignment>(
        `/platform/api/v1/tenants/${tenantId}/markets/${marketCode}`,
        { assignmentType },
      );
      return res.data;
    },

    async unassignMarket(
      tenantId: string,
      marketCode: string,
      assignmentType: TenantMarketAssignmentType,
    ): Promise<void> {
      await http.del(`/platform/api/v1/tenants/${tenantId}/markets/${marketCode}`, {
        assignmentType,
      });
    },

    async getOrganizationContext(
      tenantId: string,
    ): Promise<TenantOrganizationContext> {
      const res = await http.get<TenantOrganizationContext>(
        `/platform/api/v1/tenants/${tenantId}/organization-context`,
      );
      return res.data;
    },

    async assignOrganization(
      tenantId: string,
      organizationId: string,
      relationshipType: TenantOrganizationRelationshipType,
    ): Promise<TenantOrganizationLink> {
      const res = await http.put<TenantOrganizationLink>(
        `/platform/api/v1/tenants/${tenantId}/organizations/${organizationId}`,
        { relationshipType },
      );
      return res.data;
    },

    async unassignOrganization(
      tenantId: string,
      organizationId: string,
      relationshipType: TenantOrganizationRelationshipType,
    ): Promise<void> {
      await http.del(
        `/platform/api/v1/tenants/${tenantId}/organizations/${organizationId}`,
        { relationshipType },
      );
    },
  };
}
