import { Activity, CreditCard } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AppShell,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LocaleSwitcher,
  MetricCard,
  StatusBadge,
  ThemeToggle,
  platformNavIcons,
} from "../index";

const meta = {
  title: "Juris UI/Components",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

export const ButtonStory: StoryObj = {
  name: "Button",
  render: () => (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  ),
};

export const CardStory: StoryObj = {
  name: "Card",
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Operational posture</CardTitle>
      </CardHeader>
      <CardContent>All app manifests validate successfully.</CardContent>
    </Card>
  ),
};

export const AppShellStory: StoryObj = {
  name: "AppShell",
  parameters: { layout: "fullscreen" },
  render: () => (
    <AppShell
      appName="Console"
      locale="en"
      navItems={[
        {
          label: "Console",
          href: "/en/console",
          icon: platformNavIcons.console,
        },
        {
          label: "Billing",
          href: "/en/billing",
          icon: platformNavIcons.billing,
        },
      ]}
      tenants={[{ id: "tenant_alpha", name: "Acme Legal Group", slug: "acme" }]}
      tenant={{ id: "tenant_alpha", name: "Acme Legal Group", slug: "acme" }}
      user={{ id: "user_1", name: "Amara Okafor", email: "amara@example.com" }}
    >
      <MetricCard title="Active tenants" value="128" icon={Activity} />
    </AppShell>
  ),
};

export const EmptyStateStory: StoryObj = {
  name: "EmptyState",
  render: () => (
    <EmptyState
      title="No invoices yet"
      description="Invoices will appear after billing runs."
    />
  ),
};

export const ErrorStateStory: StoryObj = {
  name: "ErrorState",
  render: () => (
    <ErrorState
      title="Unable to load"
      description="Retry when the service is ready."
    />
  ),
};

export const StatusBadgeStory: StoryObj = {
  name: "StatusBadge",
  render: () => (
    <div className="flex gap-2">
      <StatusBadge status="healthy" />
      <StatusBadge status="degraded" />
      <StatusBadge status="unavailable" />
    </div>
  ),
};

export const ThemeToggleStory: StoryObj = {
  name: "ThemeToggle",
  render: () => <ThemeToggle />,
};

export const LocaleSwitcherStory: StoryObj = {
  name: "LocaleSwitcher",
  render: () => <LocaleSwitcher locale="en" />,
};

export const MetricCardStory: StoryObj = {
  name: "MetricCard",
  render: () => (
    <MetricCard
      title="Monthly revenue"
      value="$428K"
      change="+12.4%"
      trend="up"
      icon={CreditCard}
    />
  ),
};
