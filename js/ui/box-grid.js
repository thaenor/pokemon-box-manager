import { speciesList } from "../data/species-list.js";

/**
 * Creates the main box grid view.
 * @param {Array} box — array of Pokémon objects in the box (initially empty)
 * @param {Function} onAddPokemon — callback when user clicks an empty grid slot
 * @param {Function} onSelectPokemon — callback when user clicks a filled slot
 * @param {number} boxSize — max slots (default 40)
 * @param {Function} onBoxSizeChange — callback when grid size changes (newSize)
 * @param {Function} onImport — callback when user imports JSON data (pokemonArray)
 * @returns {HTMLElement} the rendered view
 */
export function renderBoxGrid(
  box,
  onAddPokemon,
  onSelectPokemon,
  boxSize = 40,
  onBoxSizeChange,
  onImport,
) {
  const filled = box.filter(Boolean).length;

  // ── Two-pane wrapper ──
  const container = document.createElement("div");
  container.className = "two-pane";

  // ── Left pane ──
  const leftPane = document.createElement("div");
  leftPane.className = "two-pane__left";

  // ── Empty state overlay ──
  const emptyOverlay =
    filled === 0
      ? (() => {
          const el = document.createElement("div");
          el.style.cssText =
            "display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--space-2xl);text-align:center;background:var(--color-surface-l1);border:1px solid var(--color-hairline);border-radius:var(--radius-lg);min-height:320px;margin-bottom:var(--space-lg);";

          const icon = document.createElement("div");
          icon.textContent = "📦";
          icon.style.cssText = "font-size:48px;margin-bottom:var(--space-lg);opacity:0.5;";
          el.appendChild(icon);

          const title = document.createElement("p");
          title.className = "headline-sm";
          title.textContent = "Your box is empty";
          title.style.marginBottom = "var(--space-sm)";
          el.appendChild(title);

          const subtitle = document.createElement("p");
          subtitle.className = "body-md";
          subtitle.style.color = "var(--color-text-muted)";
          subtitle.style.marginBottom = "var(--space-xl)";
          subtitle.textContent = "Tap an empty slot to add a Pokémon";
          el.appendChild(subtitle);

          return el;
        })()
      : null;

  // ── Box nav header ──
  const nav = document.createElement("div");
  nav.className = "box-nav-header";

  // ── Grid size selector ──
  const sizeLabel = document.createElement("label");
  sizeLabel.className = "sr-only";
  sizeLabel.textContent = "Grid slots";

  const sizeSelect = document.createElement("select");
  sizeSelect.className = "box-nav-header__size-select";
  sizeSelect.setAttribute("aria-label", "Grid size");
  [30, 35, 40].forEach((size) => {
    const opt = document.createElement("option");
    opt.value = String(size);
    opt.textContent = size + " slots";
    opt.selected = size === boxSize;
    sizeSelect.appendChild(opt);
  });

  if (typeof onBoxSizeChange === "function") {
    sizeSelect.addEventListener("change", () => {
      onBoxSizeChange(parseInt(sizeSelect.value, 10));
    });
  }

  const capacitySpan = document.createElement("span");
  capacitySpan.className = "box-nav-header__capacity";
  capacitySpan.textContent = filled + "/" + boxSize;

  nav.appendChild(sizeLabel);
  nav.appendChild(sizeSelect);
  nav.appendChild(capacitySpan);

  // ── Toolbar (right side of nav) ──
  const toolbar = document.createElement("div");
  toolbar.className = "box-nav-header__toolbar";

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "box-nav-header__toggle";
  toggleBtn.textContent = "Select";
  toolbar.appendChild(toggleBtn);

  // ── Export button ──
  const exportBtn = document.createElement("button");
  exportBtn.className = "box-nav-header__toggle";
  exportBtn.textContent = "Export";
  exportBtn.addEventListener("click", () => showExportDialog(box));
  toolbar.appendChild(exportBtn);

  // ── Import button ──
  const importBtn = document.createElement("button");
  importBtn.className = "box-nav-header__toggle";
  importBtn.textContent = "Import";
  importBtn.addEventListener("click", () => showImportDialog(onImport));
  toolbar.appendChild(importBtn);

  nav.appendChild(toolbar);

  leftPane.appendChild(nav);

  // ── Matrix grid ──
  const grid = document.createElement("div");
  grid.className = "matrix-grid";

  // ── Empty state overlay (when box is empty — before grid and nav) ──
  if (emptyOverlay) leftPane.insertBefore(emptyOverlay, nav);

  for (let i = 0; i < boxSize; i++) {
    const slot = document.createElement("div");
    slot.className = "slot-cell";
    slot.dataset.index = String(i);
    slot.dataset.testid = "box-slot";

    const pokemon = box[i];
    if (pokemon && pokemon.species) {
      // ── Sprite ──
      const img = document.createElement("img");
      img.className = "slot-cell__sprite";
      img.alt = `${pokemon.species.name} sprite`;
      img.src =
        "https://play.pokemonshowdown.com/sprites/gen5/" + pokemon.species.showdownId + ".png";
      img.loading = "lazy";
      slot.appendChild(img);

      // ── Shiny indicator ──
      // ── Name label below sprite ──
      const nameEl = document.createElement("span");
      nameEl.className = "label-micro";
      nameEl.style.cssText =
        "position: absolute; bottom: 26px; left: 0; right: 0; text-align: center; color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 2px;";
      nameEl.textContent = pokemon.species.name;
      slot.appendChild(nameEl);

      // ── Type badges ──
      const types = pokemon.species.types || [];
      if (types.length > 0) {
        const typeRow = document.createElement("div");
        typeRow.style.cssText =
          "position: absolute; bottom: 3px; left: 0; right: 0; display: flex; gap: 2px; justify-content: center;";
        for (const t of types) {
          const badge = document.createElement("span");
          badge.className = "type-badge type-badge--" + t.toLowerCase();
          badge.textContent = t;
          typeRow.appendChild(badge);
        }
        slot.appendChild(typeRow);
      }

      if (pokemon.isShiny) {
        const shinyDot = document.createElement("span");
        shinyDot.className = "slot-cell__shiny-indicator";
        slot.appendChild(shinyDot);
      }

      // ── Click handler ──
      slot.addEventListener("click", function () {
        if (typeof onSelectPokemon === "function") {
          onSelectPokemon(pokemon, i);
        }
      });
    } else {
      // ── Empty slot: click triggers add ──
      slot.addEventListener("click", function () {
        if (typeof onAddPokemon === "function") {
          onAddPokemon(i);
        }
      });
    }

    grid.appendChild(slot);
  }

  leftPane.appendChild(grid);

  container.appendChild(leftPane);

  // ── Right pane: inspector panel ──
  const rightPane = document.createElement("div");
  rightPane.className = "two-pane__right";

  const inspector = document.createElement("aside");
  inspector.className = "inspector-panel";

  const emptyMsg = document.createElement("p");
  emptyMsg.className = "body-sm";
  emptyMsg.style.cssText =
    "color: var(--color-text-muted); text-align: center; padding: var(--space-xl) 0;";
  emptyMsg.textContent = "Select a Pokémon to inspect";

  inspector.appendChild(emptyMsg);
  rightPane.appendChild(inspector);
  container.appendChild(rightPane);

  return container;
}

