import { getDirection, getMessages, isLocale, locales } from "@repo/i18n";
import { CSP_NONCE_HEADER } from "@repo/security";
import { ThemeProvider, Toaster } from "@repo/ui";
import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "Juris Settings",
  description: "Juris Settings frontend",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);
  const nonce = (await headers()).get(CSP_NONCE_HEADER) ?? undefined;

  return (
    <div lang={locale} dir={getDirection(locale)}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider nonce={nonce}>
          {children}
          <Toaster richColors closeButton />
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  );
}
