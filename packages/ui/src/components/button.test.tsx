import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, buttonVariants } from "./button";

describe("Button", () => {
  it("renders a button with children", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("uses type='button' by default", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("allows overriding the button type", () => {
    render(<Button type="submit">Submit</Button>);

    expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("applies variant and size classes", () => {
    render(
      <Button variant="secondary" size="lg">
        Continue
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Continue" });

    expect(button).toHaveClass(
      buttonVariants({ variant: "secondary", size: "lg" }),
    );
  });

  it("merges custom className", () => {
    render(<Button className="custom-class">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "custom-class",
    );
  });

  it("disables the button when disabled is true", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toBeDisabled();

    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("disables the button while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-loading");

    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders loadingText when loading", () => {
    render(
      <Button loading loadingText="Saving...">
        Save
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("renders the loader icon when loading", () => {
    render(<Button loading>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });

    expect(button.querySelector('[data-slot="button-loader"]')).toBeTruthy();
  });

  it("calls onClick when enabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders as child when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/dashboard">Dashboard</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Dashboard" });

    expect(link).toHaveAttribute("href", "/dashboard");
    expect(link).toHaveAttribute("data-slot", "button");
  });

  it("marks child as aria-disabled when asChild and disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button asChild disabled onClick={onClick}>
        <a href="/dashboard">Dashboard</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Dashboard" });

    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("data-disabled");

    await user.click(link);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("marks child as aria-disabled when asChild and loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button asChild loading onClick={onClick}>
        <a href="/dashboard">Dashboard</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Dashboard" });

    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("aria-busy", "true");
    expect(link).toHaveAttribute("data-loading");

    await user.click(link);

    expect(onClick).not.toHaveBeenCalled();
  });
});
