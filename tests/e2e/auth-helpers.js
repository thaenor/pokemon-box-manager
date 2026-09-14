/**
 * Auth helpers for E2E tests using the Firebase auth mock.
 *
 * These functions control the auth state from within the browser context.
 */

/**
 * Set auth state before navigating to the app.
 * @param {import('@playwright/test').Page} page — Playwright page object
 * @param {object|null} user — mock user object, or null for unauthenticated
 */
export async function setAuthState(page, user) {
  await page.evaluate((u) => {
    window.__authState = u;
  }, user);
}

/**
 * Set an error that signInWithPopup should throw.
 * @param {import('@playwright/test').Page} page
 * @param {object|null} error — { code: 'auth/popup-blocked', message: '...' } or null for success
 */
export async function setAuthError(page, error) {
  await page.evaluate((e) => {
    window.__authError = e;
  }, error);
}

/**
 * Mock user factory for authenticated state.
 * @param {object} [overrides] — fields to override
 * @returns {object} mock Firebase user object
 */
export function mockUser(overrides = {}) {
  return {
    uid: "test-uid",
    email: "test@example.com",
    displayName: "Test User",
    ...overrides,
  };
}
