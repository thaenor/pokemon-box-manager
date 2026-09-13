/**
 * Pokémon Box Manager — Main Entry Point (ES Module)
 *
 * Orchestrates the SPA flow:
 *   Box Grid → Species Search → Pokémon Detail → Save → Box Grid
 */

import { speciesList } from "./data/species-list.js";
import { fetchPokemon } from "./api/pokeapi.js";
import { renderBoxGrid } from "./ui/box-grid.js";
import { showSpeciesSearch } from "./ui/species-search.js";
import { showPokemonDetail } from "./ui/pokemon-detail.js";

/* ── State ── */

/** Known fields for a saved Pokémon object. Unknown fields are silently dropped. */
export const KNOWN_FIELDS = new Set([
  "species",
  "showdownId",
  "nickname",
  "sprite",
  "spriteShiny",
  "isShiny",
  "stats",
  "ability",
  "nature",
  "recruitedDate",
]);

export function sanitizePokemon(obj) {
  if (!obj || typeof obj !== "object") return null;
  const clean = {};
  for (const key of KNOWN_FIELDS) {
    if (key in obj) clean[key] = obj[key];
  }
  // Ensure required fields exist — fallback to defaults
  if (!clean.species) return null;
  clean.nickname = clean.nickname || "";
  clean.isShiny = !!clean.isShiny;
  clean.ability = clean.ability || "";
  clean.nature = clean.nature || "Serious";
  clean.stats = clean.stats || [];
  clean.recruitedDate = clean.recruitedDate || new Date().toISOString().split("T")[0];
  return clean;
}

/**
 * localStorage key for box persistence.
 * Stores the serialized box array so it survives page reloads.
 */
export const STORAGE_KEY = "pokemon-box:slots";

/**
 * Save the current box array to localStorage.
 * Called after every mutation (add, delete, reorder).
 */
export function saveBox() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.box));
  } catch (e) {
    console.warn("Failed to save box to localStorage:", e);
  }
}

/**
 * Load the box array from localStorage.
 * Returns a clean 30-slot empty array on first visit or corrupt data.
 */
export function loadBox() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Array(30).fill(null);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Array(30).fill(null);
    // Pad or trim to exactly boxSize and sanitize entries
    const clean = parsed.slice(0, 30).map((p) => (p ? sanitizePokemon(p) : null));
    while (clean.length < 30) clean.push(null);
    return clean;
  } catch (e) {
    console.warn("Failed to load box from localStorage, starting fresh:", e);
    return new Array(30).fill(null);
  }
}

const state = {
  box: [],
  boxSize: 30,
  appEl: null,
};

/* ── Views ── */

function showBoxView() {
  state.appEl.textContent = "";
  const grid = renderBoxGrid(
    state.box,
    (index) => handleAddPokemon(index),
    (pokemon, index) => handleSelectPokemon(pokemon, index),
    state.boxSize,
  );
  state.appEl.appendChild(grid);
}

/* ── Handlers ── */

async function handleAddPokemon(slotIndex) {
  // Step 1: Species search
  const species = await showSpeciesSearch();
  if (!species) return;

  // Step 2: Fetch + detail/edit form
  const saved = await showPokemonDetail(species);
  if (!saved) return;

  // Step 3: Save to specific slot, persist, re-render
  state.box[slotIndex] = sanitizePokemon(saved);
  saveBox();
  showBoxView();
}

function handleSelectPokemon(pokemon, index) {
  // Future: open detail form in edit mode, or highlight in inspector
}

/* ── Init ── */

document.addEventListener("DOMContentLoaded", () => {
  state.appEl = document.getElementById("app");
  // Load persisted box BEFORE first render
  const restored = loadBox();
  if (restored.length > 0) state.box = restored;
  showBoxView();
});

/* ── reCAPTCHA Test Button (temporary debug) ── */

(function addRecaptchaTest() {
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;bottom:12px;right:12px;z-index:9999;display:flex;flex-direction:column;gap:4px;align-items:end;";

  const resultEl = document.createElement("div");
  resultEl.style.cssText =
    "display:none;background:var(--color-surface-l2,#1a1a2e);border:1px solid var(--color-hairline,#333);border-radius:8px;padding:8px 12px;font-size:13px;max-width:280px;word-break:break-all;color:var(--color-text-primary,#eee);font-family:monospace;";

  const btn = document.createElement("button");
  btn.textContent = "Verify reCAPTCHA";
  btn.style.cssText =
    "background:var(--color-accent,#6c63ff);color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:13px;cursor:pointer;";

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Verifying…";
    resultEl.style.display = "block";
    resultEl.textContent = "Loading reCAPTCHA…";

    try {
      // Load reCAPTCHA Enterprise script if not already loaded
      if (typeof grecaptcha === "undefined" || !grecaptcha.enterprise) {
        // Remove any existing reCAPTCHA script to avoid conflicts
        document.querySelectorAll('script[src*="recaptcha/enterprise"]').forEach((s) => s.remove());
        delete window.grecaptcha;

        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src =
            "https://www.google.com/recaptcha/enterprise.js?render=6LdosrktAAAAANmSkeEtmHEBP_J4u4Eb6nVnBaM0";
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
        // Wait for grecaptcha.enterprise to be ready
        await new Promise((resolve) => {
          const check = () => {
            if (
              typeof grecaptcha !== "undefined" &&
              grecaptcha.enterprise &&
              typeof grecaptcha.enterprise.execute === "function"
            ) {
              resolve();
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      }

      resultEl.textContent = "Executing reCAPTCHA…";

      const token = await grecaptcha.enterprise.execute(
        "6LdosrktAAAAANmSkeEtmHEBP_J4u4Eb6nVnBaM0",
        { action: "verify" },
      );

      resultEl.textContent = `✅ Token generated: ${token.slice(0, 16)}…`;
    } catch (e) {
      resultEl.textContent = `❌ ${e.message || e}`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Verify reCAPTCHA";
    }
  });

  container.appendChild(resultEl);
  container.appendChild(btn);

  // ── Force Refresh button ──
  const refreshBtn = document.createElement("button");
  refreshBtn.textContent = "Force Refresh";
  refreshBtn.style.cssText =
    "background:var(--color-accent,#6c63ff);color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:13px;cursor:pointer;";

  refreshBtn.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Clearing cache…";
    // Unregister all service workers
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    // Clear all caches
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    refreshBtn.textContent = "Reloading…";
    window.location.reload();
  });

  container.appendChild(refreshBtn);
  // Append after DOM ready
  const inject = () => document.body.appendChild(container);
  if (document.body) inject();
  else document.addEventListener("DOMContentLoaded", inject);
})();
