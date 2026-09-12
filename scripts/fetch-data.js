#!/usr/bin/env node
/**
 * fetch-data.js — Fetch & Bundle Pokémon Data for offline PWA
 *
 * Downloads:
 *   - Pokémon Showdown static data files (pokedex.json, moves.json, etc.)
 *   - Smogon usage stats (latest available from data.pkmn.cc/stats/)
 *   - PokéAPI sprite URL index (front-default sprites for every species)
 *
 * Converts .js source files from Showdown (abilities.js, items.js, typechart.js)
 * to plain JSON by evaluating them in a Node.js VM sandbox.
 *
 * Output: all files under <project-root>/data/
 *
 * Usage:
 *   node scripts/fetch-data.js
 *   node scripts/fetch-data.js --help
 *   node scripts/fetch-data.js --skip-stats --skip-sprites --include-learnsets
 *
 * Options:
 *   --help              Show this help message
 *   --skip-stats        Skip Smogon usage stats download
 *   --skip-sprites      Skip PokéAPI sprite URL index download
 *   --include-learnsets Include learnsets.json (~3MB) — skipped by default
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const STATS_DIR = path.join(DATA_DIR, 'usage-stats');
const SPRITES_DIR = path.join(DATA_DIR, 'sprites');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SHOWDOWN_BASE = 'https://play.pokemonshowdown.com/data';
const STATS_BASE = 'https://data.pkmn.cc/stats';
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

/**
 * Files to download from play.pokemonshowdown.com/data/
 * Each entry: { name, url, type, skip?: boolean }
 * - type: 'json'  → save as-is
 * - type: 'js'    → evaluate with VM and export the main key as JSON
 */
const SHOWDOWN_FILES = [
  { name: 'pokedex.json',   url: `${SHOWDOWN_BASE}/pokedex.json`,   type: 'json' },
  { name: 'moves.json',     url: `${SHOWDOWN_BASE}/moves.json`,     type: 'json' },
  { name: 'abilities.json', url: `${SHOWDOWN_BASE}/abilities.js`,   type: 'js', exportKey: 'BattleAbilities' },
  { name: 'items.json',     url: `${SHOWDOWN_BASE}/items.js`,       type: 'js', exportKey: 'BattleItems' },
  { name: 'type-chart.json', url: `${SHOWDOWN_BASE}/typechart.js`,  type: 'js', exportKey: 'BattleTypeChart' },
  { name: 'learnsets.json', url: `${SHOWDOWN_BASE}/learnsets.json`, type: 'json', skip: true },
];

/**
 * Smogon formats to download stats for
 */
const STATS_FORMATS = ['gen9ou', 'gen9doublesou'];

/**
 * PokéAPI species limit (all known species as of Gen 9)
 */
