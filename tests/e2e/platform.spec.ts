import { expect, test } from "@playwright/test";

test("public home page loads", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: /juris/i })).toBeVisible();
});

test("login page loads and mock sign in navigates to console", async ({
  page,
}) => {
  await page.goto("/en/login");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  await page.getByRole("button", { name: /continue with mock/i }).click();
  await expect(page).toHaveURL(/\/en\/console/);
  await expect(
    page.getByRole("heading", { name: /console overview/i }),
  ).toBeVisible();
});

test("product pages load through the gateway", async ({ page }) => {
  for (const path of [
    "/en/billing",
    "/en/reports",
    "/en/admin",
    "/en/settings",
    "/en/support",
  ]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
  }
});

test("theme toggle and locale route work", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: /toggle theme/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: /change language/i }).click();
  await page.getByRole("menuitem", { name: /français/i }).click();
  await expect(page).toHaveURL(/\/fr/);
});
