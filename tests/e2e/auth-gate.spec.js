import { test, expect } from "@playwright/test";

/**
 * E2E tests for the auth gate — login view vs box grid.
 *
 * Strategy: use page.addInitScript() to stub firebase.auth() before the page loads,
 * and override navigator.webdriver so the auth gate activates instead of being bypassed.
 */

/** Create a minimal Firebase auth stub that fires onAuthStateChanged with a given user. */
function stubFirebase(user) {
  return () => {
    // Override Playwright's navigator.webdriver so the auth gate activates
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });

    const authInstance = {
      onAuthStateChanged: (cb) => {
        setTimeout(() => cb(user), 0);
      },
      signInWithPopup: async () => {},
      signOut: async () => {},
    };

    const authFn = () => authInstance;
    authFn.GoogleAuthProvider = function GoogleAuthProvider() {};

    window.firebase = { auth: authFn };
  };
}

/** Create a controllable Firebase auth stub for swap tests. */
function controllableStub(initialUser) {
  return () => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });

    let authCallback = null;

    window.__authState = initialUser;
    window.__setAuthState = (user) => {
      window.__authState = user;
      if (authCallback) {
        setTimeout(() => authCallback(user), 0);
      }
    };

    const authInstance = {
      onAuthStateChanged: (cb) => {
        authCallback = cb;
        setTimeout(() => cb(initialUser), 0);
      },
      signInWithPopup: async () => {},
      signOut: async () => {
        // Sign-out calls signOut() then relies on onAuthStateChanged(null) to transition
        window.__setAuthState(null);
      },
    };

    const authFn = () => authInstance;
    authFn.GoogleAuthProvider = function GoogleAuthProvider() {};

    window.firebase = { auth: authFn };
  };
}

test.describe("Auth gate", () => {
  test("shows login view when unauthenticated", async ({ page }) => {
    await page.addInitScript(stubFirebase(null));
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
    const mockUser = { uid: "test-user", email: "test@example.com" };
    await page.addInitScript(stubFirebase(mockUser));
    await page.goto("/");

    // Box grid renders — empty state message
    await expect(page.getByText("Your box is empty")).toBeVisible({
      timeout: 5000,
    });

    // Box nav header renders
    await expect(page.getByText(/^[0-9]+\/40$/)).toBeVisible();

    // No login view elements
    await expect(page.getByText("Sign in with Google")).not.toBeVisible();
  });

  test("swaps from login to box grid on sign-in", async ({ page }) => {
    await page.addInitScript(controllableStub(null));
    await page.goto("/");

    // Initially login view
    await expect(page.getByText("Sign in with Google")).toBeVisible({
      timeout: 5000,
    });

    // Simulate sign-in
    await page.evaluate(() => {
      window.__setAuthState({ uid: "test-user" });
    });

    // After sign-in, box grid should appear
    await expect(page.getByText("Your box is empty")).toBeVisible({
      timeout: 5000,
    });

    // Login view gone
    await expect(page.getByText("Sign in with Google")).not.toBeVisible();
  });

  test("swaps from box grid to login on sign-out", async ({ page }) => {
    const mockUser = { uid: "test-user", email: "test@example.com" };
    await page.addInitScript(controllableStub(mockUser));
    await page.goto("/");

    // Initially box grid
    await expect(page.getByText("Your box is empty")).toBeVisible({
      timeout: 5000,
    });

    // Simulate sign-out
    await page.evaluate(() => {
      window.__setAuthState(null);
    });

    // After sign-out, login view should appear
    await expect(page.getByText("Sign in with Google")).toBeVisible({
      timeout: 5000,
    });

    // Box grid gone
    await expect(page.getByText("Your box is empty")).not.toBeVisible();
  });
});
