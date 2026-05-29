import type { Locale } from "@repo/i18n";

export default async function LogoutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Icon */}
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-border/60 bg-muted/40">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-7 text-muted-foreground"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">You're signed out</h1>
          <p className="text-sm text-muted-foreground">
            Your session has ended and all tokens have been revoked.
          </p>
        </div>

        {/* Action */}
        <a
          href={`/${locale}/login`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
        >
          Sign in again
        </a>

        <p className="text-xs text-muted-foreground/60">
          Secured by Civis
        </p>
      </div>
    </main>
  );
}
