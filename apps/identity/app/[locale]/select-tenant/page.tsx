import type { Locale } from "@repo/i18n";
import { getSession } from "@repo/auth";
import { Alert, AlertDescription, LocaleSwitcher, ThemeToggle } from "@repo/ui";
import { redirect } from "next/navigation";
import { SelectTenantForm } from "./select-tenant-form";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_tenant: "That workspace is not available to your account. Please choose again.",
  auth_required: "Please sign in again to access this workspace.",
};

export default async function SelectTenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { returnTo, error } = await searchParams;

  const session = await getSession();

  if (session.status !== "authenticated" || session.availableTenants.length <= 1) {
    redirect(returnTo?.startsWith("/") ? returnTo : `/${locale}/console`);
  }

  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : `/${locale}/console`;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "An error occurred. Please try again.")
    : null;

  return (
    <main className="relative min-h-dvh bg-background">
      <header className="flex h-16 items-center justify-between px-5 sm:px-8">
        <a href={`/${locale}`} className="flex items-center gap-2.5">
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

      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[22rem] space-y-6">

          <div className="space-y-4 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-lg font-bold text-primary">
              J
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                Choose a workspace
              </h1>
              <p className="text-sm text-muted-foreground">
                You belong to multiple workspaces. Select one to continue.
              </p>
            </div>
          </div>

          {errorMessage && (
            <Alert variant="danger">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <SelectTenantForm
            tenants={session.availableTenants}
            locale={locale}
            returnTo={safeReturnTo}
          />

          <p className="text-center text-[0.6875rem] leading-relaxed text-muted-foreground/70">
            Signed in as{" "}
            <span className="font-medium text-muted-foreground/90">
              {session.user?.email ?? session.user?.name}
            </span>
          </p>

        </div>
      </div>
    </main>
  );
}
