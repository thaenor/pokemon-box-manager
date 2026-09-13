import { test, expect } from "@playwright/test";

test.describe("Pokémon Box Manager", () => {
  test("page loads and shows the app shell", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Pokémon Box Manager", { timeout: 5000 });
    const main = page.locator("main#app");
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test("can open species search overlay", async ({ page }) => {
    await page.goto("/");

    // Click the "+ Add Pokémon" button (opens search overlay)
    const addBtn = page.getByRole("button", { name: "+ Add Pokémon" });
    await addBtn.click();

    const searchOverlay = page.locator('[data-testid="species-search"]');
    await expect(searchOverlay).toBeVisible({ timeout: 3000 });
  });

  test("can search by name and see results", async ({ page }) => {
    await page.goto("/");

    // Open search overlay
    const addBtn = page.getByRole("button", { name: "+ Add Pokémon" });
    await addBtn.click();

    // Type a search query — Charizard
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill("Charizard");

    // Search results should appear
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible({ timeout: 3000 });
    // Charizard is the only match (megas removed), expect 1
    await expect(results).toHaveCount(1);
  });
});
