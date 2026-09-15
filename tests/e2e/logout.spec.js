import { test, expect } from "./fixtures.js";

/**
 * E2E tests for the logout flow — clicking Sign out in the toolbar
 * returns to the login view and preserves box data in localStorage.
 *
 * Uses the shared Firebase mock fixture — defaults to authenticated
 * so the box view and toolbar render immediately.
 */

test.describe("Logout flow", () => {
  test("sign out button is visible in toolbar when authenticated", async ({ page }) => {
    await page.goto("/");
    const signOut = page
      .locator(".box-nav-header__toolbar")
      .getByRole("button", { name: /^Sign out$/ });
    await expect(signOut).toBeVisible({ timeout: 5000 });
  });

  test("clicking sign out returns to login view", async ({ page }) => {
    await page.goto("/");

    // Confirm we're in the box view
    await expect(page.getByText("Your box is empty")).toBeVisible({
      timeout: 5000,
    });

    // Click sign out
    await page
      .locator(".box-nav-header__toolbar")
      .getByRole("button", { name: /^Sign out$/ })
      .click();

    // Login view should appear
    await expect(page.getByText("Sign in with Google")).toBeVisible({
      timeout: 5000,
    });

    // Box grid gone
    await expect(page.getByText("Your box is empty")).not.toBeVisible();

    // Sign-out button disappears
    await expect(
      page.locator(".box-nav-header__toolbar").getByRole("button", { name: /^Sign out$/ }),
    ).not.toBeVisible();
  });

  test("box data stays in localStorage after sign out", async ({ page }) => {
    // Seed localStorage with properly shaped Pokémon objects before navigation.
    // Species must be an object { name, showdownId, types } matching the
    // shape expected by renderBoxGrid (see edit-remove.spec.js for the pattern).
    await page.addInitScript(() => {
      const fakeData = [
        {
          species: { name: "Pikachu", showdownId: "pikachu", types: ["Electric"] },
          showdownId: "pikachu",
          nickname: "Sparky",
          isShiny: false,
          stats: [
            { name: "hp", value: 35 },
            { name: "attack", value: 55 },
          ],
          ability: "static",
          nature: "Serious",
          recruitedDate: "2026-09-01",
        },
        null,
        {
          species: { name: "Charizard", showdownId: "charizard", types: ["Fire", "Flying"] },
          showdownId: "charizard",
          nickname: "Blaze",
          isShiny: false,
          stats: [
            { name: "hp", value: 78 },
            { name: "attack", value: 84 },
          ],
          ability: "blaze",
          nature: "Adamant",
          recruitedDate: "2026-09-01",
        },
      ];
      localStorage.setItem("pokemon-box:slots", JSON.stringify(fakeData));
    });

    // Navigate — expected: authenticated, seed data in local storage
    await page.goto("/");

    // Confirm we're in the box view with seeded Pokémon
    await expect(page.getByText("Pikachu")).toBeVisible({ timeout: 10000 });

    // Click sign out
    await page
      .locator(".box-nav-header__toolbar")
      .getByRole("button", { name: /^Sign out$/ })
      .click();

    // Login view visible
    await expect(page.getByText("Sign in with Google")).toBeVisible({
      timeout: 5000,
    });

    // Box data still in localStorage
    const stored = await page.evaluate(() => localStorage.getItem("pokemon-box:slots"));
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored);
    expect(parsed).toBeInstanceOf(Array);

    // Full structure preserved — middle null slot intact
    expect(parsed.length).toBe(3);
    expect(parsed[0]?.species?.name).toBe("Pikachu");
    expect(parsed[1]).toBeNull();
    expect(parsed[2]?.species?.name).toBe("Charizard");
  });
});
