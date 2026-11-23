/**
 * Species Search Overlay — Full-page species selection
 *
 * Shows a dark overlay with a search input, type filter chips, and filtered results grid.
 * Returns a promise that resolves with the chosen species object or null.
 */

import { speciesList } from "../data/species-list.js";
import { loadRankedRoster, toShowdownId } from "../api/champions.js";
import { saveFocus, trapTab } from "./focus-trap.js";
import PokemonCache from "../cache/pokemon-cache.js";

const RANKED_PREVIEW_SIZE = 25;

/** All 18 Pokémon types, ordered per convention. */
const ALL_TYPES = [
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

/**
 * Show the species search overlay. Returns a promise that resolves with the selected species object or null (dismissed).
 * @returns {Promise<Object|null>}
 */
export function showSpeciesSearch() {
  return new Promise((resolve) => {
    let resolved = false;
    const restoreFocus = saveFocus();
    const availableSpecies = new Map(speciesList.map((species) => [species.showdownId, species]));
    const rankedRosters = new Map();

    /** @type {Set<string>} Currently selected type filters (OR logic). */
    const selectedTypes = new Set();

    function finish(result) {
      if (resolved) return;
      resolved = true;
      clearTimeout(debounceTimer);
      revokeSpriteBlobUrls();
      document.removeEventListener("keydown", onKeyDown);
      restoreFocus();
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      resolve(result);
    }

    /* ── Overlay ── */
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.dataset.testid = "species-search";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "species-search-title");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) finish(null);
    });

    /* ── Panel (wider than default overlay__panel to fit results) ── */
    const panel = document.createElement("div");
    panel.className = "overlay__panel";
    panel.style.maxWidth = "520px";
    panel.style.width = "90vw";
    panel.style.maxHeight = "90dvh";
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.gap = "var(--space-md)";
    panel.style.overflow = "hidden";
    overlay.appendChild(panel);

    /* ── Title ── */
    const title = document.createElement("div");
    title.className = "headline-md";
    title.textContent = "Select Pokémon";
    title.id = "species-search-title";
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
    input.style.marginBottom = "var(--space-sm)";
    input.addEventListener("focus", () => {
      input.style.borderColor = "var(--color-border-active)";
    });
    input.addEventListener("blur", () => {
      input.style.borderColor = "var(--color-hairline)";
    });
    input.dataset.testid = "search-input";
    panel.appendChild(input);

    const rosterLabel = document.createElement("label");
    rosterLabel.className = "species-roster-control";
    rosterLabel.textContent = "Roster";
    const rosterSelect = document.createElement("select");
    rosterLabel.appendChild(rosterSelect);
    for (const [value, text] of [
      ["", "All Pokémon"],
      ["Singles", "Ranked Singles"],
      ["Doubles", "Ranked Doubles"],
    ]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      rosterSelect.appendChild(option);
    }
    panel.appendChild(rosterLabel);

    /* ── Type filter chips ── */
    const chipBar = document.createElement("div");
    chipBar.style.display = "flex";
    chipBar.style.flexWrap = "wrap";
    chipBar.style.gap = "6px";
    chipBar.style.marginBottom = "var(--space-sm)";
    chipBar.setAttribute("role", "group");
    chipBar.setAttribute("aria-label", "Filter by type");

    const chipButtons = [];

    function toggleType(type) {
      if (selectedTypes.has(type)) {
        selectedTypes.delete(type);
      } else {
        selectedTypes.add(type);
      }
      updateChipStates();
      renderResults(input.value);
    }

    function clearTypes() {
      selectedTypes.clear();
      updateChipStates();
      renderResults(input.value);
    }

    function updateChipStates() {
      chipButtons.forEach((chip, i) => {
        const type = ALL_TYPES[i];
        const active = selectedTypes.has(type);
        chip.dataset.active = active ? "true" : "false";
        chip.style.opacity = active ? "1" : "0.55";
        chip.style.outline = active
          ? "2px solid var(--color-border-active)"
          : "2px solid transparent";
        chip.style.outlineOffset = "1px";
      });
      clearBtn.style.display = selectedTypes.size > 0 ? "inline-flex" : "none";
    }

    ALL_TYPES.forEach((type) => {
      const chip = document.createElement("button");
      chip.className = `type-badge type-badge--${type.toLowerCase()}`;
      chip.textContent = type;
      chip.type = "button";
      chip.dataset.testid = `type-chip-${type.toLowerCase()}`;
      chip.style.cursor = "pointer";
      chip.style.fontSize = "11px";
      chip.style.padding = "2px 8px";
      chip.style.borderRadius = "var(--radius-default)";
      chip.style.border = "none";
      chip.style.fontFamily = "var(--font-body)";
      chip.style.fontWeight = "600";
      chip.style.transition = "opacity 0.1s, outline 0.1s";
      chip.dataset.active = "false";
      chip.style.opacity = "0.55";
      chip.style.outline = "2px solid transparent";
      chip.style.outlineOffset = "1px";
      chip.addEventListener("click", () => toggleType(type));
      chipButtons.push(chip);
      chipBar.appendChild(chip);
    });

    /* Clear button */
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "btn btn-sm";
    clearBtn.textContent = "Clear";
    clearBtn.style.display = "none";
    clearBtn.style.fontSize = "11px";
    clearBtn.style.padding = "2px 10px";
    clearBtn.style.borderRadius = "var(--radius-default)";
    clearBtn.style.border = "1px solid var(--color-hairline)";
    clearBtn.style.background = "var(--color-surface-l2)";
    clearBtn.style.color = "var(--color-text-secondary)";
    clearBtn.style.cursor = "pointer";
    clearBtn.style.fontFamily = "var(--font-body)";
    clearBtn.style.fontWeight = "500";
    clearBtn.dataset.testid = "type-clear-btn";
    clearBtn.addEventListener("click", clearTypes);
    chipBar.appendChild(clearBtn);

    panel.appendChild(chipBar);

    /* ── Results container (scrollable) ── */
    const resultsEl = document.createElement("div");
    resultsEl.style.flex = "1";
    resultsEl.style.overflowY = "auto";
    resultsEl.style.minHeight = "0";
    resultsEl.style.display = "flex";
    resultsEl.style.flexDirection = "column";
    resultsEl.style.gap = "2px";
    resultsEl.setAttribute("role", "listbox");
    panel.appendChild(resultsEl);

    const rosterStatus = document.createElement("p");
    rosterStatus.className = "species-roster-status";
    rosterStatus.setAttribute("role", "status");
    panel.appendChild(rosterStatus);

    /* ── Footer with cancel button ── */
    const footer = document.createElement("div");
    footer.className = "species-search-footer";
    footer.style.paddingTop = "var(--space-sm)";
    footer.style.borderTop = "1px solid var(--color-hairline)";

    const source = document.createElement("a");
    source.href = "https://championsbattledata.com/";
    source.target = "_blank";
    source.rel = "noopener";
    source.textContent = "Battle data provided by Pokémon Champions Battle Data";
    footer.appendChild(source);

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.type = "button";
    cancelBtn.addEventListener("click", () => finish(null));
    footer.appendChild(cancelBtn);
    panel.appendChild(footer);

    /* ── Cache-first sprite loader ── */
    /** @type {Set<string>} Blob URLs that need revocation on dismiss */
    const spriteBlobUrls = new Set();

    /** Revoke all tracked blob URLs. */
    function revokeSpriteBlobUrls() {
      for (const url of spriteBlobUrls) {
        URL.revokeObjectURL(url);
      }
      spriteBlobUrls.clear();
    }

    async function loadSpriteWithCache(url, imgEl) {
      try {
        const cache = await PokemonCache.open();
        const cached = await cache.getSprite(url);
        if (cached) {
          spriteBlobUrls.add(cached);
          imgEl.src = cached;
          return;
        }
        const blobUrl = await cache.saveSprite(url);
        spriteBlobUrls.add(blobUrl);
        imgEl.src = blobUrl;
      } catch {
        // Fallback: direct URL on cache failure (private browsing, CORS, etc.)
        imgEl.src = url;
      }
    }

    /* ── Render a single species row ── */
    function createSpeciesRow(species, position) {
      const row = document.createElement("div");
      row.dataset.testid = "search-result";
      row.setAttribute("tabindex", "0");
      row.setAttribute("role", "option");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "var(--space-md)";
      row.style.padding = "var(--space-sm) var(--space-xs)";
      row.style.borderRadius = "var(--radius-default)";
      row.style.cursor = "pointer";
      row.style.transition = "background 0.1s";
      row.addEventListener("mouseenter", () => {
        row.style.background = "var(--color-surface-hover)";
        highlightedIndex = Array.from(resultsEl.children).indexOf(row);
      });
      row.addEventListener("mouseleave", () => {
        row.style.background = "transparent";
      });
      row.addEventListener("click", () => finish(species));
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          finish(species);
        }
      });
      row.addEventListener("focus", () => {
        highlightedIndex = Array.from(resultsEl.children).indexOf(row);
        applyHighlight(highlightedIndex);
      });

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
      // Load sprite via cache-first
      loadSpriteWithCache(species.spriteUrl, spriteImg);
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

      if (position) {
        const rank = document.createElement("span");
        rank.className = "species-rank";
        rank.textContent = `#${position}`;
        row.appendChild(rank);
      }

      return row;
    }

    /* ── Highlight tracking for keyboard nav ── */
    let highlightedIndex = -1;

    function applyHighlight(index) {
      const rows = resultsEl.querySelectorAll('[data-testid="search-result"]');
      rows.forEach((r, i) => {
        r.style.background = i === index ? "var(--color-surface-hover)" : "transparent";
      });
    }

    /* ── Render results based on filter AND selected types ── */
    let debounceTimer = null;

    function matchesTypeFilter(species) {
      if (selectedTypes.size === 0) return true;
      // OR logic: species matches if any of its types is selected
      return species.types.some((t) => selectedTypes.has(t));
    }

    function renderResults(filter) {
      const q = filter.trim().toLowerCase();
      const format = rosterSelect.value;
      const ranked = rankedRosters.get(format);
      const positions = new Map();

      resultsEl.innerHTML = "";
      highlightedIndex = -1;
      rosterStatus.textContent = "";

      let results = [...availableSpecies.values()];
      if (format && ranked === undefined) {
        rosterStatus.textContent = `Loading ranked ${format.toLowerCase()}…`;
        return;
      }
      if (format && ranked === null) {
        rosterStatus.textContent = "Rankings unavailable. Showing the available Pokémon.";
      }
      if (ranked) {
        for (const { species, position } of ranked) {
          if (species) positions.set(species.showdownId, position);
        }
        results = ranked.flatMap(({ species }) => (species ? [species] : []));
        if (results.length < ranked.length) {
          rosterStatus.textContent = "Some ranked Pokémon are missing catalogue data.";
        }
      }

      // Apply type filter
      if (selectedTypes.size > 0) {
        results = results.filter(matchesTypeFilter);
      }

      // Apply name filter (AND with type filter)
      if (q.length > 0) {
        const showdownQuery = toShowdownId(q);
        results = results.filter(
          (species) =>
            species.name.toLowerCase().includes(q) ||
            (showdownQuery && toShowdownId(species.showdownId).includes(showdownQuery)),
        );
      }

      // Offer a short ranked list before the user enters a search.
      if (selectedTypes.size === 0 && q.length === 0) {
        if (ranked) {
          if (results.length > RANKED_PREVIEW_SIZE && !rosterStatus.textContent) {
            rosterStatus.textContent = `Top ${RANKED_PREVIEW_SIZE} · Search to see more`;
          }
          results = results.slice(0, RANKED_PREVIEW_SIZE);
        } else {
          const hint = document.createElement("div");
          hint.className = "body-md";
          hint.style.color = "var(--color-text-muted)";
          hint.style.textAlign = "center";
          hint.style.padding = "var(--space-2xl) var(--space-md)";
          hint.textContent = "Type to search Pokémon…";
          resultsEl.appendChild(hint);
          return;
        }
      }

      // No results
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

      results.forEach((species, i) => {
        const row = createSpeciesRow(species, positions.get(species.showdownId));
        if (i === 0 && highlightedIndex === -1) {
          highlightedIndex = 0;
          row.style.background = "var(--color-surface-hover)";
        }
        resultsEl.appendChild(row);
      });
    }

    async function refreshRoster(format) {
      if (rankedRosters.has(format)) return;
      rankedRosters.set(format, undefined);
      const ranked = await loadRankedRoster(format, speciesList);
      if (resolved) return;
      rankedRosters.set(format, ranked);
      let addedSpecies = false;
      for (const { species } of ranked ?? []) {
        if (species && !availableSpecies.has(species.showdownId)) {
          availableSpecies.set(species.showdownId, species);
          addedSpecies = true;
        }
      }
      if (rosterSelect.value === format || (!rosterSelect.value && addedSpecies)) {
        renderResults(input.value);
      }
    }

    rosterSelect.addEventListener("change", () => {
      const format = rosterSelect.value;
      if (rankedRosters.get(format) === null) rankedRosters.delete(format);
      renderResults(input.value);
      if (format) refreshRoster(format);
    });

    /* ── Debounced input handler ── */
    function handleInput() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderResults(input.value);
      }, 300);
    }

    input.addEventListener("input", handleInput);

    /* ── Keyboard navigation: arrows + Enter on input ── */
    input.addEventListener("keydown", (e) => {
      const rows = resultsEl.querySelectorAll('[data-testid="search-result"]');
      if (rows.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(highlightedIndex + 1, rows.length - 1);
        highlightedIndex = next;
        applyHighlight(next);
        rows[next].scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(highlightedIndex - 1, 0);
        highlightedIndex = prev;
        applyHighlight(prev);
        rows[prev].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
        if (idx < rows.length) {
          // Trigger click on the selected row to resolve
          rows[idx].click();
        }
      }
    });

    /* ── Keyboard: Escape dismisses ── */
    function onKeyDown(e) {
      if (e.key === "Tab") {
        trapTab(panel, e);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        finish(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);

    renderResults("");
    refreshRoster("Doubles");

    /* ── Append to body and focus input ── */
    document.body.appendChild(overlay);
    input.focus();
  });
}
