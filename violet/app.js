import { catalogue } from "./catalogue.js";
import { changeCount, progressPrefix, readCount } from "./progress.js";

const PARTY_KEY = "violet-companion:party";
const LAST_VIEWED_KEY = "violet-companion:last-viewed";
const PARTY_LIMIT = 6;
const speciesById = new Map(catalogue.map((species) => [species.id, species]));
const byId = (id) => document.getElementById(id);
const search = byId("species-search");
const results = byId("results");
const searchRegion = byId("search-region");
const speciesName = byId("species-name");
const pin = byId("pin");

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function icon(name, className = "") {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("class", "icon " + className);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.7");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(namespace, "use");
  use.setAttribute("href", "#" + name);
  svg.append(use);
  return svg;
}

function readParty() {
  const pins = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem(PARTY_KEY));
    if (Array.isArray(saved)) {
      for (const entry of saved) {
        // Earlier versions stored only the species ID.
        const id = typeof entry === "string" ? entry : entry?.id;
        const species = speciesById.get(id);
        if (!species || pins.has(id)) continue;
        const method = species.methods.find((option) => option.title === entry.method);
        pins.set(id, method?.title ?? null);
        if (pins.size === PARTY_LIMIT) break;
      }
    }
  } catch {
    // The guide remains playable when browser storage is unavailable.
  }
  return pins;
}

function lastViewed() {
  try {
    return speciesById.get(localStorage.getItem(LAST_VIEWED_KEY));
  } catch {
    return undefined;
  }
}

let party = readParty();
let selected =
  lastViewed() ?? speciesById.get(party.keys().next().value) ?? speciesById.get("charcadet");
let addingToParty = false;

function saveParty(message) {
  try {
    const saved = Array.from(party, ([id, method]) => ({ id, method }));
    localStorage.setItem(PARTY_KEY, JSON.stringify(saved));
    announce(message);
  } catch {
    announce(message + " Your party will last for this session only.");
  }
  renderParty();
  updatePinControls();
}

function announce(message) {
  byId("status").textContent = message;
}

function progressSummary(species, counter) {
  const count = readCount(species.id, counter.goal);
  return count === counter.goal
    ? "Level up " + species.name
    : count + "/" + counter.goal + " · " + counter.label;
}

function renderCounter() {
  const counter = selected.methods[0]?.counter;
  byId("battle-counter").hidden = !counter;
  if (!counter) return;
  const count = readCount(selected.id, counter.goal);
  byId("counter-label").textContent = counter.label;
  byId("counter-count").max = String(counter.goal);
  byId("counter-count").value = String(count);
  byId("counter-goal").textContent = "of " + counter.goal;
  byId("counter-less").disabled = count === 0;
  byId("counter-more").disabled = count === counter.goal;
  byId("counter-bar").max = counter.goal;
  byId("counter-bar").value = count;
  byId("counter-hint").textContent =
    count === counter.goal
      ? "Level up " + selected.name + " next."
      : "Tap +1 or enter your current total.";
}

function refreshCounter(species) {
  if (selected.id === species.id) renderCounter();
  const nextStep = byId("party-method-" + species.id);
  if (nextStep) {
    const counter = species.methods[0].counter;
    nextStep.textContent = progressSummary(species, counter);
    byId("party-add-count-" + species.id).disabled =
      readCount(species.id, counter.goal) === counter.goal;
  }
}

async function recordProgress(species, update) {
  const counter = species.methods[0]?.counter;
  if (!counter) return;
  const { count, saved } = await changeCount(species.id, counter.goal, update);
  refreshCounter(species);
  const message = species.name + " · " + counter.label + " " + count + " of " + counter.goal + ".";
  announce(
    message +
      (count === counter.goal ? " Level up next." : "") +
      (saved ? "" : " Saved for this session only."),
  );
}

byId("counter-more").addEventListener("click", () =>
  recordProgress(selected, (count) => count + 1),
);
byId("counter-less").addEventListener("click", () =>
  recordProgress(selected, (count) => count - 1),
);
byId("counter-count").addEventListener("change", (event) => {
  const total = event.target.valueAsNumber;
  if (!Number.isSafeInteger(total) || !event.target.validity.valid) {
    renderCounter();
    announce("Enter a whole number from 0 to " + event.target.max + ".");
    return;
  }
  recordProgress(selected, () => total);
});

