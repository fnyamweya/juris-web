"use client";

// Uses window.location.href (not a form submission and not Next.js client
// router) so neither the form-action CSP directive nor the client router's
// cross-origin redirect handling can interfere with the CAS redirect chain.
export function SignInButton({ locale, returnTo }: { locale: string; returnTo: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        // Use replace() so /api/auth/login is never added to the browser history
      // stack. Pressing back from the CAS login page skips /api/auth/login
      // entirely and returns to the Juris login page — preventing a back-nav
      // from re-running the route handler and overwriting the PKCE/state cookies.
      window.location.replace(`/api/auth/login?${new URLSearchParams({ locale, returnTo })}`);
      }}
      className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Sign in with Juris
    </button>
  );
}
