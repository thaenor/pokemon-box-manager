import { speciesList, findSpecies } from '../data/species-list.js';

/**
 * Creates the box grid view — main view after login.
 * @param {Array} box — array of Pokémon objects in the box (initially empty)
 * @param {Function} onAddPokemon — callback when user clicks "+ Add Pokémon"
 * @param {Function} onSelectPokemon — callback when user clicks a filled slot
 * @param {number} boxSize — max slots (default 30)
 * @returns {HTMLElement} the rendered view
 */
export function renderBoxGrid(box, onAddPokemon, onSelectPokemon, boxSize = 30) {
  const filled = box.filter(Boolean).length;

  // ── Two-pane wrapper ──
  const container = document.createElement('div');
  container.className = 'two-pane';

  // ── Left pane ──
  const leftPane = document.createElement('div');
  leftPane.className = 'two-pane__left';

  // ── Box nav header ──
  const nav = document.createElement('div');
  nav.className = 'box-nav-header';

  const navInner = document.createElement('div');
  navInner.className = 'box-nav-header__nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'box-nav-header__arrow';
  prevBtn.textContent = '\u2039';
  prevBtn.setAttribute('aria-label', 'Previous box');

  const nextBtn = document.createElement('button');
  nextBtn.className = 'box-nav-header__arrow';
  nextBtn.textContent = '\u203A';
  nextBtn.setAttribute('aria-label', 'Next box');

  const indexSpan = document.createElement('span');
  indexSpan.className = 'box-nav-header__index';
  indexSpan.textContent = 'BOX 01 / 32';

  const capacitySpan = document.createElement('span');
  capacitySpan.className = 'box-nav-header__capacity';
  capacitySpan.textContent = filled + '/' + boxSize;

  navInner.appendChild(prevBtn);
  navInner.appendChild(indexSpan);
  navInner.appendChild(nextBtn);
  nav.appendChild(navInner);
  nav.appendChild(capacitySpan);

  // ── Toolbar (right side of nav) ──
  const toolbar = document.createElement('div');
  toolbar.className = 'box-nav-header__toolbar';

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'box-nav-header__toggle';
  toggleBtn.textContent = 'Select';
  toolbar.appendChild(toggleBtn);
  nav.appendChild(toolbar);

  leftPane.appendChild(nav);

  // ── Empty state ──
  if (filled === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'box-empty-state';

    const icon = document.createElement('div');
    icon.textContent = '📦';
    icon.className = 'box-empty-state__icon';
    emptyState.appendChild(icon);

    const title = document.createElement('p');
    title.className = 'headline-sm box-empty-state__title';
    title.textContent = 'Your box is empty';
    emptyState.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'body-md box-empty-state__subtitle';
    subtitle.textContent = 'Tap + Add Pokémon to start building your box';
    emptyState.appendChild(subtitle);

    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary';
    addBtn.textContent = '+ Add Pokémon';
    addBtn.addEventListener('click', function () {
      if (typeof onAddPokemon === 'function') {
        onAddPokemon();
      }
    });
    emptyState.appendChild(addBtn);

    leftPane.appendChild(emptyState);
    container.appendChild(leftPane);

    // ── Right pane: inspector panel ──
    const rightPane = document.createElement('div');
    rightPane.className = 'two-pane__right';
    const inspector = document.createElement('aside');
    inspector.className = 'inspector-panel';
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'body-sm';
    emptyMsg.style.cssText = 'color: var(--color-text-muted); text-align: center; padding: var(--space-xl) 0;';
    emptyMsg.textContent = 'Select a Pokémon to inspect';
    inspector.appendChild(emptyMsg);
    rightPane.appendChild(inspector);
    container.appendChild(rightPane);

    return container;
  }

  // ── Matrix grid ──
  const grid = document.createElement('div');
  grid.className = 'matrix-grid';

  for (let i = 0; i < boxSize; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot-cell';
    slot.dataset.index = String(i);

    const pokemon = box[i];
    if (pokemon && pokemon.species) {
      // ── Sprite ──
      const img = document.createElement('img');
      img.className = 'slot-cell__sprite';
      img.alt = `${pokemon.species.name} sprite`;
      img.src = 'https://play.pokemonshowdown.com/sprites/gen5/' + pokemon.species.showdownId + '.png';
      img.loading = 'lazy';
      slot.appendChild(img);

      // ── Shiny indicator ──
      // ── Name label below sprite ──
      const nameEl = document.createElement('span');
      nameEl.className = 'label-micro';
      nameEl.style.cssText = 'position: absolute; bottom: 20px; left: 0; right: 0; text-align: center; color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 2px;';
      nameEl.textContent = pokemon.species.name;
      slot.appendChild(nameEl);

      // ── Type badges ──
      const types = pokemon.species.types || [];
      if (types.length > 0) {
        const typeRow = document.createElement('div');
        typeRow.style.cssText = 'position: absolute; bottom: 3px; left: 0; right: 0; display: flex; gap: 2px; justify-content: center;';
        for (const t of types) {
          const badge = document.createElement('span');
          badge.className = 'type-badge type-badge--' + t.toLowerCase();
          badge.textContent = t;
          typeRow.appendChild(badge);
        }
        slot.appendChild(typeRow);
      }

      if (pokemon.isShiny) {
        const shinyDot = document.createElement('span');
        shinyDot.className = 'slot-cell__shiny-indicator';
        slot.appendChild(shinyDot);
      }

      // ── Held item pill ──
      if (pokemon.heldItem) {
        const itemPill = document.createElement('span');
        itemPill.className = 'slot-cell__item-pill';
        slot.appendChild(itemPill);
      }

      // ── Click handler ──
      slot.addEventListener('click', function () {
        if (typeof onSelectPokemon === 'function') {
          onSelectPokemon(pokemon, i);
        }
      });
    } else {
      // ── Empty slot: click triggers add ──
      slot.addEventListener('click', function () {
        if (typeof onAddPokemon === 'function') {
          onAddPokemon(i);
        }
      });
    }

    grid.appendChild(slot);
  }

  leftPane.appendChild(grid);

  // ── Add Pokémon button ──
  const addWrapper = document.createElement('div');
  addWrapper.style.cssText = 'display: flex; justify-content: center; margin-top: var(--space-lg);';

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-primary';
  addBtn.textContent = '+ Add Pok\u00E9mon';
  addBtn.addEventListener('click', function () {
    if (typeof onAddPokemon === 'function') {
      onAddPokemon();
    }
  });

  addWrapper.appendChild(addBtn);
  leftPane.appendChild(addWrapper);

  container.appendChild(leftPane);

  // ── Right pane: inspector panel ──
  const rightPane = document.createElement('div');
  rightPane.className = 'two-pane__right';

  const inspector = document.createElement('aside');
  inspector.className = 'inspector-panel';

  const emptyMsg = document.createElement('p');
  emptyMsg.className = 'body-sm';
  emptyMsg.style.cssText = 'color: var(--color-text-muted); text-align: center; padding: var(--space-xl) 0;';
  emptyMsg.textContent = 'Select a Pok\u00E9mon to inspect';

  inspector.appendChild(emptyMsg);
  rightPane.appendChild(inspector);
  container.appendChild(rightPane);

  return container;
}