function portrait(species, forHero = false) {
  if (forHero && species.id === "charcadet") {
    const image = element("img", "hero-art");
    image.src = "/violet/art/charcadet.png";
    image.alt = "";
    return image;
  }

  const sprite = element("span", forHero ? "portrait hero-portrait" : "portrait party-thumb");
  sprite.setAttribute("aria-hidden", "true");
  const slot = species.number - 1;
  sprite.style.backgroundPosition =
    ((slot % 20) * 100) / 19 + "% " + (Math.floor(slot / 20) * 100) / 19 + "%";
  return sprite;
}

function orderedMethods(species) {
  return [...species.methods].sort((a, b) => Number(b.kind === "Solo") - Number(a.kind === "Solo"));
}

function updatePinControls() {
  const isPinned = party.has(selected.id);
  const isFull = !isPinned && party.size >= PARTY_LIMIT;
  pin.disabled = isFull;
  pin.setAttribute("aria-pressed", String(isPinned));
  pin.replaceChildren(
    icon(isPinned ? "check" : "pin-icon"),
    document.createTextNode(
      isPinned ? "Remove from party" : isFull ? "Party is full" : "Pin to party",
    ),
  );
  for (const button of byId("methods").querySelectorAll(".track-method")) {
    const tracking = party.get(selected.id) === button.dataset.method;
    button.disabled = isFull;
    button.setAttribute("aria-pressed", String(tracking));
    button.textContent = isFull
      ? "Party is full"
      : tracking
        ? "Tracking this method"
        : isPinned
          ? "Track this method"
          : "Pin with this method";
  }
}

function renderMethods() {
  const container = byId("methods");
  const methods = orderedMethods(selected);
  container.replaceChildren();
  byId("method-count").textContent =
    methods.length + (methods.length === 1 ? " option" : " options");
  if (!methods.length) {
    container.append(element("p", "terminal-message", "No further evolution in Pokémon Violet."));
    return;
  }

  for (const method of methods) {
    const hasDetail = Boolean(method.detail);
    const row = element(hasDetail ? "details" : "div", "method");
    if (hasDetail && party.get(selected.id) === method.title) row.open = true;
    const category = method.kind.toLowerCase();
    row.dataset.mode = category === "co-op" ? "multiplayer" : category;
    const summary = element(hasDetail ? "summary" : "div", "method-summary");
    const symbol = element("span", "method-icon");
    const symbolName =
      category === "trade"
        ? "trade"
        : category === "co-op"
          ? "team"
          : /^use /i.test(method.title)
            ? "gem"
            : "level";
    symbol.append(icon(symbolName));
    const main = element("span", "method-main");
    main.append(
      element("span", "method-kind", method.kind),
      element("span", "method-title", method.title),
    );
    summary.append(symbol, main);
    if (hasDetail) summary.append(icon("chevron", "method-chevron"));
    row.append(summary);
    if (hasDetail) row.append(element("p", "method-detail", method.detail));
    if (methods.length > 1) {
      const track = element("button", "track-method");
      track.type = "button";
      track.dataset.method = method.title;
      track.addEventListener("click", () => {
        const tracking = party.get(selected.id) === method.title;
        party.set(selected.id, tracking ? null : method.title);
        saveParty(
          tracking
            ? "Method cleared. " + selected.name + " is still pinned."
            : selected.name + " · " + method.title,
        );
      });
      row.append(track);
    }
    container.append(row);
  }
}

function renderSpecies() {
  byId("dex-number").textContent = "Paldea Nº " + String(selected.number).padStart(3, "0");
  speciesName.textContent = selected.name;
  const types = byId("types");
  types.replaceChildren();
  for (const type of selected.types) {
    const chip = element("span", "type-chip");
    chip.dataset.type = type;
    if (type.toLowerCase() === "fire") chip.append(icon("fire"));
    chip.append(document.createTextNode(type));
    types.append(chip);
  }
  const artwork = document.querySelector(".specimen-art");
  artwork.querySelector(".hero-art, .hero-portrait")?.remove();
  artwork.append(portrait(selected, true));
  renderMethods();
  renderCounter();
  updatePinControls();
}

