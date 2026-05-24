import type { Locale } from "@repo/i18n";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LocaleSwitcher,
  ThemeToggle,
} from "@repo/ui";

export default async function PublicSubPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <a href={"/" + locale} className="font-semibold">
          Juris
        </a>
        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
        </div>
      </header>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-semibold tracking-normal">Security</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Security headers, app manifests, and typed boundaries are built into
          every app.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise controls</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Typed contracts, health endpoints, and security defaults keep
              teams aligned.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Operational clarity</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Each product surface owns its route, manifest, observability name,
              and deploy pipeline.
            </CardContent>
          </Card>
        </div>
        <Button asChild className="mt-8">
          <a href={"/" + locale}>Back home</a>
        </Button>
      </section>
    </main>
  );
}
