import { createThemeBootstrapScript, themeBootstrapScript } from "../lib/theme";
import type { AccentPreset, FontPreset, ThemePreset } from "../lib/theme";

export {
  APP_ACCENT_COOKIE_PREFIX,
  APP_ACCENT_STORAGE_PREFIX,
  APP_FONT_COOKIE_PREFIX,
  APP_FONT_STORAGE_PREFIX,
  APP_THEME_PRESET_COOKIE_PREFIX,
  APP_THEME_PRESET_STORAGE_PREFIX,
  DEFAULT_ACCENT_PRESET,
  DEFAULT_APP_FONT_PRESET,
  DEFAULT_PUBLIC_FONT_PRESET,
  DEFAULT_THEME_PRESET,
  getAppAccentCookieName,
  getAppAccentStorageKey,
  getAppFontCookieName,
  getAppFontStorageKey,
  getAppThemePresetCookieName,
  getAppThemePresetStorageKey,
  getDefaultFontPresetForApp,
  getThemeClassName,
  setAppAccentCookie,
  setAppFontCookie,
  setAppThemePresetCookie,
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
} from "../lib/theme";
export type {
  AccentPreset,
  FontPreset,
  ResolvedTheme,
  ThemePreset,
} from "../lib/theme";

export function ThemeScript({
  nonce,
  appId,
  defaultThemePreset,
  defaultAccent,
  defaultFont,
}: {
  nonce?: string | undefined;
  appId?: string;
  defaultThemePreset?: ThemePreset;
  defaultAccent?: AccentPreset;
  defaultFont?: FontPreset;
}) {
  const hasOverrides =
    appId || defaultThemePreset || defaultAccent || defaultFont;
  const script = hasOverrides
    ? createThemeBootstrapScript({
        ...(appId ? { appId } : {}),
        ...(defaultThemePreset ? { defaultThemePreset } : {}),
        ...(defaultAccent ? { defaultAccent } : {}),
        ...(defaultFont ? { defaultFont } : {}),
      })
    : themeBootstrapScript;

  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
