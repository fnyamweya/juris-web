import { mockSession } from "@repo/auth";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { AppShell, platformNavIcons } from "./navigation";
import { PermissionGate } from "./permission-gate";

function renderWithIntl(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={{}}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("AppShell", () => {
  it("renders app navigation and content", () => {
    renderWithIntl(
      <AppShell
        appName="Console"
        locale="en"
        navItems={[
          {
            label: "Console",
            href: "/en/console",
            icon: platformNavIcons.console,
          },
        ]}
        session={mockSession}
        user={mockSession.user}
        tenant={mockSession.currentTenant}
        tenants={mockSession.availableTenants}
      >
        <h1>Dashboard</h1>
      </AppShell>,
    );
    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Console").length).toBeGreaterThan(0);
  });

  it("hides content without permission", () => {
    render(
      <PermissionGate
        session={mockSession}
        permission="admin:write"
        fallback={<p>Denied</p>}
      >
        <p>Allowed</p>
      </PermissionGate>,
    );
    expect(screen.getByText("Denied")).toBeInTheDocument();
  });
});
