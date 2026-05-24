import "@repo/ui/styles.css";
import {
  getThemeClassName,
  THEME_COOKIE_NAME,
  ThemeScript,
} from "@repo/ui/theme";
import { CSP_NONCE_HEADER } from "@repo/security";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const theme = (await cookies()).get(THEME_COOKIE_NAME)?.value;
  const nonce = (await headers()).get(CSP_NONCE_HEADER) ?? undefined;

  return (
    <html
      lang="en"
      className={getThemeClassName(theme)}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript nonce={nonce} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
