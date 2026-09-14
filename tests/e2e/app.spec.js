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

    // Click the first empty grid slot (opens search overlay)
    const firstSlot = page.locator('[data-testid="box-slot"]').first();
    await firstSlot.click();

    const searchOverlay = page.locator('[data-testid="species-search"]');
    await expect(searchOverlay).toBeVisible({ timeout: 3000 });
  });

  test("can search by name and see results", async ({ page }) => {
    await page.goto("/");

    // Open search overlay by clicking first empty grid slot
    const firstSlot = page.locator('[data-testid="box-slot"]').first();
    await firstSlot.click();

    // Type a search query — Charizard
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill("Charizard");

    // Search results should appear
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible({ timeout: 3000 });
    // Charizard is the only match (megas removed), expect 1
    await expect(results).toHaveCount(1);
  });

  test("sprite loads in search results after typing a query", async ({ page }) => {
    await page.goto("/");

    // Open species search by clicking first empty grid slot
    const firstSlot = page.locator('[data-testid="box-slot"]').first();
    await firstSlot.click();
    await expect(page.locator('[data-testid="species-search"]')).toBeVisible({ timeout: 3000 });

    // Type "Charizard" — should render exactly 1 result
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill("Charizard");

    // Wait for the result row to appear
    const result = page.locator('[data-testid="search-result"]');
    await expect(result).toHaveCount(1);

    // The result row contains an <img> with the sprite
    const spriteImg = result.locator("img");

    // Wait for the sprite image to finish loading (load event fires)
    // Playwright's toBeAttached or toBeVisible checks the element, not its content
    // Use a dedicated wait for the load event via JS evaluation
    await expect(async () => {
      const loaded = await spriteImg.evaluate((img) => {
        return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
      });
      expect(loaded).toBe(true);
    }).toPass({ timeout: 10000 });

    // Also check the sprite has a valid source URL
    const src = await spriteImg.getAttribute("src");
    expect(src).toBeTruthy();
    expect(src).toMatch(/^https?:\/\//);
  });
});