/**
 * Convert a non-empty Pokémon to Showdown / Pokepaste format text.
 * @param {object} p — a Pokémon object
 * @returns {string} single Pokémon entry in Showdown format
 */
export function pokemonToShowdown(p) {
  if (!p || !p.species) return "";

  const lines = [];

  // Species name (with optional nickname)
  const speciesName = p.species.name;
  const nickname = p.nickname || "";
  const nameLine = nickname ? `${nickname} (${speciesName})` : speciesName;
  const itemStr = p.heldItem ? ` @ ${p.heldItem}` : "";
  lines.push(`${nameLine}${itemStr}`);

  // Ability
  if (p.ability) {
    lines.push(`Ability: ${p.ability}`);
  }

  // Tera Type
  if (p.teraType) {
    lines.push(`Tera Type: ${p.teraType}`);
  }

  // EVs
  if (p.stats && Array.isArray(p.stats) && p.stats.length > 0) {
    const statAbbrev = {
      hp: "HP",
      attack: "Atk",
      defense: "Def",
      "special-attack": "SpA",
      "special-defense": "SpD",
      speed: "Spe",
    };
    const evParts = [];
    for (const stat of p.stats) {
      if (stat.value && stat.value > 0) {
        const label = statAbbrev[stat.name] || stat.name;
        evParts.push(`${stat.value} ${label}`);
      }
    }
    if (evParts.length > 0) {
      lines.push(`EVs: ${evParts.join(" / ")}`);
    }
  }

  // Nature
  if (p.nature) {
    lines.push(`${p.nature} Nature`);
  }

  return lines.join("\n");
}

/**
 * Convert a box array to Showdown / Pokepaste format text.
 * Each Pokémon is separated by a blank line.
 * @param {Array} box — array of Pokémon objects (may contain nulls)
 * @returns {string} full Pokepaste text
 */
export function showdownExport(box) {
  const filled = box.filter(Boolean);
  const entries = [];
  for (const p of filled) {
    const entry = pokemonToShowdown(p);
    if (entry) entries.push(entry);
  }
  return entries.join("\n\n");
}

