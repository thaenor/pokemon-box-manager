import { test, expect } from "@playwright/test";

/**
 * Validate that browser-only code (IIFE, DOM elements, service-worker
 * interactions) is present and initializing without errors.
 *
 * These are lightweight DOM-presence checks that run in CI's e2e job
 * alongside the existing Playwright tests — no new infra needed.
 */

test.describe("Browser-only code validation", () => {
  test("reCAPTCHA Verify button exists in the DOM", async ({ page }) => {
    await page.goto("/");
    const btn = page.locator("button", { hasText: "Verify reCAPTCHA" });
    await expect(btn).toBeVisible({ timeout: 5000 });
  });

  test("Force Refresh button exists in the DOM", async ({ page }) => {
    await page.goto("/");
    const btn = page.locator("button", { hasText: "Force Refresh" });
    await expect(btn).toBeVisible({ timeout: 5000 });
  });
});
