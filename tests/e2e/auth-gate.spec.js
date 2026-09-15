import { test, expect } from "./fixtures.js";

/**
 * E2E tests for the auth gate — login view vs box grid.
 *
 * Uses the shared Firebase mock fixture (intercepts CDN scripts, injects
 * controllable auth stub, strips navigator.webdriver so the gate activates).
 *
 * Auth state is controlled via window.__authState:
 *   - Set via page.addInitScript BEFORE page.goto() for initial state
 *   - Changed via page.evaluate() for swap transitions
 *     (the mock's defineProperty setter notifies onAuthStateChanged listeners)
 */

test.describe("Auth gate", () => {
  test("shows login view when unauthenticated", async ({ page }) => {
    // Override fixture default — start unauthenticated
    await page.addInitScript(() => {
      window.__authState = null;
    });
    await page.goto("/");

    // Title
    await expect(page.getByText("Pokémon Box Manager")).toBeVisible({
      timeout: 5000,
    });

    // Subtitle
    await expect(page.getByText("Sign in to manage your battle box")).toBeVisible();

    // Sign-in button
    await expect(page.getByText("Sign in with Google")).toBeVisible();

    // No box grid elements
    await expect(page.getByText("Your box is empty")).not.toBeVisible();
  });

  test("shows box grid when authenticated", async ({ page }) => {
    // Fixture defaults to authenticated — no override needed
    await page.goto("/");

    // Box grid renders — empty state message
    await expect(page.getByText("Your box is empty")).toBeVisible({
      timeout: 5000,
    });

    // Box nav header renders (capacity text like "0/40")
    await expect(page.getByText(/^0\/[0-9]+$/)).toBeVisible();

    // No login view elements
    await expect(page.getByText("Sign in with Google")).not.toBeVisible();
  });

  test("swaps from login to box grid on sign-in", async ({ page }) => {
    // Start unauthenticated
    await page.addInitScript(() => {
      window.__authState = null;
    });
    await page.goto("/");

    // Initially login view
    await expect(page.getByText("Sign in with Google")).toBeVisible({
      timeout: 5000,
    });

    // Simulate sign-in — mock's __authState setter notifies all listeners
    await page.evaluate(() => {
      window.__authState = { uid: "test-uid", email: "test@example.com" };
    });

    // After sign-in, box grid should appear
    await expect(page.getByText("Your box is empty")).toBeVisible({
      timeout: 5000,
    });

    // Login view gone
    await expect(page.getByText("Sign in with Google")).not.toBeVisible();
  });

  test("swaps from box grid to login on sign-out", async ({ page }) => {
    // Fixture defaults to authenticated — no override needed
    await page.goto("/");

    // Initially box grid
    await expect(page.getByText("Your box is empty")).toBeVisible({
      timeout: 5000,
    });

    // Simulate sign-out — mock's __authState setter notifies all listeners
    await page.evaluate(() => {
      window.__authState = null;
    });

    // After sign-out, login view should appear
    await expect(page.getByText("Sign in with Google")).toBeVisible({
      timeout: 5000,
    });

    // Box grid gone
    await expect(page.getByText("Your box is empty")).not.toBeVisible();
  });
});
