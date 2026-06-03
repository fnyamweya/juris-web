"use server";

import { createCivisClient } from "@repo/civis";
import type {
  AppearancePreferences,
  LocalePreferences,
  MarketingPreferences,
  MfaPreferences,
  NotificationPreferences,
  PrivacyPreferences,
} from "@repo/civis";
import { revalidatePath } from "next/cache";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function client() {
  return createCivisClient();
}

function revalidate(locale: string, section: string) {
  revalidatePath(`/${locale}/settings/${section}`);
}

// ── Appearance ────────────────────────────────────────────────────────────────

export async function saveAppearance(
  locale: string,
  patch: Partial<AppearancePreferences>,
): Promise<void> {
  const c = await client();
  await c.me.preferences.updateAppearance(patch);
  revalidate(locale, "preferences");
}

// ── Locale ────────────────────────────────────────────────────────────────────

export async function saveLocale(
  locale: string,
  patch: Partial<LocalePreferences>,
): Promise<void> {
  const c = await client();
  await c.me.preferences.updateLocale(patch);
  revalidate(locale, "preferences");
}

// ── MFA ───────────────────────────────────────────────────────────────────────

export async function saveMfaPreferences(
  locale: string,
  patch: Partial<MfaPreferences>,
): Promise<void> {
  const c = await client();
  await c.me.preferences.updateMfa(patch);
  revalidate(locale, "preferences");
}

// ── Marketing ─────────────────────────────────────────────────────────────────

export async function saveMarketing(
  locale: string,
  patch: Partial<MarketingPreferences>,
): Promise<void> {
  const c = await client();
  await c.me.preferences.updateMarketing(patch);
  revalidate(locale, "privacy");
}

// ── Privacy ───────────────────────────────────────────────────────────────────

export async function savePrivacy(
  locale: string,
  patch: Partial<PrivacyPreferences>,
): Promise<void> {
  const c = await client();
  await c.me.preferences.updatePrivacy(patch);
  revalidate(locale, "privacy");
}

// ── Terms ─────────────────────────────────────────────────────────────────────

export async function acceptTerms(
  locale: string,
  termsVersion: string,
): Promise<void> {
  const c = await client();
  await c.me.terms.accept(termsVersion, locale);
  revalidate(locale, "privacy");
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function saveNotifications(
  locale: string,
  tenantId: string,
  patch: Partial<NotificationPreferences>,
): Promise<void> {
  const c = await client();
  await c.me.preferences.tenant.updateNotifications(tenantId, patch);
  revalidate(locale, "notifications");
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function revokeSession(
  locale: string,
  sessionId: string,
): Promise<void> {
  const c = await client();
  await c.me.security.sessions.revoke(sessionId);
  revalidate(locale, "security");
}

export async function revokeAllOtherSessions(
  locale: string,
  currentSessionId: string,
): Promise<number> {
  const c = await client();
  const count = await c.me.security.sessions.revokeOthers(currentSessionId);
  revalidate(locale, "security");
  return count;
}

// ── Trusted devices ───────────────────────────────────────────────────────────

export async function revokeTrustedDevice(
  locale: string,
  deviceId: string,
): Promise<void> {
  const c = await client();
  await c.me.security.trustedDevices.revoke(deviceId);
  revalidate(locale, "security");
}

export async function renameTrustedDevice(
  locale: string,
  deviceId: string,
  label: string,
): Promise<void> {
  const c = await client();
  await c.me.security.trustedDevices.rename(deviceId, label);
  revalidate(locale, "security");
}
