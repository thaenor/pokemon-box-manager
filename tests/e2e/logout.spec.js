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
    const signOut = page.getByRole("button", { name: /^Sign out$/ });
    await expect(signOut).toBeVisible({ timeout: 5000 });
  });

  test("clicking sign out returns to login view", async ({ page }) => {
    await page.goto("/");

    // Confirm we're in the box view
    await expect(page.getByText("Your box is empty")).toBeVisible({
      timeout: 5000,
    });

    // Click sign out
    await page.getByRole("button", { name: /^Sign out$/ }).click();

    // Login view should appear
    await expect(page.getByText("Sign in with Google")).toBeVisible({
      timeout: 5000,
    });

    // Box grid gone
    await expect(page.getByText("Your box is empty")).not.toBeVisible();
  });

  test("box data stays in localStorage after sign out", async ({ page }) => {
    // Seed localStorage before navigation
    await page.addInitScript(() => {
      const fakeData = [
        { species: "Pikachu", nickname: "Sparky" },
        null,
        { species: "Charizard", nickname: "Blaze" },
      ];
      localStorage.setItem("pokemon-box:slots", JSON.stringify(fakeData));
    });

    // Navigate — expected: authenticated, seed data in local storage
    await page.goto("/");

    // Confirm we're in the box view
    await expect(page.getByText("Pikachu")).toBeVisible({ timeout: 5000 });

    // Click sign out
    await page.getByRole("button", { name: /^Sign out$/ }).click();

    // Login view visible
    await expect(page.getByText("Sign in with Google")).toBeVisible({
      timeout: 5000,
    });

    // Box data still in localStorage
    const stored = await page.evaluate(() => localStorage.getItem("pokemon-box:slots"));
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored);
    expect(parsed).toBeInstanceOf(Array);
    expect(parsed.filter((p) => p !== null).length).toBe(2);

    // First Pokémon preserved
    expect(parsed[0]?.species).toBe("Pikachu");
    expect(parsed[2]?.species).toBe("Charizard");
  });
});
