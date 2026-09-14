/**
 * Creates the box grid view — main view after login.
 * @param {Array} box — array of Pokémon objects in the box (initially empty)
 * @param {Function} onAddPokemon — callback when user clicks "+ Add Pokémon"
 * @param {Function} onSelectPokemon — callback when user clicks a filled slot
 * @param {number} boxSize — max slots (default 30)
 * @returns {HTMLElement} the rendered view
 */
export function renderBoxGrid(box, onAddPokemon, onSelectPokemon, boxSize = 30, onLogout) {
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
          subtitle.textContent = "Tap + Add Pokémon to start building your box";
          el.appendChild(subtitle);

          const addBtn = document.createElement("button");
          addBtn.className = "btn btn-primary";
          addBtn.textContent = "+ Add Pokémon";
          addBtn.addEventListener("click", function () {
            if (typeof onAddPokemon === "function") {
              onAddPokemon();
            }
          });
          el.appendChild(addBtn);
          return el;
        })()
      : null;

  // ── Box nav header ──
  const nav = document.createElement("div");
  nav.className = "box-nav-header";

  const capacitySpan = document.createElement("span");
  capacitySpan.className = "box-nav-header__capacity";
  capacitySpan.textContent = filled + "/" + boxSize;

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

  // ── Sign-out button ──
  if (typeof onLogout === "function") {
    const logoutBtn = document.createElement("button");
    logoutBtn.className = "box-nav-header__toggle box-nav-header__toggle--logout";
    logoutBtn.textContent = "Sign out";
    logoutBtn.addEventListener("click", onLogout);
    toolbar.appendChild(logoutBtn);
  }

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

  // ── Add Pokémon button ──
  const addWrapper = document.createElement("div");
  addWrapper.style.cssText = "display: flex; justify-content: center; margin-top: var(--space-lg);";

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn-primary";
  addBtn.textContent = "+ Add Pok\u00E9mon";
  addBtn.addEventListener("click", function () {
    if (typeof onAddPokemon === "function") {
      onAddPokemon();
    }
  });

  addWrapper.appendChild(addBtn);
  leftPane.appendChild(addWrapper);

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
  emptyMsg.textContent = "Select a Pok\u00E9mon to inspect";

  inspector.appendChild(emptyMsg);
  rightPane.appendChild(inspector);
  container.appendChild(rightPane);

  return container;
}

/**
 * Show a modal dialog with the current box data as formatted JSON.
 * @param {Array} box — reference to the live box array (captured at render time)
 */
export function showExportDialog(box) {
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

  // ── Textarea (read-only, selectable) ──
  const textarea = document.createElement("textarea");
  textarea.readOnly = true;
  textarea.value = JSON.stringify(box, null, 2);
  textarea.style.cssText =
    "width: 100%; height: 320px; background: var(--color-surface); color: var(--color-text-primary); border: 1px solid var(--color-hairline); border-radius: var(--radius-default); padding: var(--space-md); font-family: monospace; font-size: var(--body-sm); line-height: 1.5; resize: vertical; outline: none;";
  textarea.addEventListener("click", () => textarea.select());
  panel.appendChild(textarea);

  // ── Close button ──
  const btnRow = document.createElement("div");
  btnRow.style.cssText =
    "display: flex; justify-content: flex-end; margin-top: var(--space-md); gap: var(--space-sm);";

  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-secondary";
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", closeDialog);
  btnRow.appendChild(closeBtn);

  panel.appendChild(btnRow);
  overlay.appendChild(panel);
  document.addEventListener("keydown", onExportKeyDown);
  document.body.appendChild(overlay);

  // Auto-select the textarea after render
  setTimeout(() => textarea.select(), 0);
}
