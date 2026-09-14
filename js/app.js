/**
 * Pokémon Box Manager — Main Entry Point (ES Module)
 *
 * Orchestrates the SPA flow:
 *   Login → Box Grid → Species Search → Pokémon Detail → Save → Box Grid
 */

import { speciesList } from "./data/species-list.js";
import { fetchPokemon } from "./api/pokeapi.js";
import { renderBoxGrid } from "./ui/box-grid.js";
import { showSpeciesSearch } from "./ui/species-search.js";
import { showPokemonDetail } from "./ui/pokemon-detail.js";
import { showToast } from "./ui/toast.js";

/* ── Auth ── */

/** Google sign-in via Firebase Auth popup. */
export function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return firebase.auth().signInWithPopup(provider);
}

/** Sign out. No data cleanup on logout. */
export function signOut() {
  return firebase.auth().signOut();
}

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

/* ── Login View ── */

/**
 * Render the Google sign-in login view into #app.
 * Centered card, full viewport height, branded Google sign-in button.
 */
function showLoginView() {
  state.appEl.textContent = "";

  const wrapper = document.createElement("div");
  wrapper.className = "login-view";

  const card = document.createElement("div");
  card.className = "login-view__card";

  // ── Title ──
  const title = document.createElement("h1");
  title.className = "headline-lg";
  title.textContent = "Pokémon Box Manager";
  title.style.marginBottom = "var(--space-sm)";
  card.appendChild(title);

  // ── Subtitle ──
  const subtitle = document.createElement("p");
  subtitle.className = "body-lg";
  subtitle.textContent = "Sign in to manage your battle box";
  subtitle.style.color = "var(--color-text-muted)";
  subtitle.style.marginBottom = "var(--space-2xl)";
  card.appendChild(subtitle);

  // ── Sign-in button ──
  const btn = document.createElement("button");
  btn.className = "btn btn-google";
  btn.type = "button";

  // Google SVG logo (official brand)
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.innerHTML =
    '<path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-5.3 7.8v6.5h8.6c5-4.6 7.9-11.4 7.9-19.3 0-1.3-.1-2.6-.4-3.9Z"/><path fill="#FF3D00" d="m6.5 14.3 5 3.7A12 12 0 0 1 33.3 20H42a20 20 0 0 0-33.6-9.5l-1.8.1Z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-1.8 13.6-4.8l-8.6-6.5a12 12 0 0 1-18-6.3l-5 3.9A20 20 0 0 0 24 44Z"/><path fill="#1976D2" d="m6.5 14.3-1.9 9.4A20 20 0 0 0 24 44l-5-3.9-6.5-4.8-6-8.4Z"/>';
  svg.setAttribute("aria-hidden", "true");
  svg.style.marginRight = "var(--space-sm)";

  const label = document.createTextNode("Sign in with Google");

  btn.appendChild(svg);
  btn.appendChild(label);

  // ── Error container ──
  const errorEl = document.createElement("p");
  errorEl.className = "login-view__error";
  errorEl.style.display = "none";

  let signingIn = false;

  btn.addEventListener("click", async () => {
    if (signingIn) return;
    signingIn = true;
    errorEl.style.display = "none";
    label.textContent = "Signing in\u2026";
    btn.disabled = true;

    try {
      await signInWithGoogle();
      // onAuthStateChanged handles the transition
    } catch (err) {
      console.warn("signInWithGoogle failed:", err);
      label.textContent = "Sign in with Google";
      btn.disabled = false;
      signingIn = false;

      let msg = "Sign-in failed. Please try again.";
      if (err.code === "auth/popup-blocked") {
        msg = "Popup was blocked. Please allow popups for this site.";
      } else if (err.code === "auth/popup-closed-by-user") {
        msg = "Sign-in cancelled.";
      } else if (err.code === "auth/network-request-failed") {
        msg = "Network error. Check your connection.";
      }
      errorEl.textContent = msg;
      errorEl.style.display = "";
    }
  });

  card.appendChild(btn);
  card.appendChild(errorEl);
  wrapper.appendChild(card);
  wrapper.classList.add("view-fade-in");
  state.appEl.appendChild(wrapper);
}

/* ── Views ── */

function handleLogout() {
  signOut();
  showLoginView();
}

function showBoxView() {
  state.appEl.textContent = "";
  const grid = renderBoxGrid(
    state.box,
    (index) => handleAddPokemon(index),
    (pokemon, index) => handleSelectPokemon(pokemon, index),
    state.boxSize,
    handleLogout,
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
/** Reserved for auth login flow (see #36). */
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

/* ── Init ── */

document.addEventListener("DOMContentLoaded", () => {
  state.appEl = document.getElementById("app");

  // Load persisted box BEFORE first render (no auth dependency)
  const restored = loadBox();
  if (restored.length > 0) state.box = restored;

  // Gate view on auth state
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      showBoxView();
    } else {
      showLoginView();
    }
  });
});
