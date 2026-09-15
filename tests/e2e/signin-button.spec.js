import { test, expect } from "./fixtures.js";

/**
 * E2E tests for sign-in button states — loading text, error messages, disabled state.
 *
 * Relies on the shared Firebase mock (firebase-auth-mock.js) which intercepts
 * signInWithPopup and controls behaviour via window.__authError and
 * window.__authDelay.
 */

test.describe("Sign-in button states", () => {
  test('button shows "Signing in…" while popup is open', async ({ page }) => {
    // Start unauthenticated + defer sign-in promise so loading state is observable
    await page.addInitScript(() => {
      window.__authState = null;
      window.__authDelay = true;
    });
    await page.goto("/");

    const loginButton = page.getByRole("button", { name: /Sign in with Google/ });
    await expect(loginButton).toBeVisible({ timeout: 5000 });

    // Click — loading state should appear synchronously
    await loginButton.click();

    await expect(page.getByText("Signing in…")).toBeVisible();
    await expect(page.getByRole("button", { name: /Signing in…/ })).toBeDisabled();

    // Resolve the deferred promise — still unauthenticated, stays on login view.
    // Resolving the promise alone doesn't trigger onAuthStateChanged, so we must
    // set __authState (even to null) to fire the auth-state listener and re-render.
    await page.evaluate(() => {
      window.__authResolve({ user: null });
      window.__authState = null;
    });

    // Button returns to normal
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await expect(loginButton).toBeEnabled();
  });

  test("shows inline error on auth/popup-blocked", async ({ page }) => {
    await page.addInitScript(() => {
      window.__authState = null;
      window.__authError = { code: "auth/popup-blocked" };
    });
    await page.goto("/");

    const loginButton = page.getByRole("button", { name: /Sign in with Google/ });
    await expect(loginButton).toBeVisible({ timeout: 5000 });

    await loginButton.click();

    await expect(
      page.getByText("Popup was blocked. Please allow popups for this site."),
    ).toBeVisible({ timeout: 5000 });
    await expect(loginButton).toBeEnabled();
  });

  test("shows inline error on auth/popup-closed-by-user", async ({ page }) => {
    await page.addInitScript(() => {
      window.__authState = null;
      window.__authError = { code: "auth/popup-closed-by-user" };
    });
    await page.goto("/");

    const loginButton = page.getByRole("button", { name: /Sign in with Google/ });
    await expect(loginButton).toBeVisible({ timeout: 5000 });

    await loginButton.click();

    await expect(page.getByText("Sign-in cancelled.")).toBeVisible({
      timeout: 5000,
    });
    await expect(loginButton).toBeEnabled();
  });

  test("shows generic error on unknown failure", async ({ page }) => {
    await page.addInitScript(() => {
      window.__authState = null;
      window.__authError = { code: "auth/unknown" };
    });
    await page.goto("/");

    const loginButton = page.getByRole("button", { name: /Sign in with Google/ });
    await expect(loginButton).toBeVisible({ timeout: 5000 });

    await loginButton.click();

    await expect(page.getByText("Sign-in failed. Please try again.")).toBeVisible({
      timeout: 5000,
    });
    await expect(loginButton).toBeEnabled();
  });

  test("button re-enables and can be clicked again after error", async ({ page }) => {
    await page.addInitScript(() => {
      window.__authState = null;
      window.__authError = { code: "auth/popup-blocked" };
    });
    await page.goto("/");

    const loginButton = page.getByRole("button", { name: /Sign in with Google/ });
    await expect(loginButton).toBeVisible({ timeout: 5000 });

    // First click — error occurs
    await loginButton.click();
    await expect(page.getByText("Popup was blocked")).toBeVisible({
      timeout: 5000,
    });

    // Button should return to original state
    await expect(loginButton).toBeEnabled();
    await expect(page.getByText("Sign in with Google")).toBeVisible();

    // Second click should be possible — verify the signingIn flag was reset
    await loginButton.click();
    await expect(page.getByText("Popup was blocked")).toBeVisible({
      timeout: 5000,
    });
  });
});
