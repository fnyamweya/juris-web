import { vi } from "vitest";

export const redirect = vi.fn<[string], never>(() => {
  throw new Error("NEXT_REDIRECT");
});

export const useRouter = vi.fn();
export const usePathname = vi.fn(() => "/");
export const useSearchParams = vi.fn(() => new URLSearchParams());
