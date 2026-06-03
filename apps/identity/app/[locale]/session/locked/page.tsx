import type { Locale } from "@repo/i18n";
import { ThemeToggle } from "@repo/ui";

export default async function LockedSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { locale } = await params;
  const { returnTo } = await searchParams;
  const safeReturnTo = returnTo?.startsWith("/")
    ? returnTo
    : `/${locale}/console`;
  const reactivateUrl =
    `/api/auth/reactivate?locale=${encodeURIComponent(locale)}` +
    `&returnTo=${encodeURIComponent(safeReturnTo)}`;

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center justify-between px-5 sm:px-8">
        <a href={`/${locale}`} className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
            J
          </span>
          <span className="font-semibold tracking-tight">Juris</span>
        </a>
        <ThemeToggle />
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[22rem] space-y-5 text-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Session paused
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Continue where you left off
            </p>
          </div>
          <a
            href={reactivateUrl}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Continue
          </a>
          <a
            href={`/api/auth/logout?locale=${encodeURIComponent(locale)}`}
            className="inline-flex text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign out
          </a>
        </div>
      </section>
    </main>
  );
}