/**
 * Show a modal dialog with the current box data.
 * Supports JSON format and Pokepaste (Showdown) format, with a toggle and copy button.
 * @param {Array} box — reference to the live box array (captured at render time)
 */
export function showExportDialog(box) {
  const COPY_FEEDBACK_MS = 1500;
  const closeDialog = () => {
    document.removeEventListener("keydown", onExportKeyDown);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  };

  function onExportKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
    }
  }

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeDialog();
  });

  const panel = document.createElement("div");
  panel.className = "overlay__panel";
  panel.style.cssText =
    "min-width: 360px; max-width: 600px; width: calc(100vw - var(--space-2xl));";

  // ── Title ──
  const title = document.createElement("p");
  title.className = "headline-sm";
  title.textContent = "Box Export (JSON)";
  title.style.marginBottom = "var(--space-md)";
  panel.appendChild(title);

  // ── Format toggle ──
  const toggleRow = document.createElement("div");
  toggleRow.style.cssText = "display: flex; gap: var(--space-sm); margin-bottom: var(--space-md);";

  const jsonTab = document.createElement("button");
  jsonTab.className = "btn btn-primary";
  jsonTab.textContent = "JSON";
  jsonTab.style.flex = "1";

  const pasteTab = document.createElement("button");
  pasteTab.className = "btn btn-secondary";
  pasteTab.textContent = "Pokepaste";
  pasteTab.style.flex = "1";

  toggleRow.appendChild(jsonTab);
  toggleRow.appendChild(pasteTab);
  panel.appendChild(toggleRow);

  // ── Textarea (read-only, selectable) ──
  const textarea = document.createElement("textarea");
  textarea.readOnly = true;
  const filled = box.filter(Boolean);
  textarea.value = JSON.stringify(filled, null, 2);
  textarea.style.cssText =
    "width: 100%; height: 320px; background: var(--color-surface); color: var(--color-text-primary); border: 1px solid var(--color-hairline); border-radius: var(--radius-default); padding: var(--space-md); font-family: monospace; font-size: var(--body-sm); line-height: 1.5; resize: vertical; outline: none;";
  textarea.addEventListener("click", () => textarea.select());
  panel.appendChild(textarea);

  // ── Buttons row ──
  const btnRow = document.createElement("div");
  btnRow.style.cssText =
    "display: flex; justify-content: flex-end; margin-top: var(--space-md); gap: var(--space-sm);";

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn btn-primary";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard
      .writeText(textarea.value)
      .then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        copyBtn.disabled = true;
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.disabled = false;
        }, COPY_FEEDBACK_MS);
      })
      .catch((err) => {
        console.warn("Clipboard write failed:", err);
      });
  });
  btnRow.appendChild(copyBtn);

  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-secondary";
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", closeDialog);
  btnRow.appendChild(closeBtn);

  panel.appendChild(btnRow);
  overlay.appendChild(panel);
  document.addEventListener("keydown", onExportKeyDown);
  document.body.appendChild(overlay);

  // ── Format toggle logic ──
  function updateContent(format) {
    if (format === "json") {
      textarea.value = JSON.stringify(filled, null, 2);
      title.textContent = "Box Export (JSON)";
      jsonTab.className = "btn btn-primary";
      pasteTab.className = "btn btn-secondary";
    } else {
      textarea.value = showdownExport(box);
      title.textContent = "Box Export (Pokepaste)";
      jsonTab.className = "btn btn-secondary";
      pasteTab.className = "btn btn-primary";
    }
  }

  jsonTab.addEventListener("click", () => updateContent("json"));
  pasteTab.addEventListener("click", () => updateContent("pokepaste"));

  // Auto-select the textarea after render
  setTimeout(() => textarea.select(), 0);
}

/**
 * Build a lookup from the species list keyed by showdownId and name (lowercase).
 */
function buildSpeciesLookup() {
  const map = new Map();
  for (const s of speciesList) {
    map.set(s.showdownId.toLowerCase(), s);
    map.set(s.name.toLowerCase(), s);
  }
  return map;
}

function speciesFromBackup(species) {
  const { id, name, showdownId, types, spriteUrl, pokeApiName, isMega, isUltra } = species;
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (
    !Number.isInteger(id) ||
    id < 1 ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof showdownId !== "string" ||
    !slug.test(showdownId) ||
    !Array.isArray(types) ||
    !types.length ||
    types.some((type) => typeof type !== "string" || !type.trim()) ||
    typeof spriteUrl !== "string" ||
    !spriteUrl.startsWith("https://")
  ) {
    return null;
  }
  return {
    id,
    name,
    showdownId,
    types,
    spriteUrl,
    ...(typeof pokeApiName === "string" && slug.test(pokeApiName) && { pokeApiName }),
    isMega: Boolean(isMega),
    isUltra: Boolean(isUltra),
  };
}

