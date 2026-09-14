import { natures } from "../data/natures.js";
import { fetchPokemon } from "../api/pokeapi.js";

/**
 * Show the Pokémon detail/edit form. Fetches data from PokéAPI, renders the form.
 *
 * CREATE mode (existing = null): Returns {action:'save', pokemon} on save, null on cancel.
 * EDIT mode (existing provided): Returns {action:'save', pokemon} on save,
 *   {action:'remove'} on remove, null on cancel.
 *
 * @param {Object} species — selected species object from speciesList
 * @param {Object|null} existing — existing Pokémon data if editing (null for new)
 * @returns {Promise<{action:string, pokemon?:Object}|null>}
 */
export async function showPokemonDetail(species, existing = null) {
  const isEdit = existing !== null;

  /* ── Overlay ── */
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const panel = document.createElement("div");
  panel.className = "overlay__panel";
  panel.style.maxWidth = "640px";
  panel.style.maxHeight = "90vh";
  panel.style.overflowY = "auto";
  overlay.appendChild(panel);

  /* ── Loading state ── */
  const loadingEl = document.createElement("div");
  loadingEl.style.textAlign = "center";
  loadingEl.style.padding = "2rem";
  panel.appendChild(loadingEl);

  const spinner = document.createElement("div");
  spinner.style.cssText =
    "width:32px;height:32px;border:3px solid var(--color-hairline);border-top-color:var(--color-primary);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto var(--space-md) auto;";
  loadingEl.appendChild(spinner);

  const loadingText = document.createElement("div");
  loadingText.textContent = "Loading Pokémon data…";
  loadingText.className = "body-lg";
  loadingText.style.color = "var(--color-text-secondary)";
  loadingEl.appendChild(loadingText);

  document.body.appendChild(overlay);

  /* ── Fetch ── */
  const pokeData = await fetchPokemon(species.pokeApiName || species.showdownId);

  if (!pokeData) {
    loadingEl.textContent = `Couldn't fetch data for ${species.name} (Champions-exclusive form).`;
    loadingEl.style.color = "var(--color-text-muted)";

    const noteEl = document.createElement("p");
    noteEl.className = "body-sm";
    noteEl.style.textAlign = "center";
    noteEl.style.marginTop = "var(--space-sm)";
    noteEl.style.color = "var(--color-text-muted)";
    noteEl.textContent = "Champions-exclusive forms are not available via PokéAPI.";
    panel.appendChild(noteEl);

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-secondary";
    closeBtn.style.margin = "var(--space-lg) auto 0";
    closeBtn.style.display = "block";
    closeBtn.textContent = "Close";
    panel.appendChild(closeBtn);

    return new Promise((resolve) => {
      const handleDismiss = () => {
        document.body.removeChild(overlay);
        resolve(null);
      };
      closeBtn.addEventListener("click", handleDismiss);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) handleDismiss();
      });
    });
  }

  /* ── Clear loading ── */
  panel.innerHTML = "";
  panel.style.padding = "var(--space-xl)";

  /* ── Header: name, sprite, shiny toggle ── */
  const headerRow = document.createElement("div");
  headerRow.style.display = "flex";
  headerRow.style.alignItems = "center";
  headerRow.style.gap = "var(--space-lg)";
  headerRow.style.marginBottom = "var(--space-lg)";
  panel.appendChild(headerRow);

  const spriteImg = document.createElement("img");
  spriteImg.src = pokeData.sprite;
  spriteImg.alt = species.name;
  spriteImg.style.width = "96px";
  spriteImg.style.height = "96px";
  spriteImg.style.objectFit = "contain";
  spriteImg.style.imageRendering = "pixelated";
  headerRow.appendChild(spriteImg);

  const nameCol = document.createElement("div");
  nameCol.style.flex = "1";
  headerRow.appendChild(nameCol);

  const nameEl = document.createElement("h2");
  nameEl.textContent = species.name;
  nameEl.className = "headline-lg";
  nameEl.style.marginBottom = "var(--space-xs)";
  nameCol.appendChild(nameEl);

  /* ── Edit-mode badge ── */
  if (isEdit) {
    const badge = document.createElement("span");
    badge.className = "label-caps";
    badge.style.display = "inline-block";
    badge.style.color = "var(--color-text-muted)";
    badge.style.marginBottom = "var(--space-sm)";
    badge.textContent = "Editing — species locked";
    nameCol.appendChild(badge);
  }

  const shinyRow = document.createElement("div");
  shinyRow.style.display = "flex";
  shinyRow.style.alignItems = "center";
  shinyRow.style.gap = "var(--space-sm)";
  nameCol.appendChild(shinyRow);

  const shinyCheckbox = document.createElement("input");
  shinyCheckbox.type = "checkbox";
  shinyCheckbox.id = "detail-shiny";
  if (existing && existing.isShiny) {
    shinyCheckbox.checked = true;
  }
  shinyRow.appendChild(shinyCheckbox);

  const shinyLabel = document.createElement("label");
  shinyLabel.htmlFor = "detail-shiny";
  shinyLabel.className = "body-sm";
  shinyLabel.textContent = "Shiny";
  shinyRow.appendChild(shinyLabel);

  /* ── Shiny sprite swap ── */
  shinyCheckbox.addEventListener("change", () => {
    spriteImg.src = shinyCheckbox.checked ? pokeData.spriteShiny : pokeData.sprite;
  });

  /* ── Type badges ── */
  const typesRow = document.createElement("div");
  typesRow.className = "inspector-panel__types";
  typesRow.style.marginBottom = "var(--space-lg)";
  panel.appendChild(typesRow);

  species.types.forEach((t) => {
    const badge = document.createElement("span");
    badge.className = `type-badge type-badge--${t.toLowerCase()}`;
    badge.textContent = t;
    typesRow.appendChild(badge);
  });

  /* ── Base stats ── */
  const statsSection = document.createElement("div");
  statsSection.style.marginBottom = "var(--space-xl)";
  panel.appendChild(statsSection);

  const statsHeading = document.createElement("h3");
  statsHeading.textContent = "Base Stats";
  statsHeading.className = "headline-sm";
  statsHeading.style.marginBottom = "var(--space-sm)";
  statsSection.appendChild(statsHeading);

  const statLabelMap = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  };

  pokeData.stats.forEach((stat) => {
    const row = document.createElement("div");
    row.className = "stat-gauge";
    row.style.marginBottom = "var(--space-xs)";
    statsSection.appendChild(row);

    const label = document.createElement("span");
    label.className = "stat-gauge__label";
    label.textContent = statLabelMap[stat.name] || stat.name;
    row.appendChild(label);

    const track = document.createElement("div");
    track.className = "stat-gauge__track";
    row.appendChild(track);

    const fill = document.createElement("div");
    fill.className = "stat-gauge__fill";
    const pct = Math.min((stat.value / 255) * 100, 100);
    fill.style.width = `${pct}%`;

    if (stat.value >= 100) {
      fill.classList.add("stat-gauge__fill--positive");
    } else if (stat.value >= 60) {
      fill.classList.add("stat-gauge__fill--neutral");
    } else {
      fill.classList.add("stat-gauge__fill--negative");
    }

    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "stat-gauge__value";
    value.textContent = String(stat.value);
    row.appendChild(value);
  });

  /* ── Edit fields section ── */
  const editSection = document.createElement("div");
  editSection.style.display = "flex";
  editSection.style.flexDirection = "column";
  editSection.style.gap = "var(--space-md)";
  panel.appendChild(editSection);

  /* Helper: create labelled select */
  function createSelectField(labelText, id, options, defaultValue) {
    const fieldRow = document.createElement("div");
    fieldRow.style.display = "flex";
    fieldRow.style.alignItems = "center";
    fieldRow.style.gap = "var(--space-sm)";

    const label = document.createElement("label");
    label.htmlFor = id;
    label.className = "label-caps";
    label.textContent = labelText;
    label.style.width = "120px";
    label.style.flexShrink = "0";
    fieldRow.appendChild(label);

    const select = document.createElement("select");
    select.id = id;
    select.style.flex = "1";
    select.style.padding = "4px 8px";
    select.style.background = "var(--color-surface-l2)";
    select.style.color = "var(--color-text-primary)";
    select.style.border = "1px solid var(--color-hairline)";
    select.style.borderRadius = "var(--radius-default)";
    select.style.fontFamily = "var(--font-body)";
    select.style.fontSize = "var(--body-md)";
    select.style.height = "44px";

    options.forEach((opt) => {
      const optionEl = document.createElement("option");
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
    const fieldRow = document.createElement("div");
    fieldRow.style.display = "flex";
    fieldRow.style.alignItems = "center";
    fieldRow.style.gap = "var(--space-sm)";

    const label = document.createElement("label");
    label.htmlFor = id;
    label.className = "label-caps";
    label.textContent = labelText;
    label.style.width = "120px";
    label.style.flexShrink = "0";
    fieldRow.appendChild(label);

    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.placeholder = placeholder;
    input.value = defaultValue || "";
    input.style.flex = "1";
    input.style.padding = "4px 8px";
    input.style.background = "var(--color-surface-l2)";
    input.style.color = "var(--color-text-primary)";
    input.style.border = "1px solid var(--color-hairline)";
    input.style.borderRadius = "var(--radius-default)";
    input.style.fontFamily = "var(--font-body)";
    input.style.fontSize = "var(--body-md)";
    input.style.height = "44px";

    fieldRow.appendChild(input);
    return fieldRow;
  }

  /* Nickname */
  const defaultNickname = existing ? existing.nickname : "";
  editSection.appendChild(
    createTextField("Nickname", "detail-nickname", "Optional nickname", defaultNickname),
  );

  /* Ability */
  const abilityOptions = pokeData.abilities.map((a) => ({
    value: a,
    label: a.charAt(0).toUpperCase() + a.slice(1).replace(/-/g, " "),
  }));
  const defaultAbility = existing ? existing.ability : pokeData.abilities[0];
  editSection.appendChild(
    createSelectField("Ability", "detail-ability", abilityOptions, defaultAbility),
  );

  /* Nature */
  const natureOptions = natures.map((n) => ({
    value: n.name,
    label: n.name + (n.increased ? ` (+${n.increased}, -${n.decreased})` : " (neutral)"),
  }));
  const defaultNature = existing ? existing.nature : "Serious";
  editSection.appendChild(
    createSelectField("Nature", "detail-nature", natureOptions, defaultNature),
  );

  /* ── Action buttons ── */
  const actionsRow = document.createElement("div");
  actionsRow.style.display = "flex";
  actionsRow.style.justifyContent = "flex-end";
  actionsRow.style.gap = "var(--space-sm)";
  actionsRow.style.marginTop = "var(--space-xl)";
  actionsRow.style.paddingTop = "var(--space-md)";
  actionsRow.style.borderTop = "1px solid var(--color-hairline)";
  panel.appendChild(actionsRow);

  if (isEdit) {
    /* Edit mode: Remove + Save */
    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-destructive";
    removeBtn.textContent = "Remove";
    actionsRow.appendChild(removeBtn);

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Save";
    actionsRow.appendChild(saveBtn);

    return new Promise((resolve) => {
      const cleanup = () => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      };

      removeBtn.addEventListener("click", () => {
        cleanup();
        resolve({ action: "remove" });
      });

      saveBtn.addEventListener("click", () => {
        const isShiny = document.getElementById("detail-shiny").checked;

        const updated = {
          species,
          showdownId: species.showdownId,
          nickname: document.getElementById("detail-nickname").value,
          sprite: isShiny ? pokeData.spriteShiny : pokeData.sprite,
          spriteShiny: pokeData.spriteShiny,
          isShiny,
          stats: pokeData.stats,
          ability: document.getElementById("detail-ability").value,
          nature: document.getElementById("detail-nature").value,
          /* Preserve original recruitedDate in edit mode */
          recruitedDate: existing.recruitedDate || new Date().toISOString().split("T")[0],
        };
        cleanup();
        resolve({ action: "save", pokemon: updated });
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(null);
        }
      });
    });
  } else {
    /* Create mode: Cancel + Save (existing behavior, wrapped return) */
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Cancel";
    actionsRow.appendChild(cancelBtn);

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Save";
    actionsRow.appendChild(saveBtn);

    return new Promise((resolve) => {
      const cleanup = () => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      };

      cancelBtn.addEventListener("click", () => {
        cleanup();
        resolve(null);
      });

      saveBtn.addEventListener("click", () => {
        const isShiny = document.getElementById("detail-shiny").checked;

        const saved = {
          species,
          showdownId: species.showdownId,
          nickname: document.getElementById("detail-nickname").value,
          sprite: isShiny ? pokeData.spriteShiny : pokeData.sprite,
          spriteShiny: pokeData.spriteShiny,
          isShiny,
          stats: pokeData.stats,
          ability: document.getElementById("detail-ability").value,
          nature: document.getElementById("detail-nature").value,
          recruitedDate: new Date().toISOString().split("T")[0],
        };
        cleanup();
        resolve({ action: "save", pokemon: saved });
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(null);
        }
      });
    });
  }
}
