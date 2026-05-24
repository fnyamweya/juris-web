import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./navigation";
import { THEME_COOKIE_NAME } from "../lib/theme";

const { setTheme } = vi.hoisted(() => ({
  setTheme: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    setTheme.mockClear();
    document.cookie = `${THEME_COOKIE_NAME}=; Max-Age=0; Path=/`;
  });

  it("renders an accessible control", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
  });

  it("syncs the theme cookie before updating next-themes", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));

    expect(document.cookie).toContain(`${THEME_COOKIE_NAME}=dark`);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
