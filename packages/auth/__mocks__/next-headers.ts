// Stub for next/headers used in packages/auth unit tests.
// The real next/headers is only available inside a Next.js runtime.
// Tests that need specific cookie behaviour override this with vi.mock().
import { vi } from "vitest";

export const cookies = vi.fn(() => ({
  get: vi.fn((name: string) => {
    void name;
    return undefined;
  }),
  set: vi.fn(),
  delete: vi.fn(),
}));
