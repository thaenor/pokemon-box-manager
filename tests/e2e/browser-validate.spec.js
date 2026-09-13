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

  test("no console errors during page initialization", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => {
      // Only capture actual console.error() calls, not network-level 403/etc errors
      if (
        msg.type() === "error" &&
        !msg.text().includes("Failed to load resource") &&
        !msg.text().startsWith("@firebase/")
      ) {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    // Wait for the app to settle: force refresh and reCAPTCHA buttons
    // are created by the IIFE at the end of DOMContentLoaded.
    await expect(page.locator("button", { hasText: "Force Refresh" })).toBeVisible({
      timeout: 5000,
    });

    expect(errors).toHaveLength(0);
  });
});
