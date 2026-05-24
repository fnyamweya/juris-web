import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  transpilePackages: [
    "@repo/ui",
    "@repo/tokens",
    "@repo/auth",
    "@repo/access-control",
    "@repo/i18n",
    "@repo/telemetry",
    "@repo/contracts",
    "@repo/security",
    "@repo/platform",
    "@repo/testing",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
