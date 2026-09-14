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
import { showToast } from "./ui/toast.js";

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
  grid.classList.add("view-fade-in");
  state.appEl.appendChild(grid);
}

/**
 * Show/hide a spinner on a button during async operations.
 * @param {HTMLElement} btn — the button element
 * @param {boolean} loading — true to show spinner, false to restore label
 * @param {string} [originalText] — text to restore when loading=false
 */
function setButtonLoading(btn, loading, originalText) {
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "";
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
    spinner.dataset.spinner = "";
    btn.appendChild(spinner);
    btn.disabled = true;
  } else {
    const spinner = btn.querySelector("[data-spinner]");
    if (spinner) spinner.remove();
    btn.textContent = originalText || btn.dataset.originalText || "";
    btn.disabled = false;
    delete btn.dataset.originalText;
  }
}

/* ── Handlers ── */

async function handleAddPokemon(slotIndex) {
  // Step 1: Species search
  const species = await showSpeciesSearch();
  if (!species) return;

  // Step 2: Fetch + detail/edit form
  const result = await showPokemonDetail(species);
  if (!result || result.action !== "save") return;

  // Step 3: Save to specific slot, persist, re-render
  state.box[slotIndex] = sanitizePokemon(result.pokemon);
  saveBox();
  showToast(`${result.pokemon.species.name} added to box!`, "success");
  showBoxView();
}

async function handleSelectPokemon(pokemon, index) {
  // Open the detail form in edit mode with existing data
  const result = await showPokemonDetail(pokemon.species, pokemon);
  if (!result) return; // cancelled (clicked outside)

  if (result.action === "save") {
    state.box[index] = sanitizePokemon(result.pokemon);
    showToast(`${result.pokemon.species.name} updated`, "success");
  } else if (result.action === "remove") {
    state.box[index] = null;
    showToast(`${pokemon.species.name} removed from box`, "info");
  } else {
    console.warn("handleSelectPokemon: unknown action", result);
  }

  saveBox();
  showBoxView();
}

/* ── Init ── */

document.addEventListener("DOMContentLoaded", () => {
  state.appEl = document.getElementById("app");
  // Load persisted box BEFORE first render
  const restored = loadBox();
  if (restored.length > 0) state.box = restored;
  showBoxView();
});
