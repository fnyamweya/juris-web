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

export function getDirection(locale?: Locale): "ltr" {
  void locale;
  return "ltr";
}
