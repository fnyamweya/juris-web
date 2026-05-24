import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import type { AnchorHTMLAttributes } from "react";
import { vi } from "vitest";

type MockLocaleLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  locale?: string;
};

function MockLocaleLink({
  href,
  locale,
  children,
  ...props
}: MockLocaleLinkProps) {
  const localizedHref = locale ? `/${locale}${href === "/" ? "" : href}` : href;

  return createElement("a", { ...props, href: localizedHref }, children);
}

vi.mock("@repo/i18n", () => ({
  Link: MockLocaleLink,
  locales: ["en", "sw", "fr"],
  usePathname: () => "/console",
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));
