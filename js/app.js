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
  state.box.push(saved)
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