function removePin(id) {
  party.delete(id);
  saveParty(speciesById.get(id).name + " removed from your party.");
}

function renderParty() {
  const list = byId("party");
  list.replaceChildren();
  byId("party-count").textContent = party.size + " / " + PARTY_LIMIT;
  const hint = byId("party-hint");
  hint.textContent =
    party.size === PARTY_LIMIT
      ? "Your party is full. Remove a Pokémon to make room."
      : "Pin up to six Pokémon for quick access while you play.";
  const ids = [...party.keys()];
  const visibleSlots = Math.min(party.size + 1, PARTY_LIMIT);
  for (let i = 0; i < visibleSlots; i++) {
    const species = speciesById.get(ids[i]);
    const slot = element("li", "party-slot");
    const number = element("span", "slot-number", String(i + 1).padStart(2, "0"));
    number.setAttribute("aria-hidden", "true");
    slot.append(number);
    if (species) {
      const button = element("button", "party-select");
      button.type = "button";
      const info = element("span", "party-info");
      const counter = species.methods[0]?.counter;
      const summary = counter
        ? progressSummary(species, counter)
        : (party.get(species.id) ??
          (species.methods.length > 1
            ? species.methods.length + " evolution options"
            : (species.methods[0]?.title ?? "No further evolution")));
      button.setAttribute("aria-label", "View " + species.name);
      button.setAttribute("aria-describedby", "party-method-" + species.id);
      const nextStep = element("span", "party-next", summary);
      nextStep.id = "party-method-" + species.id;
      info.append(element("span", "party-name", species.name), nextStep);
      button.append(portrait(species), info);
      button.addEventListener("click", () => selectSpecies(species));
      const remove = element("button", "party-remove");
      remove.type = "button";
      remove.setAttribute("aria-label", "Remove " + species.name + " from party");
      remove.append(icon("close"));
      remove.addEventListener("click", () => {
        removePin(species.id);
        list.children[i].querySelector("button").focus({ preventScroll: true });
      });
      slot.append(button);
      if (counter) {
        const addCount = element("button", "party-add-count", "+1");
        addCount.type = "button";
        addCount.id = "party-add-count-" + species.id;
        addCount.setAttribute("aria-label", "Add one to " + counter.label + " for " + species.name);
        addCount.disabled = readCount(species.id, counter.goal) === counter.goal;
        addCount.addEventListener("click", () => recordProgress(species, (count) => count + 1));
        slot.append(addCount);
      }
      slot.append(remove);
    } else {
      const add = element("button", "empty-slot");
      add.type = "button";
      add.setAttribute("aria-label", "Add Pokémon to party");
      add.append(icon("plus"), document.createTextNode("Add Pokémon"));
      add.addEventListener("click", () => {
        search.value = "";
        addingToParty = true;
        search.placeholder = "Find a Pokémon to pin";
        search.focus();
        renderResults();
      });
      slot.append(add);
    }
    list.append(slot);
  }
}

pin.addEventListener("click", () => {
  if (party.has(selected.id)) {
    removePin(selected.id);
  } else if (party.size < PARTY_LIMIT) {
    party.set(selected.id, null);
    saveParty(selected.name + " pinned to your party.");
  }
});

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const names = catalogue.map((species) => ({ species, term: normalize(species.name) }));
const suggestions = ["charcadet", "sprigatito", "fuecoco", "quaxly", "eevee", "pawmi"]
  .map((id) => speciesById.get(id))
  .filter(Boolean);

function matches(value) {
  const term = normalize(value);
  if (!value.trim()) return suggestions;
  if (!term) return [];
  if (/^\d+$/.test(term)) {
    return catalogue.filter((entry) => entry.number === Number(term));
  }
  const found = names.filter(({ term: name }) => name.includes(term));
  found.sort(
    (a, b) =>
      Number(b.term === term) - Number(a.term === term) ||
      Number(b.term.startsWith(term)) - Number(a.term.startsWith(term)),
  );
  return found.map((item) => item.species);
}

