import type { Locale } from "@repo/i18n";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
} from "@repo/ui";
import {
  Building2,
  Globe2,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ConsolePageShell } from "@/components/console-page-shell";

const workspaces = [
  {
    id: "ws-001",
    name: "Acme Legal Group",
    owner: "Nadia Kim",
    members: 24,
    plan: "Enterprise",
    status: "Active",
    region: "US-East",
  },
  {
    id: "ws-002",
    name: "Kilimani Chambers",
    owner: "Felix Ombura",
    members: 11,
    plan: "Growth",
    status: "Active",
    region: "Africa",
  },
  {
    id: "ws-003",
    name: "Nova Compliance",
    owner: "Ari Patel",
    members: 7,
    plan: "Starter",
    status: "Provisioning",
    region: "EU-West",
  },
  {
    id: "ws-004",
    name: "Savana Tax Advisory",
    owner: "Lilian Achieng",
    members: 16,
    plan: "Professional",
    status: "Active",
    region: "Africa",
  },
];

function WorkspaceStatus({ status }: { status: string }) {
  if (status === "Active") {
    return (
      <Badge className="bg-success text-white hover:bg-success">Active</Badge>
    );
  }

  return <Badge variant="secondary">Provisioning</Badge>;
}

export default async function ConsoleWorkspacesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <ConsolePageShell
      locale={locale}
      breadcrumbLabel="Workspaces"
      title="Workspaces"
      description="Manage organizations, provision new workspaces, and switch operational context."
      action={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create workspace
        </Button>
      }
    >
      {workspaces.length > 0 ? (
        <div className="grid gap-4">
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Organization Directory</CardTitle>
                  <CardDescription>
                    Browse, manage, and switch between all your workspaces.
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search workspaces..." />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 p-3 pt-0">
              {workspaces.map((workspace) => (
                <article
                  key={workspace.id}
                  className="rounded-xl border border-border/70 bg-card p-4 transition-colors hover:bg-accent/30"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold">
                          {workspace.name}
                        </h3>
                        <WorkspaceStatus status={workspace.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Globe2 className="h-3.5 w-3.5" />
                          {workspace.region}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {workspace.plan} plan
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {workspace.members} members
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[11px]">
                            {workspace.owner
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid leading-tight">
                          <span className="text-xs font-medium">
                            {workspace.owner}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Owner
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                        Manage
                      </Button>
                      <Button size="sm">
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Switch
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          title="No workspaces yet"
          description="Create your first workspace to start onboarding tenants."
          action={{
            label: "Create workspace",
            href: `/${locale}/console/workspaces`,
          }}
        />
      )}
    </ConsolePageShell>
  );
}
