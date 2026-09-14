import { describe, it, expect, vi, afterEach } from "vitest";
import { renderBoxGrid, showImportDialog } from "../../js/ui/box-grid.js";

function makeBoxPokemon(name, showdownId, types = ["Normal"]) {
  return {
    species: { name, showdownId, types },
    showdownId,
    nickname: "",
    sprite: `https://example.com/${showdownId}.png`,
    spriteShiny: `https://example.com/${showdownId}-shiny.png`,
    isShiny: false,
    stats: [{ name: "hp", value: 100 }],
    ability: "",
    nature: "Serious",
    recruitedDate: "2025-01-01",
  };
}

describe("renderBoxGrid", () => {
  it("renders empty state when box is empty", () => {
    const el = renderBoxGrid([], vi.fn(), vi.fn());
    expect(el.className).toBe("two-pane");
    expect(el.textContent).toContain("Your box is empty");
    expect(el.textContent).toContain("Tap an empty slot to add a Pokémon");
  });

  it("empty state shows 'Your box is empty' text and guidance", () => {
    const el = renderBoxGrid([], vi.fn(), vi.fn());
    expect(el.innerHTML).toContain("Your box is empty");
    expect(el.innerHTML).toContain("Tap an empty slot to add a Pokémon");
    expect(el.innerHTML).not.toContain("+ Add Pokémon");
  });

  it("rendered slots have data-testid='box-slot'", () => {
    const box = [makeBoxPokemon("Pikachu", "pikachu")];
    const el = renderBoxGrid(box, vi.fn(), vi.fn());
    const slots = el.querySelectorAll('[data-testid="box-slot"]');
    expect(slots.length).toBe(40);
  });

  it("filled slots show species name and sprite", () => {
    const box = [makeBoxPokemon("Pikachu", "pikachu", ["Electric"])];
    const el = renderBoxGrid(box, vi.fn(), vi.fn());
    const slots = el.querySelectorAll('[data-testid="box-slot"]');
    expect(slots[0].textContent).toContain("Pikachu");
    const img = slots[0].querySelector("img");
    expect(img).not.toBeNull();
    expect(img.src).toContain("pikachu");
  });

  it("clicking empty slot calls onAddPokemon with index", () => {
    const onAdd = vi.fn();
    const pokemon = makeBoxPokemon("Pikachu", "pikachu");
    const el = renderBoxGrid([pokemon, null], onAdd, vi.fn());
    const slots = el.querySelectorAll('[data-testid="box-slot"]');
    expect(slots.length).toBe(40);
    slots[1].click();
    expect(onAdd).toHaveBeenCalledWith(1);
  });

  it("filled slot calls onSelectPokemon", () => {
    const pokemon = makeBoxPokemon("Pikachu", "pikachu");
    const onSelect = vi.fn();
    const el = renderBoxGrid([pokemon], vi.fn(), onSelect, 1);
    const slots = el.querySelectorAll('[data-testid="box-slot"]');
    slots[0].click();
    expect(onSelect).toHaveBeenCalledWith(pokemon, 0);
  });

  it("nav header shows filled/total capacity", () => {
    const box = [
      makeBoxPokemon("Pikachu", "pikachu"),
      null,
      makeBoxPokemon("Charizard", "charizard"),
    ];
    const el = renderBoxGrid(box, vi.fn(), vi.fn());
    expect(el.textContent).toContain("2/40");
  });

  it("creates correct number of slots (40)", () => {
    const pokemon = makeBoxPokemon("Pikachu", "pikachu");
    const el = renderBoxGrid([pokemon], vi.fn(), vi.fn());
    const slots = el.querySelectorAll('[data-testid="box-slot"]');
    expect(slots.length).toBe(40);
  });

  it("renders grid size dropdown with 30/35/40 options", () => {
    const el = renderBoxGrid([], vi.fn(), vi.fn(), 35, undefined, vi.fn());
    const select = el.querySelector("select");
    expect(select).not.toBeNull();
    expect(select.getAttribute("aria-label")).toBe("Grid size");
    const options = select.querySelectorAll("option");
    expect(options.length).toBe(3);
    expect(options[0].textContent).toContain("30");
    expect(options[1].textContent).toContain("35");
    expect(options[2].textContent).toContain("40");
    // Verify the second option is selected (boxSize=35)
    expect(options[1].selected).toBe(true);
  });

  it("changing dropdown value calls onBoxSizeChange", () => {
    const onBoxSizeChange = vi.fn();
    const el = renderBoxGrid([], vi.fn(), vi.fn(), 30, undefined, onBoxSizeChange);
    const select = el.querySelector("select");
    select.value = "40";
    select.dispatchEvent(new Event("change"));
    expect(onBoxSizeChange).toHaveBeenCalledWith(40);
  });

  it("renders Import button alongside Export", () => {
    const el = renderBoxGrid([], vi.fn(), vi.fn());
    expect(el.textContent).toContain("Import");
    expect(el.textContent).toContain("Export");
  });
});

