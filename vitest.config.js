import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["js/**/*.js"],
      reporter: ["text", "lcov", "text-summary"],
      reportsDirectory: "coverage",
    },
  },
});
