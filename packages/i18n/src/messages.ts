import en from "../messages/en.json";
import fr from "../messages/fr.json";
import sw from "../messages/sw.json";
import type { Locale } from "./locales";

export type Messages = typeof en;

export const messagesByLocale: Record<Locale, Messages> = {
  en,
  sw,
  fr,
};

export function getMessages(locale: Locale): Promise<Messages> {
  return Promise.resolve(messagesByLocale[locale]);
}
