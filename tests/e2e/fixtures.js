/**
 * Shared Playwright fixture for Firebase-mocked tests.
 *
 * Intercepts Firebase Auth and App Check CDN scripts so they don't load,
 * strips navigator.webdriver so the auth gate activates, and injects the
 * controllable auth mock via addInitScript.
 *
 * Default: authenticated (mock user). Tests that need unauthenticated state
 * explicitly set setAuthState(page, null) before navigation.
 */
import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    // Intercept Firebase Auth CDN — serve empty (mock handles it)
    await page.route("**/firebase-auth-compat.js", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "",
      });
    });

    // Intercept Firebase App Check CDN — no-op (can't run reCAPTCHA in headless)
    await page.route("**/firebase-app-check-compat.js", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "",
      });
    });

    // Strip navigator.webdriver so the auth gate activates (not bypassed)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    // Inject auth mock via addInitScript — uses polling to wait for firebase global
    await page.addInitScript({ path: "tests/e2e/firebase-auth-mock.js" });

    // Default to authenticated state for backward compat with existing tests
    await page.addInitScript(() => {
      window.__authState = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User",
      };
    });

    await use(page);
  },
});

export { expect } from "@playwright/test";