const POKEAPI_SPECIES_LIMIT = 1100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(label, msg) {
  console.log(`[${label.padEnd(12)}] ${msg}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Ensure a directory exists (recursive).
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Fetch a URL with a reasonable timeout.
 */
async function fetchWithTimeout(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Download: Showdown data files
// ---------------------------------------------------------------------------

/**
 * Download a single file from Showdown, saving to data/.
 * For .js files, evaluates them in a VM sandbox to extract the exported object.
 */
async function downloadShowdownFile(fileConfig) {
  const destPath = path.join(DATA_DIR, fileConfig.name);

  log('SHOWDOWN', `Downloading ${fileConfig.url} → ${fileConfig.name}`);

  const response = await fetchWithTimeout(fileConfig.url, 60000);
  const body = await response.text();
  let data;

  if (fileConfig.type === 'json') {
    data = body;
  } else if (fileConfig.type === 'js') {
    log('SHOWDOWN', `Converting JS → JSON (export key: ${fileConfig.exportKey})`);
    const sandbox = { exports: {} };
    const script = new vm.Script(body);
    script.runInNewContext(sandbox);
    const exported = sandbox.exports[fileConfig.exportKey];
    if (!exported) {
      throw new Error(`Export key "${fileConfig.exportKey}" not found in evaluated JS`);
    }
    data = JSON.stringify(exported, null, 2);
  }

  fs.writeFileSync(destPath, data, 'utf-8');

  const stats = fs.statSync(destPath);
  log('SHOWDOWN', `✅ Saved ${fileConfig.name} (${formatBytes(stats.size)})`);
  return { name: fileConfig.name, size: stats.size };
}

/**
 * Download all configured Showdown files in parallel.
 */
async function downloadShowdownData(includeLearnsets) {
  const files = SHOWDOWN_FILES.filter(f => !f.skip || includeLearnsets);
  log('SHOWDOWN', `Downloading ${files.length} file(s) from Showdown…`);

  const results = await Promise.allSettled(
    files.map(f => downloadShowdownFile(f))
  );

  const succeeded = [];
  const failed = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      succeeded.push(result.value);
    } else {
      const failedFile = files[results.indexOf(result)];
      failed.push(failedFile.name);
      log('SHOWDOWN', `❌ Failed: ${failedFile.name} — ${result.reason.message}`);
    }
  }

  return { succeeded, failed };
}

// ---------------------------------------------------------------------------
// Download: Smogon usage stats
// ---------------------------------------------------------------------------

/**
 * Download stats index and specified format stats.
 */
async function downloadUsageStats() {
  ensureDir(STATS_DIR);

  // Download index first to see what's available
  log('STATS', 'Fetching stats index…');
  let indexData;
  try {
    const res = await fetchWithTimeout(`${STATS_BASE}/index.json`, 30000);
    indexData = await res.json();
    log('STATS', `Index has ${Object.keys(indexData).length} formats`);
  } catch (err) {
    log('STATS', `⚠️ Could not fetch index: ${err.message}`);
    log('STATS', 'Will try downloading individual formats directly');
    indexData = null;
  }

  // Filter to requested formats, handling missing ones gracefully.
  // The index keys include ".json" suffix (e.g. "gen9ou.json").
  const formatsToFetch = STATS_FORMATS.filter(fmt => {
    const key = `${fmt}.json`;
    if (indexData && !indexData[key]) {
      log('STATS', `⚠️ Format "${fmt}" not found in index, skipping`);
      return false;
    }
    return true;
  });

  if (formatsToFetch.length === 0) {
    log('STATS', 'No formats to download');
    return { succeeded: [], failed: [] };
  }

  log('STATS', `Downloading stats for: ${formatsToFetch.join(', ')}`);

  const results = await Promise.allSettled(
    formatsToFetch.map(async (fmt) => {
      const url = `${STATS_BASE}/${fmt}.json`;
      const destPath = path.join(STATS_DIR, `${fmt}.json`);

      log('STATS', `Downloading ${url}`);
      const res = await fetchWithTimeout(url, 60000);
      const data = await res.text();

      fs.writeFileSync(destPath, data, 'utf-8');
      const stats = fs.statSync(destPath);
      log('STATS', `✅ Saved ${fmt}.json (${formatBytes(stats.size)})`);
      return { name: `${fmt}.json`, size: stats.size };
    })
  );

  const succeeded = [];
  const failed = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      succeeded.push(result.value);
    } else {
      const idx = results.indexOf(result);
      failed.push(formatsToFetch[idx]);
      log('STATS', `❌ Failed: ${formatsToFetch[idx]} — ${result.reason.message}`);
    }
  }

  return { succeeded, failed };
}

// ---------------------------------------------------------------------------
// Download: PokéAPI sprite URLs
// ---------------------------------------------------------------------------

/**
 * Fetch list of all Pokémon species from PokéAPI, then extract front-default
 * sprite URLs. Saves as sprites/index.json containing { name, spriteUrl } entries.
 */
async function downloadSpriteIndex() {
  ensureDir(SPRITES_DIR);

  log('SPRITES', `Fetching species list from PokéAPI (limit=${POKEAPI_SPECIES_LIMIT})…`);

  let speciesList;
  try {
    const res = await fetchWithTimeout(
      `${POKEAPI_BASE}/pokemon-species?limit=${POKEAPI_SPECIES_LIMIT}`,
      30000
    );
    const data = await res.json();
    speciesList = data.results || [];
    log('SPRITES', `Found ${speciesList.length} species`);
  } catch (err) {
    log('SPRITES', `❌ Failed to fetch species list: ${err.message}`);
    return { succeeded: false, failed: ['pokemon-species index'] };
  }

  // Fetch sprite URLs for each species (in batches to be kind to the API)
  const BATCH_SIZE = 25;
  const spriteIndex = [];

  log('SPRITES', `Fetching sprite URLs in batches of ${BATCH_SIZE}…`);

  for (let i = 0; i < speciesList.length; i += BATCH_SIZE) {
    const batch = speciesList.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(async (species) => {
        try {
          // PokéAPI returns species URLs like ".../pokemon-species/{id}/"
          // We need to use the /pokemon/{id} endpoint for sprite data.
          const id = species.url.split('/').filter(Boolean).pop();
          const pokemonUrl = `${POKEAPI_BASE}/pokemon/${id}`;
          const res = await fetchWithTimeout(pokemonUrl, 15000);
          const pokeData = await res.json();
          const spriteUrl = pokeData.sprites?.front_default || null;
          return { name: species.name, spriteUrl, id: pokeData.id };
        } catch (err) {
          return { name: species.name, spriteUrl: null, id: null, error: err.message };
        }
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        spriteIndex.push(result.value);
      }
    }

    if ((i / BATCH_SIZE) % 10 === 0) {
      log('SPRITES', `Progress: ${Math.min(i + BATCH_SIZE, speciesList.length)}/${speciesList.length}`);
    }
  }

  const indexed = spriteIndex.filter(s => s.spriteUrl);
  const missing = spriteIndex.filter(s => !s.spriteUrl);

  const indexPath = path.join(SPRITES_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify({ entries: spriteIndex }, null, 2), 'utf-8');

  const stats = fs.statSync(indexPath);
  log('SPRITES', `✅ Saved sprites/index.json (${formatBytes(stats.size)}) — ${indexed.length} with sprites, ${missing.length} missing`);

  return {
    succeeded: true,
    total: spriteIndex.length,
    withSprites: indexed.length,
    size: stats.size,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const showHelp = args.includes('--help');
  const skipStats = args.includes('--skip-stats');
  const skipSprites = args.includes('--skip-sprites');
  const includeLearnsets = args.includes('--include-learnsets');

  const usage = `
Usage: node scripts/fetch-data.js [options]

Downloads Showdown data, Smogon usage stats, and PokéAPI sprite URLs
into the data/ directory for offline PWA use.

Options:
  --help              Show this help message and exit
  --skip-stats        Skip Smogon usage stats download
  --skip-sprites      Skip PokéAPI sprite URL index download
  --include-learnsets Include learnsets.json (~3MB archive of all learnsets)

Examples:
  node scripts/fetch-data.js
  node scripts/fetch-data.js --skip-sprites
  node scripts/fetch-data.js --include-learnsets
`;

  if (showHelp) {
    console.log(usage.trim());
    process.exit(0);
  }

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Pokémon Data Fetcher — Offline Bundle     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();

  // Create output directories
  ensureDir(DATA_DIR);
  ensureDir(STATS_DIR);

  const allSucceeded = [];
  const allFailed = [];
  let totalSize = 0;

  // 1. Showdown data files
  console.log('── Showdown Data ──────────────────────────────');
  const sdResult = await downloadShowdownData(includeLearnsets);
  allSucceeded.push(...sdResult.succeeded);
  allFailed.push(...sdResult.failed);
  sdResult.succeeded.forEach(f => { totalSize += f.size; });
  console.log();

  // 2. Smogon usage stats
  if (skipStats) {
    console.log('── Smogon Stats (skipped) ─────────────────────');
  } else {
    console.log('── Smogon Stats ───────────────────────────────');
    const statsResult = await downloadUsageStats();
    allSucceeded.push(...statsResult.succeeded);
    allFailed.push(...statsResult.failed);
    statsResult.succeeded.forEach(f => { totalSize += f.size; });
  }
  console.log();

  // 3. PokéAPI sprite index
  if (skipSprites) {
    console.log('── PokéAPI Sprites (skipped) ──────────────────');
  } else {
    console.log('── PokéAPI Sprites ────────────────────────────');
    const spriteResult = await downloadSpriteIndex();
    if (spriteResult.succeeded) {
      allSucceeded.push({ name: 'sprites/index.json', size: spriteResult.size });
      totalSize += spriteResult.size;
    } else {
      allFailed.push('sprites/index.json');
    }
  }
  console.log();

  // Summary
  console.log('════════════════════════════════════════════════');
  console.log('  Summary:');
  console.log(`    Succeeded: ${allSucceeded.length} file(s)`);
  allSucceeded.forEach(f => console.log(`      ✅ ${f.name} (${formatBytes(f.size)})`));
  if (allFailed.length > 0) {
    console.log(`    Failed: ${allFailed.length} file(s)`);
    allFailed.forEach(f => console.log(`      ❌ ${f}`));
  }
  console.log(`    Total bundle size: ${formatBytes(totalSize)}`);
  console.log(`    Output directory: ${DATA_DIR}`);
  console.log('════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});