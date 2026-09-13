import { test, expect } from "@playwright/test";

test.describe("Pokémon Box Manager", () => {
  test("page loads and shows box grid with 30 slots", async ({ page }) => {
    await page.goto("/");
    // App mounts into <main id="app">
    const main = page.locator("main#app");
    await expect(main).toBeVisible({ timeout: 5000 });

    // The box grid should contain 30 slot elements (3 rows × 10 columns)
    const slots = page.locator('[data-testid="box-slot"]');
    await expect(slots).toHaveCount(30);
  });

  test("can open species search overlay", async ({ page }) => {
    await page.goto("/");

    // Click on an empty slot to open the search overlay
    const firstSlot = page.locator('[data-testid="box-slot"]').first();
    await firstSlot.click();

    // The species search overlay should appear
    const searchOverlay = page.locator('[data-testid="species-search"]');
    await expect(searchOverlay).toBeVisible({ timeout: 3000 });
  });

  test("can search by name and see results", async ({ page }) => {
    await page.goto("/");

    // Open search overlay
    const firstSlot = page.locator('[data-testid="box-slot"]').first();
    await firstSlot.click();

    // Type a search query
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill("Charizard");

    // Search results should appear
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible({ timeout: 3000 });
    await expect(results).toHaveCount(1);
  });
});
