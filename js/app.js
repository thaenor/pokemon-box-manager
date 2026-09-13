/**
 * Pokémon Box Manager — Main Entry Point (ES Module)
 *
 * Orchestrates the SPA flow:
 *   Box Grid → Species Search → Pokémon Detail → Save → Box Grid
 */

import { speciesList } from './data/species-list.js'
import { fetchPokemon } from './api/pokeapi.js'
import { renderBoxGrid } from './ui/box-grid.js'
import { showSpeciesSearch } from './ui/species-search.js'
import { showPokemonDetail } from './ui/pokemon-detail.js'

/* ── State ── */

/** Known fields for a saved Pokémon object. Unknown fields are silently dropped. */
const KNOWN_FIELDS = new Set([
  'species', 'showdownId', 'nickname', 'sprite', 'spriteShiny', 'isShiny',
  'stats', 'ability', 'nature', 'recruitedDate',
])

function sanitizePokemon(obj) {
  if (!obj || typeof obj !== 'object') return null
  const clean = {}
  for (const key of KNOWN_FIELDS) {
    if (key in obj) clean[key] = obj[key]
  }
  // Ensure required fields exist — fallback to defaults
  if (!clean.species) return null
  clean.nickname = clean.nickname || ''
  clean.isShiny = !!clean.isShiny
  clean.ability = clean.ability || ''
  clean.nature = clean.nature || 'Serious'
  clean.stats = clean.stats || []
  clean.recruitedDate = clean.recruitedDate || new Date().toISOString().split('T')[0]
  return clean
}

/**
 * localStorage key for box persistence.
 * Stores the serialized box array so it survives page reloads.
 */
const STORAGE_KEY = 'pokemon-box:slots'

/**
 * Save the current box array to localStorage.
 * Called after every mutation (add, delete, reorder).
 */
function saveBox() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.box))
  } catch (e) {
    console.warn('Failed to save box to localStorage:', e)
  }
}

/**
 * Load the box array from localStorage.
 * Returns a clean 30-slot empty array on first visit or corrupt data.
 */
function loadBox() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(Boolean).map(sanitizePokemon).filter(Boolean)
  } catch (e) {
    console.warn('Failed to load box from localStorage, starting fresh:', e)
    return []
  }
}

const state = {
  box: [],
  boxSize: 30,
  appEl: null,
}

/* ── Views ── */

function showBoxView() {
  state.appEl.textContent = ''
  const grid = renderBoxGrid(
    state.box,
    (index) => handleAddPokemon(index),
    (pokemon, index) => handleSelectPokemon(pokemon, index),
    state.boxSize,
  )
  state.appEl.appendChild(grid)
}

/* ── Handlers ── */

async function handleAddPokemon(slotIndex) {
  // Step 1: Species search
  const species = await showSpeciesSearch()
  if (!species) return

  // Step 2: Fetch + detail/edit form
  const saved = await showPokemonDetail(species)
  if (!saved) return

  // Step 3: Save to box, persist, re-render
  state.box.push(sanitizePokemon(saved))
  saveBox()
  showBoxView()
}

function handleSelectPokemon(pokemon, index) {
  console.log('Selected:', pokemon.name, 'at slot', index)
  // Future: open detail form in edit mode, or highlight in inspector
}

/* ── Init ── */

document.addEventListener('DOMContentLoaded', () => {
  state.appEl = document.getElementById('app')
  // Load persisted box BEFORE first render
  const restored = loadBox()
  if (restored.length > 0) state.box = restored
  showBoxView()
})