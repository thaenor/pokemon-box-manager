import { defineConfig } from "@playwright/test";
import { basename, dirname, resolve } from "node:path";

const origin = "http://127.0.0.1:4173";
const pagesArtifact = process.env.PAGES_ARTIFACT;
const baseURL = pagesArtifact
  ? `${origin}/${encodeURIComponent(basename(pagesArtifact))}/`
  : origin;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: pagesArtifact ? "serve . --no-port-switching -l tcp://127.0.0.1:4173" : "npm run dev",
    cwd: pagesArtifact ? dirname(resolve(pagesArtifact)) : undefined,
    url: baseURL,
    reuseExistingServer: !pagesArtifact && !process.env.CI,
  },
});