describe("showImportDialog", () => {
  function findDialog() {
    return document.querySelector(".overlay");
  }

  function findTextarea() {
    const dlg = findDialog();
    if (!dlg) return null;
    return dlg.querySelector("textarea");
  }

  function findImportBtn() {
    const dlg = findDialog();
    if (!dlg) return null;
    return Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent.trim() === "Import",
    );
  }

  function findError() {
    const dlg = findDialog();
    if (!dlg) return null;
    return dlg.querySelector(".import-error");
  }

  afterEach(() => {
    // Clean up any leftover overlays from the previous test
    document.querySelectorAll(".overlay").forEach((el) => el.remove());
  });

  it("opens a modal with textarea and buttons", () => {
    showImportDialog(vi.fn());
    const dlg = findDialog();
    expect(dlg).not.toBeNull();
    expect(findTextarea()).not.toBeNull();
    expect(findImportBtn()).not.toBeNull();
    expect(dlg.textContent).toContain("Cancel");
    expect(dlg.textContent).toContain("Import Box (JSON)");
  });

  it("shows error when textarea is empty", () => {
    showImportDialog(vi.fn());
    findImportBtn().click();
    const error = findError();
    expect(error.textContent).toContain("Paste JSON data first");
  });

  it("shows error for invalid JSON", () => {
    showImportDialog(vi.fn());
    findTextarea().value = "not json";
    findImportBtn().click();
    const error = findError();
    expect(error.textContent).toContain("Invalid JSON");
  });

  it("shows error for non-array JSON", () => {
    showImportDialog(vi.fn());
    findTextarea().value = '{"species":{"name":"Pikachu"}}';
    findImportBtn().click();
    const error = findError();
    expect(error.textContent).toContain("Expected a JSON array");
  });

  it("shows error for entry with no species field", () => {
    showImportDialog(vi.fn());
    findTextarea().value = '[{"nickname":"Test"}]';
    findImportBtn().click();
    const error = findError();
    expect(error.textContent).toContain("no species field");
    expect(error.textContent).toContain("index 0");
  });

  it("shows error for unknown species", () => {
    showImportDialog(vi.fn());
    findTextarea().value = '[{"species":{"name":"MissingNo"}}]';
    findImportBtn().click();
    const error = findError();
    expect(error.textContent).toContain("Unknown species");
    expect(error.textContent).toContain("MissingNo");
    expect(error.textContent).toContain("index 0");
  });

  it("calls onImport with resolved data for valid JSON", () => {
    const onImport = vi.fn();
    showImportDialog(onImport);
    findTextarea().value =
      '[{"species":{"name":"Charizard","showdownId":"charizard"},"nickname":"Zippo"}]';
    findImportBtn().click();
    expect(onImport).toHaveBeenCalledTimes(1);
    const data = onImport.mock.calls[0][0];
    expect(data).toHaveLength(1);
    expect(data[0].nickname).toBe("Zippo");
    expect(data[0].species.showdownId).toBe("charizard");
    expect(data[0].species.types).toBeDefined(); // resolved from speciesList
  });

  it("closes dialog after successful import", () => {
    const onImport = vi.fn();
    showImportDialog(onImport);
    findTextarea().value = '[{"species":{"showdownId":"charizard"}}]';
    findImportBtn().click();
    expect(findDialog()).toBeNull();
  });

  it("shows error when onImport is not a function", () => {
    showImportDialog(undefined);
    findTextarea().value = '[{"species":{"showdownId":"charizard"}}]';
    findImportBtn().click();
    const error = findError();
    expect(error.textContent).toContain("Import handler not available");
  });

  it("resolves species by showdowndId (case-insensitive)", () => {
    const onImport = vi.fn();
    showImportDialog(onImport);
    findTextarea().value = '[{"species":{"showdownId":"CHARIZARD"}}]';
    findImportBtn().click();
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onImport.mock.calls[0][0][0].species.showdownId).toBe("charizard");
  });

  it("ignores extra unknown fields in JSON", () => {
    const onImport = vi.fn();
    showImportDialog(onImport);
    findTextarea().value =
      '[{"species":{"showdownId":"charizard"},"extraField":"should be kept","unknownField":42}]';
    findImportBtn().click();
    expect(onImport).toHaveBeenCalledTimes(1);
    const data = onImport.mock.calls[0][0][0];
    expect(data.extraField).toBe("should be kept");
    expect(data.unknownField).toBe(42);
  });

  it("shows error for empty array", () => {
    showImportDialog(vi.fn());
    findTextarea().value = "[]";
    findImportBtn().click();
    const error = findError();
    expect(error.textContent).toContain("No valid Pokémon entries found");
  });

  it("closes on Escape key", () => {
    showImportDialog(vi.fn());
    expect(findDialog()).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(findDialog()).toBeNull();
  });

  it("closes on backdrop click", () => {
    showImportDialog(vi.fn());
    expect(findDialog()).not.toBeNull();
    const overlay = findDialog();
    overlay.click(); // click on overlay itself (not a child)
    expect(findDialog()).toBeNull();
  });
});