function closeSearch() {
  results.hidden = true;
  addingToParty = false;
  search.placeholder = "Search Pokémon or dex number";
}

function selectSpecies(species) {
  if (addingToParty && !party.has(species.id) && party.size < PARTY_LIMIT) {
    party.set(species.id, null);
    saveParty(species.name + " pinned to your party.");
  }
  closeSearch();
  search.value = "";
  updateSearchTools();
  selected = species;
  try {
    localStorage.setItem(LAST_VIEWED_KEY, species.id);
  } catch {
    // Selection still works in browsers with storage disabled.
  }
  renderSpecies();
  speciesName.focus({ preventScroll: true });
  if (speciesName.getBoundingClientRect().bottom < 0) {
    speciesName.scrollIntoView({ block: "center" });
  }
}

function updateSearchTools() {
  byId("clear-search").hidden = !search.value;
  searchRegion.querySelector(".search-key").hidden = Boolean(search.value);
}

function renderResults() {
  const found = matches(search.value).filter((item) => !addingToParty || !party.has(item.id));
  const rows = document.createDocumentFragment();
  for (const species of found) {
    const row = element("li");
    const button = element("button", "result-option");
    button.type = "button";
    button.setAttribute("aria-label", species.name);
    button.append(
      element("span", "result-number", "#" + String(species.number).padStart(3, "0")),
      document.createTextNode(species.name),
      element("span", "result-type", species.types.join(" / ")),
    );
    button.addEventListener("click", () => selectSpecies(species));
    row.append(button);
    rows.append(row);
  }
  if (!found.length)
    rows.append(
      element(
        "li",
        "search-empty",
        addingToParty
          ? "No unpinned matches. Try another name."
          : "No matching Pokémon in the Paldea Pokédex.",
      ),
    );
  results.replaceChildren(rows);
  results.hidden = false;
  updateSearchTools();
  if (search.value.trim()) announce(found.length + (found.length === 1 ? " match." : " matches."));
}

search.addEventListener("focus", renderResults);
search.addEventListener("click", renderResults);
search.addEventListener("input", renderResults);
byId("clear-search").addEventListener("click", () => {
  search.value = "";
  search.focus();
  renderResults();
});

searchRegion.addEventListener("keydown", (event) => {
  if (event.isComposing) return;
  if (event.key === "Escape") {
    event.preventDefault();
    search.focus();
    closeSearch();
    return;
  }
  if (event.key === "Enter" && event.target === search) {
    event.preventDefault();
    if (results.hidden) renderResults();
    results.querySelector("button")?.click();
    return;
  }
  if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
  event.preventDefault();
  if (results.hidden) renderResults();
  const buttons = [...results.querySelectorAll("button")];
  if (!buttons.length) return;
  const index = buttons.indexOf(document.activeElement);
  if (index === 0 && event.key === "ArrowUp") {
    search.focus();
  } else {
    const next =
      event.key === "ArrowDown"
        ? Math.min(index + 1, buttons.length - 1)
        : index < 0
          ? buttons.length - 1
          : index - 1;
    buttons[next].focus();
  }
});

searchRegion.addEventListener("focusout", (event) => {
  if (event.relatedTarget && !searchRegion.contains(event.relatedTarget)) closeSearch();
});
document.addEventListener("pointerdown", (event) => {
  if (!searchRegion.contains(event.target)) closeSearch();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    event.target !== search
  ) {
    event.preventDefault();
    search.focus();
  }
});
window.addEventListener("storage", (event) => {
  if (event.key?.startsWith(progressPrefix)) {
    const species = speciesById.get(event.key.slice(progressPrefix.length));
    if (species?.methods[0]?.counter) refreshCounter(species);
    return;
  }
  if (event.key !== PARTY_KEY && event.key !== null) return;
  if (event.key === null) renderCounter();
  party = readParty();
  updatePinControls();
  renderParty();
});

renderSpecies();
renderParty();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
