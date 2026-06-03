"use client";

import type { Tenant } from "@repo/auth";
import { Building2Icon } from "lucide-react";
import { cn } from "@repo/ui";

export function SelectTenantForm({
  tenants,
  locale,
  returnTo,
}: {
  tenants: Tenant[];
  locale: string;
  returnTo: string;
}) {
  function selectTenant(tenantId: string) {
    // Initiates a fresh OAuth flow scoped to the selected tenant.
    // CAS enforces that tenant's auth config (MFA, login methods, session TTL).
    // Using replace() so this page is not in the browser history stack.
    window.location.replace(
      `/api/auth/login?${new URLSearchParams({ locale, returnTo, tenant_id: tenantId })}`,
    );
  }

  return (
    <div className="space-y-2">
      {tenants.map((tenant) => (
        <button
          key={tenant.id}
          type="button"
          onClick={() => selectTenant(tenant.id)}
          className={cn(
            "flex w-full items-center gap-4 rounded-lg border border-border bg-background px-4 py-3.5 text-left",
            "transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          )}
        >
          <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
            {tenant.name.charAt(0).toUpperCase().match(/[A-Z0-9]/) ? (
              <span className="text-sm font-semibold">
                {tenant.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <Building2Icon className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{tenant.name}</p>
            <p className="truncate text-xs text-muted-foreground">{tenant.slug}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
