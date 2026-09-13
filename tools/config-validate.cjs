#!/usr/bin/env node
/**
 * config-validate.js — lightweight validation of vitest.config.js & .github/workflows/ci.yml
 *
 * Runs in CI as part of the `lint` job (or locally via `node tools/config-validate.cjs`).
 * No external deps beyond the project's transitive `js-yaml`.
 *
 * Exit code: 0 = all valid, 1 = validation failure.
 */

const fs = require("fs");
const path = require("path");
const { parse: parseYaml } = require("js-yaml");

const ROOT = path.resolve(__dirname, "..");

let errors = [];

// ── helpers ──

function fail(msg) {
  errors.push(msg);
  console.error(`  ❌  ${msg}`);
}

function ok(msg) {
  console.log(`  ✅  ${msg}`);
}

// ══════════════════════════════════════════════
// 1. vitest.config.js
// ══════════════════════════════════════════════

console.log("\n── vitest.config.js ──");

const vitestPath = path.join(ROOT, "vitest.config.js");
if (!fs.existsSync(vitestPath)) {
  fail("vitest.config.js not found");
} else {
  ok("file exists");

  // Read the file. We use string matching since it's a plain JS export,
  // not a JSON module — vitest/config defineConfig() returns an object
  // but the file itself isn't importable directly in Node without vitest.
  const src = fs.readFileSync(vitestPath, "utf8");

  const checks = [
    { label: 'environment: "happy-dom"', pattern: /environment:\s*["']happy-dom["']/ },
    {
      label: 'include: ["tests/**/*.test.js"]',
      pattern: /include:\s*\[.*"?tests\/\*\*\/\*\.test\.js"?/,
    },
    { label: "coverage provider: v8", pattern: /provider:\s*["']v8["']/ },
    { label: 'coverage include: ["js/**/*.js"]', pattern: /include:\s*\[.*"?js\/\*\*\/\*\.js"?/ },
    {
      label: "coverage reporter: text, lcov, text-summary",
      pattern: /reporter:\s*\[[^\]]*["']text["'][^\]]*["']lcov["'][^\]]*["']text-summary["']/,
    },
    {
      label: "coverage reportsDirectory: coverage",
      pattern: /reportsDirectory:\s*["']coverage["']/,
    },
  ];

  checks.forEach((c) => {
    if (c.pattern.test(src)) ok(c.label);
    else fail(`${c.label} — missing or malformed`);
  });
}

// ══════════════════════════════════════════════
// 2. .github/workflows/ci.yml
// ══════════════════════════════════════════════

console.log("\n── .github/workflows/ci.yml ──");

const ciPath = path.join(ROOT, ".github/workflows/ci.yml");
if (!fs.existsSync(ciPath)) {
  fail(".github/workflows/ci.yml not found");
} else {
  ok("file exists");

  const raw = fs.readFileSync(ciPath, "utf8");
  let ci;
  try {
    ci = parseYaml(raw);
  } catch (e) {
    fail(`YAML parse error: ${e.message}`);
    // Bail on YAML errors — remaining checks would be misleading
    process.exitCode = 1;
    printSummary();
    process.exit(1);
  }

  // Job names
  const expectedJobs = ["lint", "unit", "e2e"];
  const actualJobs = Object.keys(ci.jobs || {});

  expectedJobs.forEach((name) => {
    if (actualJobs.includes(name)) ok(`job "${name}" exists`);
    else fail(`job "${name}" is missing`);
  });

  // No extra top-level jobs (warn only — new jobs could be intentionally added)
  const extras = actualJobs.filter((j) => !expectedJobs.includes(j));
  extras.forEach((name) => console.log(`  ⚠️   unexpected job "${name}" — verify intent`));

  // Node version
  const nodeVersionExpected = 22;
  actualJobs.forEach((name) => {
    const steps = ci.jobs[name]?.steps || [];
    const setupStep = steps.find((s) => s.uses && s.uses.startsWith("actions/setup-node"));
    if (!setupStep) {
      fail(`job "${name}": missing actions/setup-node step`);
      return;
    }
    const nodeVer = setupStep.with?.["node-version"];
    if (nodeVer === nodeVersionExpected) {
      ok(`job "${name}": node-version ${nodeVer}`);
    } else if (nodeVer) {
      fail(`job "${name}": node-version is ${nodeVer}, expected ${nodeVersionExpected}`);
    } else {
      fail(`job "${name}": node-version not set`);
    }
  });

  // e2e needs: [lint, unit]
  const e2eJob = ci.jobs?.e2e;
  if (e2eJob) {
    const needs = e2eJob.needs || [];
    if (needs.includes("lint") && needs.includes("unit")) {
      ok("e2e needs: [lint, unit]");
    } else {
      fail(`e2e needs is [${needs.join(", ")}] — expected [lint, unit]`);
    }
  }

  // Action versions are v4
  const actionVersions = ["actions/checkout", "actions/setup-node", "actions/upload-artifact"];
  actionVersions.forEach((action) => {
    const re = new RegExp(`uses:\\s*${action}@v(\\d+)`, "g");
    let match;
    while ((match = re.exec(raw)) !== null) {
      const ver = match[1];
      if (ver !== "4") {
        fail(`${action}@v${ver} — expected v4`);
      } else {
        ok(`${action}@v${ver}`);
      }
    }
  });
}

// ══════════════════════════════════════════════
// Summary
// ══════════════════════════════════════════════

function printSummary() {
  const total = errors.length;
  if (total === 0) {
    console.log("\n✅  All configs valid — no drift detected.\n");
  } else {
    console.log(`\n❌  ${total} validation failure(s) found.\n`);
  }
}

printSummary();
process.exit(errors.length > 0 ? 1 : 0);
