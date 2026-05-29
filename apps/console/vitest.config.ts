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
      "next/headers": path.join(root, "packages/auth/__mocks__/next-headers.ts"),
      "next/navigation": path.join(
        root,
        "apps/identity/__mocks__/next-navigation.ts",
      ),
    },
  },
});
