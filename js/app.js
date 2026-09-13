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

  // Step 3: Save to box, re-render
  // TODO: Persistence hook — this is where the box saves to localStorage
  // See #20: after detail form cleanup, write pokemon-box:slots here on every mutation
  state.box.push(sanitizePokemon(saved))
  showBoxView()
}

function handleSelectPokemon(pokemon, index) {
  console.log('Selected:', pokemon.name, 'at slot', index)
  // Future: open detail form in edit mode, or highlight in inspector
}

/* ── Init ── */

document.addEventListener('DOMContentLoaded', () => {
  state.appEl = document.getElementById('app')
  showBoxView()
})