import { test, expect } from "./fixtures.js";

/**
 * Validate that browser-only code (IIFE, DOM elements, service-worker
 * interactions) is present and initializing without errors.
 *
 * These are lightweight DOM-presence checks that run in CI's e2e job
 * alongside the existing Playwright tests — no new infra needed.
 */

test.describe("Browser-only code validation", () => {
  test("no console errors during page initialization", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("./champions/");
    // Wait for app to render its initial state
    await expect(page.locator("text=Your box is empty")).toBeVisible({
      timeout: 5000,
    });

    expect(errors).toHaveLength(0);
  });
});
