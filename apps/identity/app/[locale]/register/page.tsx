import type { Locale } from "@repo/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  ThemeToggle,
  LocaleSwitcher,
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
              <CardTitle>Create your workspace</CardTitle>
              <CardDescription>
                Create a tenant-ready workspace for evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="amara@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                  />
                </div>
                <Button type="button">Create account</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
