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

export default async function RegisterPage({
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
            Access is provisioned by your organization.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Your administrator creates and manages workspace accounts for your
            team.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Secured by Civis.</p>
      </section>

      <section className="flex flex-col">
        <header className="flex justify-end gap-2 p-4">
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No self-registration</CardTitle>
              <CardDescription>
                Juris workspaces are provisioned by your platform administrator.
                If you need access, contact your IT team or the person who
                invited you.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild className="w-full">
                <a href={"/" + locale + "/login"}>Go to sign in</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
