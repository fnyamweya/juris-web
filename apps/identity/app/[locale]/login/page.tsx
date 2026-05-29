import type { Locale } from "@repo/i18n";
import {
  Alert,
  AlertDescription,
  InteractiveGridPattern,
  LocaleSwitcher,
  ThemeToggle,
} from "@repo/ui";
import { SignInButton } from "@/components/sign-in-button";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  session_expired: "Your session expired. Please sign in again.",
  state_mismatch: "The sign-in request could not be verified. Please try again.",
  access_denied: "Access was denied. Please contact your administrator.",
  auth_unavailable:
    "The authentication service is temporarily unavailable. Please try again shortly.",
};

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
  }>;
}) {
  const { locale } = await params;
  const { error, returnTo } = await searchParams;

  const errorMessage = error
    ? (AUTH_ERROR_MESSAGES[error] ?? decodeURIComponent(error))
    : null;

  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : `/${locale}/console`;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background lg:grid lg:grid-cols-2">

      {/* ── Brand panel ──────────────────────────────────── */}
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
            width={48}
            height={48}
            squares={[30, 30]}
            className="h-full w-full -skew-y-12 opacity-80 [-webkit-mask-image:radial-gradient(600px_circle_at_center,white,transparent)] [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
            squaresClassName="stroke-sidebar-border/80 hover:fill-sidebar-primary/15"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_0%,hsl(var(--sidebar)/0.3)_45%,hsl(var(--sidebar)/0.97)_100%)]" />

        <div className="relative z-20 mt-auto p-10">
          <blockquote className="mb-6 space-y-2 rounded-xl border border-sidebar-border/50 bg-sidebar-foreground/[0.04] p-5">
            <p className="text-sm leading-relaxed text-sidebar-foreground/70">
              "Juris gives our legal team a single, secure place to manage every
              workspace. The compliance controls are exactly what enterprise demands."
            </p>
            <footer className="flex items-center gap-2.5 pt-1">
              <span className="grid size-7 flex-shrink-0 place-items-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                AO
              </span>
              <div>
                <p className="text-xs font-medium text-sidebar-foreground/80">Amara Okafor</p>
                <p className="text-xs text-sidebar-foreground/45">Head of Legal Ops · Acme Legal</p>
              </div>
            </footer>
          </blockquote>
          <p className="text-sm text-sidebar-foreground/50">
            Trusted by enterprise legal teams worldwide.
          </p>
        </div>
      </section>

      {/* ── Form panel ───────────────────────────────────── */}
      <section className="flex min-h-dvh flex-col bg-background">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8 lg:justify-end">
          <a href={`/${locale}`} className="flex items-center gap-2.5 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              J
            </span>
            <span className="font-semibold tracking-tight">Juris</span>
          </a>
          <div className="flex items-center gap-2">
            <LocaleSwitcher locale={locale} />
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[21rem] space-y-5">

            {/* Heading */}
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your Juris workspace
              </p>
            </div>

            {/* Error */}
            {errorMessage && (
              <Alert variant="danger">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Sign in button */}
            <SignInButton locale={locale} returnTo={safeReturnTo} />

            {/* Footer */}
            <p className="text-center text-[0.6875rem] leading-relaxed text-muted-foreground/70">
              By continuing you agree to our{" "}
              <a href="#" className="underline underline-offset-2 hover:text-muted-foreground">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="underline underline-offset-2 hover:text-muted-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