/**
 * Show a modal dialog for importing box data from pasted JSON.
 * @param {Function} onImport — callback(data:Array<Object>) when import is confirmed
 */
export function showImportDialog(onImport) {
  const speciesMap = buildSpeciesLookup();

  const closeDialog = () => {
    document.removeEventListener("keydown", onImportKeyDown);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  };

  function onImportKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
    }
  }

  // ── Overlay ──
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeDialog();
  });

  const panel = document.createElement("div");
  panel.className = "overlay__panel";
  panel.style.cssText =
    "min-width: 360px; max-width: 600px; width: calc(100vw - var(--space-2xl));";

  // ── Title ──
  const title = document.createElement("p");
  title.className = "headline-sm";
  title.textContent = "Import Box (JSON)";
  title.style.marginBottom = "var(--space-md)";
  panel.appendChild(title);

  // ── Textarea ──
  const textarea = document.createElement("textarea");
  textarea.placeholder =
    '[{"species":{"name":"Charizard","showdownId":"charizard"},"nickname":"Zippo"}, ...]';
  textarea.style.cssText =
    "width: 100%; height: 320px; background: var(--color-surface); color: var(--color-text-primary); border: 1px solid var(--color-hairline); border-radius: var(--radius-default); padding: var(--space-md); font-family: monospace; font-size: var(--body-sm); line-height: 1.5; resize: vertical; outline: none;";
  panel.appendChild(textarea);

  // ── Error area ──
  const errorEl = document.createElement("div");
  errorEl.className = "import-error";
  errorEl.style.cssText =
    "color: var(--color-danger, #e53935); font-size: var(--body-sm); margin-top: var(--space-sm); white-space: pre-wrap; max-height: 120px; overflow-y: auto; display: none;";
  panel.appendChild(errorEl);

  // ── Buttons ──
  const btnRow = document.createElement("div");
  btnRow.style.cssText =
    "display: flex; justify-content: flex-end; margin-top: var(--space-md); gap: var(--space-sm);";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-secondary";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", closeDialog);
  btnRow.appendChild(cancelBtn);

  const importBtn = document.createElement("button");
  importBtn.className = "btn btn-primary";
  importBtn.textContent = "Import";
  importBtn.addEventListener("click", () => {
    const raw = textarea.value.trim();
    if (!raw) {
      showError("Paste JSON data first.");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // Try to extract line number from the native error message
      const match = e.message.match(/position\s+(\d+)/i);
      let hint = "";
      if (match) {
        const pos = parseInt(match[1], 10);
        const before = raw.slice(0, pos);
        const line = (before.match(/\n/g) || []).length + 1;
        hint = ` at line ${line}`;
      }
      showError(`Invalid JSON${hint}: ${e.message}`);
      return;
    }

    if (!Array.isArray(parsed)) {
      showError("Expected a JSON array of Pokémon.");
      return;
    }

    // Validate all entries first — no partial mutation
    const errors = [];
    const resolved = [];
    for (let i = 0; i < parsed.length; i++) {
      const entry = parsed[i];
      if (!entry || typeof entry !== "object") {
        errors.push(`Entry at index ${i} is not a valid object`);
        continue;
      }
      if (!entry.species || typeof entry.species !== "object") {
        errors.push(`Entry at index ${i} has no species field`);
        continue;
      }

      const { showdownId, name } = entry.species;
      const byId = typeof showdownId === "string" && speciesMap.get(showdownId.toLowerCase());
      const byName = typeof name === "string" && speciesMap.get(name.toLowerCase());
      // Full backups can include Pokémon from earlier regulations or newly fetched rosters.
      const match = byId || byName || speciesFromBackup(entry.species);

      if (!match) {
        const label = entry.species.showdownId || entry.species.name || "(unknown)";
        errors.push(`Unknown species '${label}' at index ${i} — check the name`);
        continue;
      }

      // Resolve species to the roster entry (preserving types, spriteUrl, etc.)
      resolved.push({
        ...entry,
        species: { ...match },
      });
    }

    if (errors.length > 0) {
      showError(errors.join("\n"));
      return;
    }

    if (resolved.length === 0) {
      showError("No valid Pokémon entries found.");
      return;
    }

    // All validated — invoke callback
    if (typeof onImport === "function") {
      onImport(resolved);
      closeDialog();
    } else {
      showError("Import handler not available. Please refresh and try again.");
    }
  });
  btnRow.appendChild(importBtn);

  panel.appendChild(btnRow);
  overlay.appendChild(panel);
  document.addEventListener("keydown", onImportKeyDown);
  document.body.appendChild(overlay);

  // Focus the textarea
  setTimeout(() => textarea.focus(), 0);

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = "";
  }
}
