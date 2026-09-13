import { natures, findNature, natureModifier } from '../data/natures.js'
import { fetchPokemon } from '../api/pokeapi.js'

/**
 * Show the Pokémon detail/edit form. Fetches data from PokéAPI, renders the form, returns saved data.
 * @param {Object} species — selected species object from speciesList
 * @param {Object|null} existing — existing Pokémon data if editing (null for new)
 * @returns {Promise<Object|null>} saved Pokémon object or null if cancelled
 */
export async function showPokemonDetail(species, existing = null) {
  /* ── Overlay ── */
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const panel = document.createElement('div');
  panel.className = 'overlay__panel';
  panel.style.maxWidth = '640px';
  panel.style.maxHeight = '90vh';
  panel.style.overflowY = 'auto';
  overlay.appendChild(panel);

  /* ── Loading state ── */
  const loadingEl = document.createElement('div');
  loadingEl.textContent = 'Loading Pokémon data…';
  loadingEl.className = 'body-lg';
  loadingEl.style.textAlign = 'center';
  loadingEl.style.padding = '2rem';
  panel.appendChild(loadingEl);

  document.body.appendChild(overlay);

  /* ── Fetch ── */
  const pokeData = await fetchPokemon(species.showdownId);

  if (!pokeData) {
    loadingEl.textContent = `Couldn't fetch data for ${species.name} (Champions-exclusive form).`;
    loadingEl.style.color = 'var(--color-text-muted)';
    /* Stay on loading state — user dismisses by clicking outside */
    return new Promise((resolve) => {
      const clickHandler = (e) => {
        if (e.target === overlay) {
          overlay.removeEventListener('click', clickHandler);
          document.body.removeChild(overlay);
          resolve(null);
        }
      };
      overlay.addEventListener('click', clickHandler);
    });
  }

  /* ── Clear loading ── */
  panel.innerHTML = '';
  panel.style.padding = 'var(--space-xl)';

  /* ── Header: name, sprite, shiny toggle ── */
  const headerRow = document.createElement('div');
  headerRow.style.display = 'flex';
  headerRow.style.alignItems = 'center';
  headerRow.style.gap = 'var(--space-lg)';
  headerRow.style.marginBottom = 'var(--space-lg)';
  panel.appendChild(headerRow);

  const spriteImg = document.createElement('img');
  spriteImg.src = pokeData.sprite;
  spriteImg.alt = species.name;
  spriteImg.style.width = '96px';
  spriteImg.style.height = '96px';
  spriteImg.style.objectFit = 'contain';
  spriteImg.style.imageRendering = 'pixelated';
  headerRow.appendChild(spriteImg);

  const nameCol = document.createElement('div');
  nameCol.style.flex = '1';
  headerRow.appendChild(nameCol);

  const nameEl = document.createElement('h2');
  nameEl.textContent = species.name;
  nameEl.className = 'headline-lg';
  nameEl.style.marginBottom = 'var(--space-xs)';
  nameCol.appendChild(nameEl);

  const shinyRow = document.createElement('div');
  shinyRow.style.display = 'flex';
  shinyRow.style.alignItems = 'center';
  shinyRow.style.gap = 'var(--space-sm)';
  nameCol.appendChild(shinyRow);

  const shinyCheckbox = document.createElement('input');
  shinyCheckbox.type = 'checkbox';
  shinyCheckbox.id = 'detail-shiny';
  if (existing && existing.isShiny) {
    shinyCheckbox.checked = true;
  }
  shinyRow.appendChild(shinyCheckbox);

  const shinyLabel = document.createElement('label');
  shinyLabel.htmlFor = 'detail-shiny';
  shinyLabel.className = 'body-sm';
  shinyLabel.textContent = 'Shiny';
  shinyRow.appendChild(shinyLabel);

  /* ── Shiny sprite swap ── */
  shinyCheckbox.addEventListener('change', () => {
    spriteImg.src = shinyCheckbox.checked ? pokeData.spriteShiny : pokeData.sprite;
  });

  /* ── Type badges ── */
  const typesRow = document.createElement('div');
  typesRow.className = 'inspector-panel__types';
  typesRow.style.marginBottom = 'var(--space-lg)';
  panel.appendChild(typesRow);

  species.types.forEach((t) => {
    const badge = document.createElement('span');
    badge.className = `type-badge type-badge--${t.toLowerCase()}`;
    badge.textContent = t;
    typesRow.appendChild(badge);
  });

  /* ── Base stats ── */
  const statsSection = document.createElement('div');
  statsSection.style.marginBottom = 'var(--space-xl)';
  panel.appendChild(statsSection);

  const statsHeading = document.createElement('h3');
  statsHeading.textContent = 'Base Stats';
  statsHeading.className = 'headline-sm';
  statsHeading.style.marginBottom = 'var(--space-sm)';
  statsSection.appendChild(statsHeading);

  const statLabelMap = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Speed',
  };

  pokeData.stats.forEach((stat) => {
    const row = document.createElement('div');
    row.className = 'stat-gauge';
    row.style.marginBottom = 'var(--space-xs)';
    statsSection.appendChild(row);

    const label = document.createElement('span');
    label.className = 'stat-gauge__label';
    label.textContent = statLabelMap[stat.name] || stat.name;
    row.appendChild(label);

    const track = document.createElement('div');
    track.className = 'stat-gauge__track';
    row.appendChild(track);

    const fill = document.createElement('div');
    fill.className = 'stat-gauge__fill';
    const pct = Math.min((stat.value / 255) * 100, 100);
    fill.style.width = `${pct}%`;

    /* Color based on value */
    if (stat.value >= 100) {
      fill.classList.add('stat-gauge__fill--positive');
    } else if (stat.value >= 60) {
      fill.classList.add('stat-gauge__fill--neutral');
    } else {
      fill.classList.add('stat-gauge__fill--negative');
    }

    track.appendChild(fill);

    const value = document.createElement('span');
    value.className = 'stat-gauge__value';
    value.textContent = String(stat.value);
    row.appendChild(value);
  });

  /* ── Edit fields section ── */
  const editSection = document.createElement('div');
  editSection.style.display = 'flex';
  editSection.style.flexDirection = 'column';
  editSection.style.gap = 'var(--space-md)';
  panel.appendChild(editSection);

  /* Helper: create labelled select */
  function createSelectField(labelText, id, options, defaultValue) {
    const fieldRow = document.createElement('div');
    fieldRow.style.display = 'flex';
    fieldRow.style.alignItems = 'center';
    fieldRow.style.gap = 'var(--space-sm)';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.className = 'label-caps';
    label.textContent = labelText;
    label.style.width = '120px';
    label.style.flexShrink = '0';
    fieldRow.appendChild(label);

    const select = document.createElement('select');
    select.id = id;
    select.style.flex = '1';
    select.style.padding = '4px 8px';
    select.style.background = 'var(--color-surface-l2)';
    select.style.color = 'var(--color-text-primary)';
    select.style.border = '1px solid var(--color-hairline)';
    select.style.borderRadius = 'var(--radius-default)';
    select.style.fontFamily = 'var(--font-body)';
    select.style.fontSize = 'var(--body-md)';
    select.style.height = '32px';

    options.forEach((opt) => {
      const optionEl = document.createElement('option');
      optionEl.value = opt.value;
      optionEl.textContent = opt.label;
      if (opt.value === defaultValue) {
        optionEl.selected = true;
      }
      select.appendChild(optionEl);
    });

    fieldRow.appendChild(select);
    return fieldRow;
  }

  /* Helper: create labelled text input */
  function createTextField(labelText, id, placeholder, defaultValue) {
    const fieldRow = document.createElement('div');
    fieldRow.style.display = 'flex';
    fieldRow.style.alignItems = 'center';
    fieldRow.style.gap = 'var(--space-sm)';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.className = 'label-caps';
    label.textContent = labelText;
    label.style.width = '120px';
    label.style.flexShrink = '0';
    fieldRow.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.placeholder = placeholder;
    input.value = defaultValue || '';
    input.style.flex = '1';
    input.style.padding = '4px 8px';
    input.style.background = 'var(--color-surface-l2)';
    input.style.color = 'var(--color-text-primary)';
    input.style.border = '1px solid var(--color-hairline)';
    input.style.borderRadius = 'var(--radius-default)';
    input.style.fontFamily = 'var(--font-body)';
    input.style.fontSize = 'var(--body-md)';
    input.style.height = '32px';

    fieldRow.appendChild(input);
    return fieldRow;
  }

  /* Ability */
  const abilityOptions = pokeData.abilities.map((a) => ({
    value: a,
    label: a.charAt(0).toUpperCase() + a.slice(1).replace(/-/g, ' '),
  }));
  const defaultAbility = existing ? existing.ability : pokeData.abilities[0];
  editSection.appendChild(
    createSelectField('Ability', 'detail-ability', abilityOptions, defaultAbility)
  );

  /* Nature */
  const natureOptions = natures.map((n) => ({
    value: n.name,
    label: n.name + (n.increased ? ` (+${n.increased}, -${n.decreased})` : ' (neutral)'),
  }));
  const defaultNature = existing ? existing.nature : 'Serious';
  editSection.appendChild(
    createSelectField('Nature', 'detail-nature', natureOptions, defaultNature)
  );

  /* Moves — 4 slots */
  const movesHeader = document.createElement('h3');
  movesHeader.textContent = 'Moves';
  movesHeader.className = 'headline-sm';
  movesHeader.style.marginTop = 'var(--space-sm)';
  editSection.appendChild(movesHeader);

  for (let i = 0; i < 4; i++) {
    const existingMove = existing && existing.moves ? existing.moves[i] : '';
    editSection.appendChild(
      createTextField('', `detail-move-${i}`, `Move ${i + 1}`, existingMove)
    );
  }

  /* Held Item */
  const defaultItem = existing ? existing.heldItem : '';
  editSection.appendChild(
    createTextField('Held Item', 'detail-held-item', 'e.g. Choice Scarf', defaultItem)
  );

  /* Trial / Permanent */
  const trialField = document.createElement('div');
  trialField.style.display = 'flex';
  trialField.style.alignItems = 'center';
  trialField.style.gap = 'var(--space-sm)';

  const trialLabel = document.createElement('span');
  trialLabel.className = 'label-caps';
  trialLabel.textContent = 'Trial';
  trialLabel.style.width = '120px';
  trialLabel.style.flexShrink = '0';
  trialField.appendChild(trialLabel);

  const trialCheckbox = document.createElement('input');
  trialCheckbox.type = 'checkbox';
  trialCheckbox.id = 'detail-trial';
  if (existing && existing.isTrial) {
    trialCheckbox.checked = true;
  }
  trialField.appendChild(trialCheckbox);

  const trialText = document.createElement('label');
  trialText.htmlFor = 'detail-trial';
  trialText.className = 'body-sm';
  trialText.textContent = 'Trial Pokémon (not permanent)';
  trialField.appendChild(trialText);

  editSection.appendChild(trialField);

  /* Source */
  const sourceOptions = [
    { value: 'Ranch', label: 'Recruited from Ranch' },
    { value: 'HOME', label: 'Transferred from HOME' },
    { value: 'Event', label: 'Event' },
  ];
  const defaultSource = existing ? existing.source : 'Ranch';
  editSection.appendChild(
    createSelectField('Source', 'detail-source', sourceOptions, defaultSource)
  );

  /* ── Action buttons ── */
  const actionsRow = document.createElement('div');
  actionsRow.style.display = 'flex';
  actionsRow.style.justifyContent = 'flex-end';
  actionsRow.style.gap = 'var(--space-sm)';
  actionsRow.style.marginTop = 'var(--space-xl)';
  actionsRow.style.paddingTop = 'var(--space-md)';
  actionsRow.style.borderTop = '1px solid var(--color-hairline)';
  panel.appendChild(actionsRow);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  actionsRow.appendChild(cancelBtn);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Save';
  actionsRow.appendChild(saveBtn);

  /* ── Promise resolution ── */
  return new Promise((resolve) => {
    const cleanup = () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    saveBtn.addEventListener('click', () => {
      const isShiny = document.getElementById('detail-shiny').checked;
      const moves = [];
      for (let i = 0; i < 4; i++) {
        const input = document.getElementById(`detail-move-${i}`);
        moves.push(input ? input.value : '');
      }

      const saved = {
        species,
        showdownId: species.showdownId,
        nickname: '',
        sprite: isShiny ? pokeData.spriteShiny : pokeData.sprite,
        spriteShiny: pokeData.spriteShiny,
        isShiny,
        stats: pokeData.stats,
        ability: document.getElementById('detail-ability').value,
        nature: document.getElementById('detail-nature').value,
        moves,
        heldItem: document.getElementById('detail-held-item').value,
        isTrial: document.getElementById('detail-trial').checked,
        source: document.getElementById('detail-source').value,
        recruitedDate: new Date().toISOString().split('T')[0],
      };
      cleanup();
      resolve(saved);
    });

    /* Click outside panel to cancel */
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(null);
      }
    });
  });
}