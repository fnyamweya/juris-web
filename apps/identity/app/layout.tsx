import "@repo/ui/styles.css";
import {
  getDefaultFontPresetForApp,
  getThemeClassName,
  THEME_COOKIE_NAME,
  ThemeScript,
} from "@repo/ui/theme";
import { CSP_NONCE_HEADER } from "@repo/security";
import { cookies, headers } from "next/headers";
import {
  DM_Sans,
  Inter,
  JetBrains_Mono,
  Manrope,
  Outfit,
  Space_Grotesk,
} from "next/font/google";
import type { ReactNode } from "react";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

const fontVariableClasses = [
  outfit.variable,
  inter.variable,
  manrope.variable,
  dmSans.variable,
  spaceGrotesk.variable,
  jetbrainsMono.variable,
].join(" ");

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const appId = "identity";
  const theme = (await cookies()).get(THEME_COOKIE_NAME)?.value;
  const nonce = (await headers()).get(CSP_NONCE_HEADER) ?? undefined;

  return (
    <html
      lang="en"
      className={getThemeClassName(theme)}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript
          nonce={nonce}
          appId={appId}
          defaultThemePreset="juris"
          defaultAccent="juris"
          defaultFont={getDefaultFontPresetForApp(appId)}
        />
      </head>
      <body className={fontVariableClasses} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
