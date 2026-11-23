import eslintRecommended from "@eslint/js";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  eslintRecommended.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "prettier/prettier": "error",
    },
  },
  {
    ignores: [
      "node_modules/",
      "data/",
      ".git/",
      "playwright-report/",
      "test-results/",
      ".vitest/",
      "scripts/",
      "sw.js",
    ],
  },
];
