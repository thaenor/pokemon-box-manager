import { test, expect } from "@playwright/test";

test.describe("Box flow E2E", () => {
  test("renders empty state on load", async ({ page }) => {
    await page.goto("/");
    // Wait for app to render: empty state text
    await expect(page.locator("text=Your box is empty")).toBeVisible();
    await expect(page.locator("text=Tap an empty slot to add a Pokémon")).toBeVisible();
  });

  test("box slots have data-testid attribute", async ({ page }) => {
    await page.goto("/");
    const slots = page.locator('[data-testid="box-slot"]');
    await expect(slots).toHaveCount(40);
  });
});
