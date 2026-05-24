import { createTranslator } from "next-intl";
import { getMessages } from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LocaleSwitcher,
  MetricCard,
  ThemeToggle,
} from "@repo/ui";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  LockKeyhole,
  Network,
  ShieldCheck,
} from "lucide-react";

export default async function PublicHomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = createTranslator({ locale, messages });

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <a
          href={"/" + locale}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            J
          </span>
          {t("common.appName")}
        </a>
        <nav
          className="hidden items-center gap-2 md:flex"
          aria-label="Public navigation"
        >
          <a
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            href={"/" + locale + "/about"}
          >
            About
          </a>
          <a
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            href={"/" + locale + "/pricing"}
          >
            Pricing
          </a>
          <a
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            href={"/" + locale + "/security"}
          >
            Security
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
          <Button asChild>
            <a href={"/" + locale + "/login"}>{t("auth.login")}</a>
          </Button>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border px-3 py-1 text-sm text-muted-foreground">
            Enterprise legal operations platform
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-normal md:text-6xl">
            Juris
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            A resilient microfrontend platform for legal, billing, reporting,
            support, and workspace operations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={"/" + locale + "/login"}>
                Start securely <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={"/" + locale + "/security"}>Security posture</a>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 rounded-lg border bg-card p-4 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              title="Availability target"
              value="99.95%"
              change="independent apps"
              trend="up"
              icon={ShieldCheck}
            />
            <MetricCard
              title="Active tenants"
              value="128"
              change="+14 this quarter"
              trend="up"
              icon={Building2}
            />
            <MetricCard
              title="Policy checks"
              value="42K"
              change="last 24 hours"
              trend="flat"
              icon={LockKeyhole}
            />
            <MetricCard
              title="Routes owned"
              value="8"
              change="path-based products"
              trend="up"
              icon={Network}
            />
          </div>
        </div>
      </section>
      <section className="border-y bg-muted/35">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 md:grid-cols-3">
          {[
            [
              "Independent apps",
              "Every capability can run, build, and deploy without another frontend app.",
            ],
            [
              "Shared design system",
              "shadcn/ui foundations wrapped in Juris enterprise components.",
            ],
            [
              "Operational defaults",
              "Health checks, manifests, security headers, and telemetry from day one.",
            ],
          ].map(([title, description]) => (
            <Card key={title}>
              <CardHeader>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>© 2026 Juris</span>
        <span>Cloudflare-ready · Next.js 15 · React 19</span>
      </footer>
    </main>
  );
}
