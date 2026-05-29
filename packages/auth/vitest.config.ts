import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      // Resolve workspace packages so vitest can find them without Next.js context
      "@repo/platform": path.resolve(__dirname, "../platform/src/index.ts"),
      // Stub next/headers — real implementation only available inside Next.js runtime.
      // Individual tests override this with vi.mock("next/headers", ...) as needed.
      "next/headers": path.resolve(__dirname, "__mocks__/next-headers.ts"),
    },
  },
});
