import type { Locale } from "@repo/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  InteractiveGridPattern,
  CardTitle,
  Input,
  Label,
  LocaleSwitcher,
  ThemeToggle,
} from "@repo/ui";
import { LoginActions } from "@/components/login-actions";

export default async function IdentityPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-dvh overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="relative z-20 flex h-20 items-center px-10">
          <a
            href={`/${locale}`}
            className="flex items-center gap-3 text-sidebar-foreground"
          >
            <span className="grid size-9 place-items-center rounded-xl border border-sidebar-border bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              J
            </span>
            <span className="text-lg font-semibold tracking-tight">Juris</span>
          </a>
        </div>

        <div className="absolute inset-0">
          <InteractiveGridPattern
            width={44}
            height={44}
            squares={[30, 30]}
            className="h-full w-full -skew-y-12 opacity-90 [-webkit-mask-image:radial-gradient(560px_circle_at_center,white,transparent)] [mask-image:radial-gradient(560px_circle_at_center,white,transparent)]"
            squaresClassName="stroke-sidebar-border/90 hover:fill-sidebar-primary/20"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,hsl(var(--sidebar)/0.35)_45%,hsl(var(--sidebar)/0.96)_100%)]" />

        <div className="relative z-20 mt-auto p-10">
          <div className="max-w-md text-sidebar-foreground">
            <p className="text-lg font-medium leading-8">
              Secure authentication for Juris.
            </p>
            <p className="mt-2 text-sm text-sidebar-foreground/60">
              Powered by Civis Java.
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-dvh flex-col bg-background">
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:justify-end lg:px-8">
          <a href={`/${locale}`} className="flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
              J
            </span>
            <span className="font-semibold tracking-tight">Juris</span>
          </a>

          <div className="flex items-center gap-2">
            <LocaleSwitcher locale={locale} />
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-[420px] space-y-6">
            <Card className="border-border/70 bg-card shadow-xl shadow-black/5">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Sign in to Juris
                </CardTitle>
              </CardHeader>

              <CardContent>
                <form className="grid gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href={`/${locale}/forgot-password`}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Forgot?
                      </a>
                    </div>

                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  <LoginActions locale={locale} />
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              Secured by Civis Java
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
