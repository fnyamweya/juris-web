export const locales = ["en", "sw", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function assertLocale(
  value: string | undefined,
): asserts value is Locale {
  if (!isLocale(value)) {
    throw new Error("Unsupported locale");
  }
}

// Locale metadata — kept in sync with platform_languages table.
export const localeMetadata: Record<
  string,
  { name: string; nativeName: string; direction: "ltr" | "rtl" }
> = {
  en: { name: "English", nativeName: "English", direction: "ltr" },
  sw: { name: "Swahili", nativeName: "Kiswahili", direction: "ltr" },
  fr: { name: "French", nativeName: "Français", direction: "ltr" },
};

export function getDirection(locale?: Locale): "ltr" | "rtl" {
  if (!locale) return "ltr";
  return localeMetadata[locale]?.direction ?? "ltr";
}
