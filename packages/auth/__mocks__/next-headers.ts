// Stub for next/headers used in packages/auth unit tests.
// The real next/headers is only available inside a Next.js runtime.
// Tests that need specific cookie behaviour override this with vi.mock().
import { vi } from "vitest";

export const cookies = vi.fn(async () => ({
  get: vi.fn((_name: string) => undefined),
  set: vi.fn(),
  delete: vi.fn(),
}));
