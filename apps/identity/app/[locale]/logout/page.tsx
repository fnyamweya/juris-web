import type { Locale } from "@repo/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LocaleSwitcher,
  ThemeToggle,
} from "@repo/ui";

export default async function IdentityPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return (
    <main className="grid min-h-screen bg-muted/30 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden border-r bg-card p-10 lg:flex lg:flex-col lg:justify-between">
        <a href={"/" + locale} className="text-lg font-semibold">
          Juris
        </a>
        <div>
          <h1 className="text-4xl font-semibold tracking-normal">
            Identity fabric for enterprise teams.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Mock authentication keeps local development fast while contracts
            remain ready for OIDC and SAML providers.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Protected by secure headers and typed session boundaries.
        </p>
      </section>
      <section className="flex flex-col">
        <header className="flex justify-end gap-2 p-4">
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Signed out</CardTitle>
              <CardDescription>
                Your local mock session has been cleared for this browser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={"/" + locale + "/login"}>Return to sign in</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
