/**
 * Species Search Overlay — Full-page species selection
 *
 * Shows a dark overlay with a search input and filtered results grid.
 * Returns a promise that resolves with the chosen species object or null.
 */

import { speciesList } from "../data/species-list.js";

/**
 * Show the species search overlay. Returns a promise that resolves with the selected species object or null (dismissed).
 * @returns {Promise<Object|null>}
 */
export function showSpeciesSearch() {
  return new Promise((resolve) => {
    let resolved = false;

    function finish(result) {
      if (resolved) return;
      resolved = true;
      document.removeEventListener("keydown", onKeyDown);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      resolve(result);
    }

    /* ── Overlay ── */
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.dataset.testid = "species-search";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) finish(null);
    });

    /* ── Panel (wider than default overlay__panel to fit results) ── */
    const panel = document.createElement("div");
    panel.className = "overlay__panel";
    panel.style.maxWidth = "520px";
    panel.style.width = "90vw";
    panel.style.maxHeight = "80vh";
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.gap = "var(--space-md)";
    panel.style.overflow = "hidden";
    overlay.appendChild(panel);

    /* ── Title ── */
    const title = document.createElement("div");
    title.className = "headline-md";
    title.textContent = "Select Pokémon";
    panel.appendChild(title);

    /* ── Search input ── */
    const searchLabel = document.createElement("label");
    searchLabel.className = "sr-only";
    searchLabel.htmlFor = "species-search-input";
    searchLabel.textContent = "Search Pokémon";
    panel.appendChild(searchLabel);

    const input = document.createElement("input");
    input.id = "species-search-input";
    input.type = "text";
    input.placeholder = "Search Pokémon...";
    input.style.width = "100%";
    input.style.height = "48px";
    input.style.padding = "var(--space-sm) var(--space-md)";
    input.style.border = "1px solid var(--color-hairline)";
    input.style.borderRadius = "var(--radius-default)";
    input.style.background = "var(--color-surface-l2)";
    input.style.color = "var(--color-text-primary)";
    input.style.fontFamily = "var(--font-body)";
    input.style.fontSize = "16px";
    input.style.outline = "none";
    input.style.boxSizing = "border-box";
    input.style.marginBottom = "var(--space-md)";
    input.addEventListener("focus", () => {
      input.style.borderColor = "var(--color-border-active)";
    });
    input.addEventListener("blur", () => {
      input.style.borderColor = "var(--color-hairline)";
    });
    input.dataset.testid = "search-input";
    panel.appendChild(input);

    /* ── Results container (scrollable) ── */
    const resultsEl = document.createElement("div");
    resultsEl.style.flex = "1";
    resultsEl.style.overflowY = "auto";
    resultsEl.style.minHeight = "0";
    resultsEl.style.display = "flex";
    resultsEl.style.flexDirection = "column";
    resultsEl.style.gap = "2px";
    panel.appendChild(resultsEl);

    /* ── Footer with cancel button ── */
    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";
    footer.style.paddingTop = "var(--space-sm)";
    footer.style.borderTop = "1px solid var(--color-hairline)";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => finish(null));
    footer.appendChild(cancelBtn);
    panel.appendChild(footer);

    /* ── Render a single species row ── */
    function createSpeciesRow(species) {
      const row = document.createElement("div");
      row.dataset.testid = "search-result";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "var(--space-md)";
      row.style.padding = "var(--space-sm) var(--space-xs)";
      row.style.borderRadius = "var(--radius-default)";
      row.style.cursor = "pointer";
      row.style.transition = "background 0.1s";
      row.addEventListener("mouseenter", () => {
        row.style.background = "var(--color-surface-hover)";
      });
      row.addEventListener("mouseleave", () => {
        row.style.background = "transparent";
      });
      row.addEventListener("click", () => finish(species));

      /* Sprite container — fixed 48×48, no layout shift */
      const spriteWrap = document.createElement("div");
      spriteWrap.style.width = "48px";
      spriteWrap.style.height = "48px";
      spriteWrap.style.flexShrink = "0";
      spriteWrap.style.position = "relative";

      /* Placeholder — letter circle (shown while sprite loads) */
      const spritePlaceholder = document.createElement("div");
      spritePlaceholder.style.width = "48px";
      spritePlaceholder.style.height = "48px";
      spritePlaceholder.style.borderRadius = "50%";
      spritePlaceholder.style.background = "var(--color-surface-l2)";
      spritePlaceholder.style.display = "flex";
      spritePlaceholder.style.alignItems = "center";
      spritePlaceholder.style.justifyContent = "center";
      spritePlaceholder.style.fontFamily = "var(--font-display)";
      spritePlaceholder.style.fontSize = "20px";
      spritePlaceholder.style.fontWeight = "600";
      spritePlaceholder.style.color = "var(--color-text-secondary)";
      spritePlaceholder.style.position = "absolute";
      spritePlaceholder.style.inset = "0";
      spritePlaceholder.textContent = species.name.charAt(0).toUpperCase();
      spriteWrap.appendChild(spritePlaceholder);

      /* Actual sprite — hidden until loaded */
      const spriteImg = document.createElement("img");
      spriteImg.alt = species.name;
      spriteImg.style.width = "48px";
      spriteImg.style.height = "48px";
      spriteImg.style.objectFit = "contain";
      spriteImg.style.position = "absolute";
      spriteImg.style.inset = "0";
      spriteImg.style.display = "none";
      // Attach listeners BEFORE setting src so cached images don't fire load before the handler
      spriteImg.addEventListener("load", () => {
        spritePlaceholder.style.display = "none";
        spriteImg.style.display = "block";
      });
      spriteImg.addEventListener("error", () => {
        // Keep letter placeholder on load failure
        spriteImg.style.display = "none";
      });
      spriteImg.src = species.spriteUrl;
      spriteWrap.appendChild(spriteImg);

      row.appendChild(spriteWrap);

      /* Info column */
      const infoCol = document.createElement("div");
      infoCol.style.display = "flex";
      infoCol.style.flexDirection = "column";
      infoCol.style.gap = "4px";
      infoCol.style.minWidth = "0";

      const nameEl = document.createElement("div");
      nameEl.className = "body-md";
      nameEl.style.color = "var(--color-text-primary)";
      nameEl.style.fontWeight = "500";
      nameEl.textContent = species.name;
      infoCol.appendChild(nameEl);

      const typesRow = document.createElement("div");
      typesRow.style.display = "flex";
      typesRow.style.gap = "var(--space-xs)";
      typesRow.style.flexWrap = "wrap";
      species.types.forEach((type) => {
        const badge = document.createElement("span");
        badge.className = `type-badge type-badge--${type.toLowerCase()}`;
        badge.textContent = type;
        typesRow.appendChild(badge);
      });
      infoCol.appendChild(typesRow);

      row.appendChild(infoCol);

      return row;
    }

    /* ── Render results based on filter ── */
    let debounceTimer = null;

    function renderResults(filter) {
      const q = filter.trim().toLowerCase();

      resultsEl.innerHTML = "";

      if (q.length === 0) {
        const hint = document.createElement("div");
        hint.className = "body-md";
        hint.style.color = "var(--color-text-muted)";
        hint.style.textAlign = "center";
        hint.style.padding = "var(--space-2xl) var(--space-md)";
        hint.textContent = "Type to search Pokémon…";
        resultsEl.appendChild(hint);
        return;
      }

      const results = speciesList.filter((s) => s.name.toLowerCase().includes(q));

      if (results.length === 0) {
        const empty = document.createElement("div");
        empty.className = "body-md";
        empty.style.color = "var(--color-text-muted)";
        empty.style.textAlign = "center";
        empty.style.padding = "var(--space-2xl) var(--space-md)";
        empty.textContent = "No Pokémon found";
        resultsEl.appendChild(empty);
        return;
      }

      results.forEach((species) => {
        resultsEl.appendChild(createSpeciesRow(species));
      });
    }

    /* ── Debounced input handler ── */
    function handleInput() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderResults(input.value);
      }, 300);
    }

    input.addEventListener("input", handleInput);

    /* ── Keyboard: Escape dismisses ── */
    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);

    /* ── Initial render (show all) ── */
    renderResults("");

    /* ── Append to body and focus input ── */
    document.body.appendChild(overlay);
    input.focus();
  });
}
