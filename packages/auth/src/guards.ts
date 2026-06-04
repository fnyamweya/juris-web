/**
 * Server-side permission guards for Next.js Server Components and Server Actions.
 *
 * These functions call `getSession()` and use Next.js `redirect()` to send the
 * user to an appropriate page when the permission check fails. They MUST only be
 * called inside:
 *  - async Server Components
 *  - Server Actions ("use server" functions)
 *  - Route Handlers (GET / POST handlers in route.ts files)
 *
 * Do NOT call from client components, middleware, or plain TypeScript modules —
 * `redirect()` throws a special Next.js control-flow error that is only handled
 * inside the React server runtime.
 *
 * @example
 * // In a Server Component:
 * const session = await requirePermission("admin:read", { locale, redirectTo: `/${locale}/console` });
 * // session is narrowed to AuthenticatedSession here
 *
 * @example
 * // In a Server Action:
 * export async function deleteUser(userId: string) {
 *   "use server";
 *   await requirePermission("admin:write");
 *   ...
 * }
 */

import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { AuthenticatedSession, Session } from "./types";

function assertAuthenticated(session: Session): asserts session is AuthenticatedSession {
  // Only assert status — redirect() above already handles the failure path at runtime.
  // currentTenant is intentionally not checked here: platform users with no active
  // tenant are still authenticated. The TypeScript type narrowing is what matters.
  if (session.status !== "authenticated") {
    throw new Error("assertAuthenticated: session is not authenticated");
  }
}

export interface GuardOptions {
  /**
   * Path to redirect to when the check fails.
   * Defaults to "/" — the locale middleware will prefix it and the auth
   * middleware will redirect to login if not authenticated.
   */
  redirectTo?: string;
}

// ─── Single permission ────────────────────────────────────────────────────────

/**
 * Asserts the current user is authenticated and has `permission`.
 * Redirects to `options.redirectTo` (default "/") on failure.
 * Returns the narrowed `AuthenticatedSession` on success.
 */
export async function requirePermission(
  permission: string,
  options?: GuardOptions,
): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (
    session.status !== "authenticated" ||
    !session.permissions.includes(permission)
  ) {
    redirect(options?.redirectTo ?? "/");
  }
  assertAuthenticated(session);
  return session;
}

// ─── OR: any one of the supplied permissions ──────────────────────────────────

/**
 * Asserts the current user is authenticated and has at least one of `permissions`.
 * Redirects on failure.
 */
export async function requireAnyPermission(
  permissions: string[],
  options?: GuardOptions,
): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (
    session.status !== "authenticated" ||
    !permissions.some((p) => session.permissions.includes(p))
  ) {
    redirect(options?.redirectTo ?? "/");
  }
  assertAuthenticated(session);
  return session;
}

// ─── AND: all of the supplied permissions ─────────────────────────────────────

/**
 * Asserts the current user is authenticated and has ALL of `permissions`.
 * Redirects on failure.
 */
export async function requireAllPermissions(
  permissions: string[],
  options?: GuardOptions,
): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (
    session.status !== "authenticated" ||
    !permissions.every((p) => session.permissions.includes(p))
  ) {
    redirect(options?.redirectTo ?? "/");
  }
  assertAuthenticated(session);
  return session;
}

// ─── Authenticated only ───────────────────────────────────────────────────────

/**
 * Asserts the current user is authenticated (any permissions).
 * Use when a page requires login but not a specific permission.
 */
export async function requireAuthenticated(
  options?: GuardOptions,
): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (session.status !== "authenticated") {
    redirect(options?.redirectTo ?? "/");
  }
  assertAuthenticated(session);
  return session;
}
