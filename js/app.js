/**
 * Pokémon Box Manager — Main Entry Point (ES Module)
 *
 * Orchestrates the SPA flow:
 *   Box Grid → Species Search → Pokémon Detail → Save → Box Grid
 */

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
  "heldItem",
  "teraType",
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
  clean.heldItem = clean.heldItem || "";
  clean.teraType = clean.teraType || "";
  return clean;
}

/**
 * localStorage key for box persistence.
 * Stores the serialized box array so it survives page reloads.
 */
export const STORAGE_KEY = "pokemon-box:slots";

/** localStorage key for the user's preferred grid size. */
const SIZE_KEY = "pokemonBoxSize";

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
 * Returns a clean empty array sized by state.boxSize on first visit or corrupt data.
 */
export function loadBox() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Array(state.boxSize).fill(null);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Array(state.boxSize).fill(null);
    // Pad or trim to exactly boxSize and sanitize entries
    const clean = parsed.slice(0, state.boxSize).map((p) => (p ? sanitizePokemon(p) : null));
    while (clean.length < state.boxSize) clean.push(null);
    return clean;
  } catch (e) {
    console.warn("Failed to load box from localStorage, starting fresh:", e);
    return new Array(state.boxSize).fill(null);
  }
}

const state = {
  box: [],
  boxSize: 40,
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
    handleBoxSizeChange,
    handleImport,
  );
  grid.classList.add("view-fade-in");
  state.appEl.appendChild(grid);
}

/* ── Handlers ── */

/**
 * Handle grid size changes from the dropdown.
 * Increases → pad with nulls. Decreases → prompt, truncate or revert.
 */
function handleBoxSizeChange(newSize) {
  const currentSize = state.boxSize;
  if (newSize === currentSize) return;

  if (newSize < currentSize) {
    const fillCount = currentSize - newSize;
    const msg = `Reduce grid to ${newSize} slots? The last ${fillCount} Pokémon will be removed. Continue?`;
    if (!confirm(msg)) {
      // Revert the dropdown — the next re-render will pick up the unchanged boxSize
      showBoxView();
      return;
    }
  }

  state.boxSize = newSize;
  localStorage.setItem(SIZE_KEY, String(newSize));

  // Pad or truncate
  if (newSize > currentSize) {
    while (state.box.length < newSize) state.box.push(null);
  } else if (newSize < currentSize) {
    state.box = state.box.slice(0, newSize);
  }

  saveBox();
  showBoxView();
}

async function handleAddPokemon(slotIndex) {
  try {
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
  } catch (e) {
    console.error("handleAddPokemon:", e);
    showToast("Failed to add Pokémon", "error");
  }
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
    showToast("Something went wrong", "error");
  }

  saveBox();
  showBoxView();
}

/**
 * Handle importing Pokémon from JSON data.
 * Sanitizes each entry, truncates to box size, overwrites the box, and re-renders.
 * @param {Array<Object>} pokemonArray — array of Pokémon objects with resolved species
 */
export function handleImport(pokemonArray) {
  const sanitized = pokemonArray
    .map((p) => sanitizePokemon(p))
    .filter(Boolean)
    .slice(0, state.boxSize);

  // Pad with nulls if fewer than boxSize
  while (sanitized.length < state.boxSize) sanitized.push(null);

  state.box = sanitized;
  saveBox();
  showToast(`Imported ${sanitized.filter(Boolean).length} Pokémon`, "success");
  if (state.appEl) showBoxView();
}

/* ── Init ── */

document.addEventListener("DOMContentLoaded", () => {
  state.appEl = document.getElementById("app");

  // Read persisted grid size preference, fall back to 40
  const savedSize = parseInt(localStorage.getItem(SIZE_KEY), 10);
  if (savedSize === 30 || savedSize === 35 || savedSize === 40) {
    state.boxSize = savedSize;
  }

  state.box = loadBox();
  showBoxView();
});
