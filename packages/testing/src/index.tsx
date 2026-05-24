import { mockSession, mockTenants, mockUser } from "@repo/auth";
import { getMessages } from "@repo/i18n";
import type { Locale } from "@repo/i18n";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

export function createMockUser() {
  return mockUser;
}

export function createMockTenant() {
  return mockTenants[0]!;
}

export function createMockSession() {
  return mockSession;
}

export async function renderWithProviders(
  ui: ReactElement,
  options: {
    locale?: Locale;
    wrapper?: (children: ReactNode) => ReactNode;
  } = {},
) {
  const locale = options.locale ?? "en";
  const messages = await getMessages(locale);

  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {options.wrapper ? options.wrapper(ui) : ui}
    </NextIntlClientProvider>,
  );
}
