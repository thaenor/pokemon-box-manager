import { natures } from "../data/natures.js";
import { fetchPokemon } from "../api/pokeapi.js";
import { saveFocus, trapTab } from "./focus-trap.js";
import PokemonCache from "../cache/pokemon-cache.js";

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
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "detail-title");
  const restoreFocus = saveFocus();

  const panel = document.createElement("div");
  panel.className = "overlay__panel";
  panel.style.maxWidth = "640px";
  panel.style.maxHeight = "90vh";
  panel.style.overflowY = "auto";
  overlay.appendChild(panel);

  /* ── Loading state ── */
  const loadingEl = document.createElement("div");
  loadingEl.setAttribute("role", "status");
  loadingEl.setAttribute("aria-live", "polite");
  loadingEl.style.textAlign = "center";
  loadingEl.style.padding = "2rem";
  panel.appendChild(loadingEl);

  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  loadingEl.appendChild(spinner);

  const loadingText = document.createElement("div");
  loadingText.className = "body-lg";
  loadingText.style.color = "var(--color-text-secondary)";
  loadingEl.appendChild(loadingText);

  document.body.appendChild(overlay);
  loadingText.textContent = "Loading Pokémon data…";

  /* ── Fetch (IndexedDB cache-first) ── */
  const pokeApiName = species.pokeApiName || species.showdownId;

  let pokeData = null;
  let cache;

  try {
    cache = await PokemonCache.open();
    pokeData = await cache.getSpecies(pokeApiName);
  } catch {
    // Cache unavailable (private browsing, test env) — fall through to network fetch
  }

  if (!pokeData) {
    pokeData = await fetchPokemon(pokeApiName);
    if (pokeData && cache) {
      cache.saveSpecies(pokeApiName, pokeData); // fire-and-forget
    }
  }

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
      function onErrorKey(e) {
        if (e.key === "Tab") {
          trapTab(panel, e);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          handleDismiss();
        }
      }

      const handleDismiss = () => {
        document.removeEventListener("keydown", onErrorKey);
        restoreFocus();
        document.body.removeChild(overlay);
        resolve(null);
      };
      closeBtn.addEventListener("click", handleDismiss);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) handleDismiss();
      });
      document.addEventListener("keydown", onErrorKey);
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
  spriteImg.alt = species.name;
  spriteImg.style.width = "96px";
  spriteImg.style.height = "96px";
  spriteImg.style.objectFit = "contain";
  spriteImg.style.imageRendering = "pixelated";
  headerRow.appendChild(spriteImg);

  /** Tracks the current blob: URL so it can be revoked on change. */
  let currentSpriteBlobUrl = null;

  /** Load a sprite URL via cache-first (IndexedDB blob cache). */
  async function loadSprite(url) {
    if (currentSpriteBlobUrl) {
      URL.revokeObjectURL(currentSpriteBlobUrl);
      currentSpriteBlobUrl = null;
    }
    try {
      const cache = await PokemonCache.open();
      const cached = await cache.getSprite(url);
      if (cached) {
        currentSpriteBlobUrl = cached;
        spriteImg.src = cached;
        return;
      }
      const blobUrl = await cache.saveSprite(url);
      currentSpriteBlobUrl = blobUrl;
      spriteImg.src = blobUrl;
    } catch {
      // Fallback: direct URL on cache failure (private browsing, CORS, etc.)
      spriteImg.src = url;
    }
  }

  // Initial sprite load
  loadSprite(pokeData.sprite);

  const nameCol = document.createElement("div");
  nameCol.style.flex = "1";
  headerRow.appendChild(nameCol);

  const nameEl = document.createElement("h2");
  nameEl.textContent = species.name;
  nameEl.id = "detail-title";
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
    loadSprite(shinyCheckbox.checked ? pokeData.spriteShiny : pokeData.sprite);
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
      select.appendChild(optionEl);
      if (opt.value === defaultValue) {
        optionEl.selected = true;
      }
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

  /* Held Item */
  const HELD_ITEMS = [
    "Life Orb",
    "Choice Specs",
    "Choice Scarf",
    "Choice Band",
    "Assault Vest",
    "Heavy-Duty Boots",
    "Leftovers",
    "Rocky Helmet",
    "Focus Sash",
    "Light Clay",
    "Booster Energy",
    "Air Balloon",
    "Sitrus Berry",
    "Aguav Berry",
    "Figy Berry",
    "Iapapa Berry",
    "Mago Berry",
    "Wiki Berry",
    "Lum Berry",
    "Leppa Berry",
    "Safety Goggles",
    "Eviolite",
    "Weakness Policy",
    "Eject Button",
    "Eject Pack",
    "Red Card",
    "Shed Shell",
    "Blunder Policy",
    "Zoom Lens",
    "Wide Lens",
    "Bright Powder",
    "King's Rock",
    "Scope Lens",
    "Mental Herb",
    "White Herb",
    "Power Herb",
    "Room Service",
    "Throat Spray",
    "Utility Umbrella",
    "Covert Cloak",
    "Punching Glove",
    "Loaded Dice",
    "Clear Amulet",
    "Mirror Herb",
    "Black Sludge",
    "Flame Orb",
    "Toxic Orb",
    "Adrenaline Orb",
    "Terrain Extender",
    "Damp Rock",
    "Heat Rock",
    "Icy Rock",
    "Big Root",
    "Shell Bell",
    "Quick Claw",
    "Destiny Knot",
  ];
  const heldItemRow = document.createElement("div");
  heldItemRow.style.display = "flex";
  heldItemRow.style.alignItems = "center";
  heldItemRow.style.gap = "var(--space-sm)";
  heldItemRow.style.marginBottom = "0";

  const heldItemLabel = document.createElement("label");
  heldItemLabel.htmlFor = "detail-held-item";
  heldItemLabel.className = "label-caps";
  heldItemLabel.textContent = "Held Item";
  heldItemLabel.style.width = "120px";
  heldItemLabel.style.flexShrink = "0";
  heldItemRow.appendChild(heldItemLabel);

  const heldItemInput = document.createElement("input");
  heldItemInput.type = "text";
  heldItemInput.id = "detail-held-item";
  heldItemInput.placeholder = "e.g. Life Orb";
  heldItemInput.value = existing ? existing.heldItem || "" : "";
  heldItemInput.style.flex = "1";
  heldItemInput.style.padding = "4px 8px";
  heldItemInput.style.background = "var(--color-surface-l2)";
  heldItemInput.style.color = "var(--color-text-primary)";
  heldItemInput.style.border = "1px solid var(--color-hairline)";
  heldItemInput.style.borderRadius = "var(--radius-default)";
  heldItemInput.style.fontFamily = "var(--font-body)";
  heldItemInput.style.fontSize = "var(--body-md)";
  heldItemInput.style.height = "44px";
  heldItemRow.appendChild(heldItemInput);

  const datalist = document.createElement("datalist");
  datalist.id = "detail-held-item-list";
  HELD_ITEMS.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item;
    datalist.appendChild(opt);
  });
  heldItemInput.setAttribute("list", "detail-held-item-list");
  heldItemRow.appendChild(datalist);
  editSection.appendChild(heldItemRow);

  /* Tera Type */
  const teraTypes = [
    "",
    "Normal",
    "Fire",
    "Water",
    "Grass",
    "Electric",
    "Ice",
    "Fighting",
    "Poison",
    "Ground",
    "Flying",
    "Psychic",
    "Bug",
    "Rock",
    "Ghost",
    "Dragon",
    "Dark",
    "Steel",
    "Fairy",
  ];
  const teraOptions = teraTypes.map((t) => ({
    value: t,
    label: t || "None",
  }));
  const defaultTeraType = existing ? existing.teraType || "" : "";
  editSection.appendChild(
    createSelectField("Tera Type", "detail-tera-type", teraOptions, defaultTeraType),
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
        document.removeEventListener("keydown", onEditKeyDown);
        restoreFocus();
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        if (currentSpriteBlobUrl) {
          URL.revokeObjectURL(currentSpriteBlobUrl);
        }
      };

      function onEditKeyDown(e) {
        if (e.key === "Tab") {
          trapTab(panel, e);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cleanup();
          resolve(null);
        } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          saveBtn.click();
        }
      }
      document.addEventListener("keydown", onEditKeyDown);

      /* ── Remove confirmation dialog ── */
      function showRemoveConfirm(pokemonName, editCleanup, editResolve) {
        const confirmOverlay = document.createElement("div");
        confirmOverlay.className = "overlay";
        confirmOverlay.setAttribute("role", "dialog");
        confirmOverlay.setAttribute("aria-modal", "true");

        const confirmPanel = document.createElement("div");
        confirmPanel.className = "overlay__panel";
        confirmPanel.style.maxWidth = "400px";
        confirmPanel.style.textAlign = "center";
        confirmOverlay.appendChild(confirmPanel);

        const message = document.createElement("p");
        message.textContent = `Remove ${pokemonName} from your box? This cannot be undone.`;
        message.style.marginBottom = "var(--space-lg)";
        message.className = "body-lg";
        confirmPanel.appendChild(message);

        const actionsRow = document.createElement("div");
        actionsRow.style.display = "flex";
        actionsRow.style.gap = "var(--space-sm)";
        actionsRow.style.justifyContent = "center";
        confirmPanel.appendChild(actionsRow);

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "btn btn-secondary";
        cancelBtn.textContent = "Cancel";
        actionsRow.appendChild(cancelBtn);

        const confirmRemoveBtn = document.createElement("button");
        confirmRemoveBtn.className = "btn btn-destructive";
        confirmRemoveBtn.textContent = "Remove";
        actionsRow.appendChild(confirmRemoveBtn);

        document.body.appendChild(confirmOverlay);

        function onConfirmKeyDown(e) {
          if (e.key === "Tab") {
            trapTab(confirmPanel, e);
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            dismissConfirm();
          }
        }

        function dismissConfirm() {
          document.removeEventListener("keydown", onConfirmKeyDown);
          document.addEventListener("keydown", onEditKeyDown);
          if (confirmOverlay.parentNode) {
            confirmOverlay.parentNode.removeChild(confirmOverlay);
          }
        }

        cancelBtn.addEventListener("click", dismissConfirm);
        confirmOverlay.addEventListener("click", (e) => {
          if (e.target === confirmOverlay) dismissConfirm();
        });

        confirmRemoveBtn.addEventListener("click", () => {
          document.removeEventListener("keydown", onConfirmKeyDown);
          document.removeEventListener("keydown", onEditKeyDown);
          if (confirmOverlay.parentNode) {
            confirmOverlay.parentNode.removeChild(confirmOverlay);
          }
          editCleanup();
          editResolve({ action: "remove" });
        });

        // Suppress edit Escape handler while confirm dialog is open
        document.removeEventListener("keydown", onEditKeyDown);
        document.addEventListener("keydown", onConfirmKeyDown);
      }

      removeBtn.addEventListener("click", () => {
        showRemoveConfirm(species.name, cleanup, resolve);
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
          heldItem: document.getElementById("detail-held-item").value,
          teraType: document.getElementById("detail-tera-type").value,
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
    cancelBtn.type = "button";
    actionsRow.appendChild(cancelBtn);

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Save";
    actionsRow.appendChild(saveBtn);

    return new Promise((resolve) => {
      const cleanup = () => {
        document.removeEventListener("keydown", onCreateKeyDown);
        restoreFocus();
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        if (currentSpriteBlobUrl) {
          URL.revokeObjectURL(currentSpriteBlobUrl);
        }
      };

      function onCreateKeyDown(e) {
        if (e.key === "Tab") {
          trapTab(panel, e);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cleanup();
          resolve(null);
        } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          saveBtn.click();
        }
      }
      document.addEventListener("keydown", onCreateKeyDown);

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
          heldItem: document.getElementById("detail-held-item").value,
          teraType: document.getElementById("detail-tera-type").value,
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
