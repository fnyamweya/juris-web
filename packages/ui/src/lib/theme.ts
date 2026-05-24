export const THEME_COOKIE_NAME = "theme";
export const THEME_STORAGE_KEY = "theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const APP_THEME_PRESET_COOKIE_PREFIX = "app-theme-preset";
export const APP_ACCENT_COOKIE_PREFIX = "app-accent";
export const APP_FONT_COOKIE_PREFIX = "app-font";

export const APP_THEME_PRESET_STORAGE_PREFIX = "juris-theme-preset";
export const APP_ACCENT_STORAGE_PREFIX = "juris-accent";
export const APP_FONT_STORAGE_PREFIX = "juris-font";

export type ResolvedTheme = "dark" | "light";
export type ThemePreset = "juris" | "supabase" | "mono" | "sunset";
export type AccentPreset =
  | "juris"
  | "emerald"
  | "blue"
  | "amber"
  | "rose"
  | "slate";
export type FontPreset =
  | "outfit"
  | "inter"
  | "manrope"
  | "dm-sans"
  | "space-grotesk"
  | "jetbrains-mono";

export const DEFAULT_THEME_PRESET: ThemePreset = "juris";
export const DEFAULT_ACCENT_PRESET: AccentPreset = "juris";
export const DEFAULT_PUBLIC_FONT_PRESET: FontPreset = "inter";
export const DEFAULT_APP_FONT_PRESET: FontPreset = "outfit";

function normalizeAppId(appId: string) {
  const normalized = appId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return normalized.length > 0 ? normalized : "app";
}

export function getDefaultFontPresetForApp(appId: string) {
  return normalizeAppId(appId) === "public"
    ? DEFAULT_PUBLIC_FONT_PRESET
    : DEFAULT_APP_FONT_PRESET;
}

export function getThemeClassName(theme: string | undefined) {
  return theme === "dark" ? "dark" : undefined;
}

export function getAppThemePresetCookieName(appId: string) {
  return `${APP_THEME_PRESET_COOKIE_PREFIX}-${normalizeAppId(appId)}`;
}

export function getAppAccentCookieName(appId: string) {
  return `${APP_ACCENT_COOKIE_PREFIX}-${normalizeAppId(appId)}`;
}

export function getAppFontCookieName(appId: string) {
  return `${APP_FONT_COOKIE_PREFIX}-${normalizeAppId(appId)}`;
}

export function getAppThemePresetStorageKey(appId: string) {
  return `${APP_THEME_PRESET_STORAGE_PREFIX}-${normalizeAppId(appId)}`;
}

export function getAppAccentStorageKey(appId: string) {
  return `${APP_ACCENT_STORAGE_PREFIX}-${normalizeAppId(appId)}`;
}

export function getAppFontStorageKey(appId: string) {
  return `${APP_FONT_STORAGE_PREFIX}-${normalizeAppId(appId)}`;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${value}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function setThemeCookie(theme: ResolvedTheme) {
  setCookie(THEME_COOKIE_NAME, theme);
}

export function setAppThemePresetCookie(appId: string, preset: ThemePreset) {
  setCookie(getAppThemePresetCookieName(appId), preset);
}

export function setAppAccentCookie(appId: string, accent: AccentPreset) {
  setCookie(getAppAccentCookieName(appId), accent);
}

export function setAppFontCookie(appId: string, font: FontPreset) {
  setCookie(getAppFontCookieName(appId), font);
}

export function createThemeBootstrapScript({
  appId = "app",
  defaultThemePreset = DEFAULT_THEME_PRESET,
  defaultAccent = DEFAULT_ACCENT_PRESET,
  defaultFont,
}: {
  appId?: string;
  defaultThemePreset?: ThemePreset;
  defaultAccent?: AccentPreset;
  defaultFont?: FontPreset;
} = {}) {
  const normalizedAppId = normalizeAppId(appId);
  const themePresetCookieName = getAppThemePresetCookieName(normalizedAppId);
  const accentCookieName = getAppAccentCookieName(normalizedAppId);
  const fontCookieName = getAppFontCookieName(normalizedAppId);
  const themePresetStorageKey = getAppThemePresetStorageKey(normalizedAppId);
  const accentStorageKey = getAppAccentStorageKey(normalizedAppId);
  const fontStorageKey = getAppFontStorageKey(normalizedAppId);
  const resolvedDefaultFont =
    defaultFont ?? getDefaultFontPresetForApp(normalizedAppId);

  return `
(() => {
  try {
    const storageKey = "${THEME_STORAGE_KEY}";
    const cookieName = "${THEME_COOKIE_NAME}";
    const presetStorageKey = "${themePresetStorageKey}";
    const accentStorageKey = "${accentStorageKey}";
    const fontStorageKey = "${fontStorageKey}";
    const presetCookieName = "${themePresetCookieName}";
    const accentCookieName = "${accentCookieName}";
    const fontCookieName = "${fontCookieName}";

    const readCookie = (name) =>
      document.cookie
        .split("; ")
        .find((item) => item.startsWith(name + "="))
        ?.split("=")[1];

    const storedTheme = window.localStorage.getItem(storageKey);
    const cookieTheme = readCookie(cookieName);
    const theme = storedTheme || cookieTheme || "system";
    const resolvedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    const themePreset =
      window.localStorage.getItem(presetStorageKey) ||
      readCookie(presetCookieName) ||
      "${defaultThemePreset}";

    const accent =
      window.localStorage.getItem(accentStorageKey) ||
      readCookie(accentCookieName) ||
      "${defaultAccent}";

    const font =
      window.localStorage.getItem(fontStorageKey) ||
      readCookie(fontCookieName) ||
      "${resolvedDefaultFont}";

    const root = document.documentElement;

    root.classList.remove("dark", "light");
    root.style.colorScheme = resolvedTheme;

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    }

    root.setAttribute("data-theme", themePreset);
    root.setAttribute("data-accent", accent);
    root.setAttribute("data-font", font);

    window.localStorage.setItem(presetStorageKey, themePreset);
    window.localStorage.setItem(accentStorageKey, accent);
    window.localStorage.setItem(fontStorageKey, font);

    document.cookie =
      cookieName +
      "=" +
      resolvedTheme +
      "; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax";

    document.cookie =
      presetCookieName +
      "=" +
      themePreset +
      "; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax";

    document.cookie =
      accentCookieName +
      "=" +
      accent +
      "; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax";

    document.cookie =
      fontCookieName +
      "=" +
      font +
      "; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax";
  } catch {}
})();
`;
}

export const themeBootstrapScript = createThemeBootstrapScript();
