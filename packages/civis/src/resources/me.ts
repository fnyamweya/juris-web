import type { Http } from "../http";
import type {
  ActiveSession,
  AppearancePreferences,
  LegalAcceptance,
  LegalDocument,
  LegalStatus,
  LocalePreferences,
  LocalizationPreferences,
  MarketingPreferences,
  MfaPreferences,
  NotificationPreferences,
  PrivacyPreferences,
  TermsAcceptance,
  TermsStatus,
  TrustedDevice,
  UserPreferences,
  UserTenantPreferences,
} from "../types";

const BASE = "/platform/api/v1/me";

export function createMeResource(http: Http) {
  return {
    preferences: {
      /** Fetch all personal preferences (appearance, locale, marketing, privacy, mfa). */
      async get(): Promise<UserPreferences> {
        const res = await http.get<UserPreferences>(`${BASE}/preferences`);
        return res.data;
      },

      async updateAppearance(patch: Partial<AppearancePreferences>): Promise<AppearancePreferences> {
        const res = await http.patch<AppearancePreferences>(`${BASE}/preferences/appearance`, patch);
        return res!.data;
      },

      async updateLocale(patch: Partial<LocalePreferences>): Promise<LocalePreferences> {
        const res = await http.patch<LocalePreferences>(`${BASE}/preferences/locale`, patch);
        return res!.data;
      },

      async updateMarketing(patch: Partial<MarketingPreferences>): Promise<MarketingPreferences> {
        const res = await http.patch<MarketingPreferences>(`${BASE}/preferences/marketing`, patch);
        return res!.data;
      },

      async updatePrivacy(patch: Partial<PrivacyPreferences>): Promise<PrivacyPreferences> {
        const res = await http.patch<PrivacyPreferences>(`${BASE}/preferences/privacy`, patch);
        return res!.data;
      },

      async updateMfa(patch: Partial<MfaPreferences>): Promise<MfaPreferences> {
        const res = await http.patch<MfaPreferences>(`${BASE}/preferences/mfa`, patch);
        return res!.data;
      },

      tenant: {
        /** Fetch tenant-scoped notification + localization preferences. */
        async get(tenantId: string): Promise<UserTenantPreferences> {
          const res = await http.get<UserTenantPreferences>(
            `${BASE}/preferences/tenant/${tenantId}`,
          );
          return res.data;
        },

        async updateNotifications(
          tenantId: string,
          patch: Partial<NotificationPreferences>,
        ): Promise<NotificationPreferences> {
          const res = await http.patch<NotificationPreferences>(
            `${BASE}/preferences/tenant/${tenantId}/notifications`,
            patch,
          );
          return res!.data;
        },

        async updateLocalization(
          tenantId: string,
          patch: Partial<LocalizationPreferences>,
        ): Promise<LocalizationPreferences> {
          const res = await http.patch<LocalizationPreferences>(
            `${BASE}/preferences/tenant/${tenantId}/localization`,
            patch,
          );
          return res!.data;
        },
      },
    },

    terms: {
      /** Get current T&C acceptance status + history. */
      async get(): Promise<TermsStatus> {
        const res = await http.get<TermsStatus>(`${BASE}/terms`);
        return res.data;
      },

      /** Record acceptance of a specific terms version. */
      async accept(termsVersion: string, locale?: string): Promise<TermsAcceptance> {
        const res = await http.post<TermsAcceptance>(`${BASE}/terms/accept`, {
          termsVersion,
          locale,
        });
        return res!.data;
      },
    },


    legal: {
      async pending(): Promise<LegalDocument[]> {
        const res = await http.get<LegalDocument[]>(`${BASE}/legal/pending`);
        return res.data;
      },
      async accept(documentId: string, locale?: string): Promise<LegalAcceptance> {
        const res = await http.post<LegalAcceptance>(`${BASE}/legal/accept`, { documentId, locale });
        return res!.data;
      },
      async history(): Promise<LegalAcceptance[]> {
        const res = await http.get<LegalAcceptance[]>(`${BASE}/legal/history`);
        return res.data;
      },
      async status(): Promise<LegalStatus> {
        const res = await http.get<LegalStatus>(`${BASE}/legal/status`);
        return res.data;
      },
    },

    security: {
      sessions: {
        /** List all active sessions for the current user. */
        async list(): Promise<ActiveSession[]> {
          const res = await http.get<{ sessions: ActiveSession[]; total: number }>(
            `${BASE}/security/sessions`,
          );
          return res.data.sessions;
        },

        /** Revoke a specific session by ID. */
        async revoke(sessionId: string): Promise<void> {
          await http.del(`${BASE}/security/sessions/${sessionId}`);
        },

        /** Revoke all sessions except the one with `currentSessionId`. */
        async revokeOthers(currentSessionId: string): Promise<number> {
          const res = await http.post<{ sessionsRevoked: number }>(
            `${BASE}/security/sessions/revoke-others`,
            { currentSessionId },
          );
          return res!.data.sessionsRevoked;
        },
      },

      trustedDevices: {
        /** List all active trusted devices. */
        async list(): Promise<TrustedDevice[]> {
          const res = await http.get<{ devices: TrustedDevice[]; total: number }>(
            `${BASE}/security/trusted-devices`,
          );
          return res.data.devices;
        },

        /** Rename a trusted device. */
        async rename(deviceId: string, label: string): Promise<void> {
          await http.patch(`${BASE}/security/trusted-devices/${deviceId}`, { label });
        },

        /** Revoke a trusted device. */
        async revoke(deviceId: string): Promise<void> {
          await http.del(`${BASE}/security/trusted-devices/${deviceId}`);
        },
      },
    },
  };
}
