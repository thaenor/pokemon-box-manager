import { describe, it, expect, vi } from "vitest";
import { renderBoxGrid } from "../../js/ui/box-grid.js";

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
    expect(slots.length).toBe(30);
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
    expect(slots.length).toBe(30);
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
    expect(el.textContent).toContain("2/30");
  });

  it("creates correct number of slots (30)", () => {
    const pokemon = makeBoxPokemon("Pikachu", "pikachu");
    const el = renderBoxGrid([pokemon], vi.fn(), vi.fn());
    const slots = el.querySelectorAll('[data-testid="box-slot"]');
    expect(slots.length).toBe(30);
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
});
