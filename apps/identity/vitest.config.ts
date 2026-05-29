import path from "path";
import { defineConfig } from "vitest/config";

const root = path.resolve(__dirname, "../..");

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@repo/auth": path.join(root, "packages/auth/src/index.ts"),
      "@repo/platform": path.join(root, "packages/platform/src/index.ts"),
      "@repo/i18n": path.join(root, "packages/i18n/src/index.ts"),
      "@repo/security": path.join(root, "packages/security/src/index.ts"),
      // Stub next/* modules that are unavailable outside a Next.js runtime.
      // Tests override these stubs with vi.mock() as needed.
      "next/headers": path.join(root, "packages/auth/__mocks__/next-headers.ts"),
      "next/navigation": path.join(__dirname, "__mocks__/next-navigation.ts"),
    },
  },
});
