import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock ALL module imports to prevent side effects (DOMContentLoaded, IIFE)
vi.mock("../../js/ui/box-grid.js", () => ({
  renderBoxGrid: vi.fn(() => document.createElement("div")),
}));
vi.mock("../../js/ui/species-search.js", () => ({
  showSpeciesSearch: vi.fn(),
}));
vi.mock("../../js/ui/pokemon-detail.js", () => ({
  showPokemonDetail: vi.fn(),
}));
vi.mock("../../js/data/species-list.js", () => ({
  speciesList: [],
}));
vi.mock("../../js/api/pokeapi.js", () => ({
  fetchPokemon: vi.fn(),
}));

// Re-import localStorage from happy-dom (it's auto-injected by the environment)
beforeEach(() => {
  localStorage.clear();
});

// Import the module AFTER mocks are set up
const mod = await import("../../js/app.js");
const { sanitizePokemon, saveBox, loadBox, STORAGE_KEY } = mod;

describe("sanitizePokemon", () => {
  it("strips unknown fields, preserves known ones", () => {
    const input = {
      species: { name: "Pikachu", showdownId: "pikachu" },
      nickname: "Sparky",
      isShiny: true,
      nature: "Adamant",
      ability: "Static",
      stats: [{ name: "hp", value: 35 }],
      recruitedDate: "2025-01-01",
      extraField: "should be dropped",
    };
    const result = sanitizePokemon(input);
    expect(result).not.toBeNull();
    expect(result.species).toEqual({ name: "Pikachu", showdownId: "pikachu" });
    expect(result.nickname).toBe("Sparky");
    expect(result.isShiny).toBe(true);
    expect(result.extraField).toBeUndefined();
  });

  it("returns null for non-object / null input", () => {
    expect(sanitizePokemon(null)).toBeNull();
    expect(sanitizePokemon(undefined)).toBeNull();
    expect(sanitizePokemon("string")).toBeNull();
    expect(sanitizePokemon(42)).toBeNull();
  });

  it("returns null without species", () => {
    expect(sanitizePokemon({ nickname: "Test" })).toBeNull();
  });

  it("defaults nickname to empty string, isShiny to false, nature to Serious", () => {
    const result = sanitizePokemon({ species: { name: "Charizard" } });
    expect(result.nickname).toBe("");
    expect(result.isShiny).toBe(false);
    expect(result.nature).toBe("Serious");
  });

  it("defaults ability to empty string, stats to empty array", () => {
    const result = sanitizePokemon({ species: { name: "Charizard" } });
    expect(result.ability).toBe("");
    expect(result.stats).toEqual([]);
  });

  it("defaults recruitedDate to today's date", () => {
    const today = new Date().toISOString().split("T")[0];
    const result = sanitizePokemon({ species: { name: "Charizard" } });
    expect(result.recruitedDate).toBe(today);
  });
});

describe("saveBox / loadBox", () => {
  it("saveBox serializes to localStorage with correct key", () => {
    const spy = vi.spyOn(localStorage, "setItem");
    saveBox();
    expect(spy).toHaveBeenCalled();
  });

  it("loadBox returns clean array of 30 nulls when localStorage empty", () => {
    localStorage.clear();
    const result = loadBox();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(30);
    expect(result.every((s) => s === null)).toBe(true);
  });

  it("loadBox parses stored JSON and sanitizes each slot", () => {
    const stored = [
      {
        species: { name: "Pikachu", showdownId: "pikachu" },
        nickname: "Chu",
        isShiny: false,
        nature: "Timid",
        ability: "Static",
        stats: [],
        recruitedDate: "2025-01-01",
      },
      null,
      {
        species: { name: "Charizard", showdownId: "charizard" },
        isShiny: true,
        nature: "Adamant",
        ability: "Blaze",
        stats: [],
        recruitedDate: "2025-01-01",
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const result = loadBox();
    expect(result).toHaveLength(30);
    expect(result[0].species.name).toBe("Pikachu");
    expect(result[0].nickname).toBe("Chu");
    expect(result[2].species.name).toBe("Charizard");
    expect(result[2].isShiny).toBe(true);
    expect(result[3]).toBeNull();
  });

  it("loadBox handles corrupt JSON gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json{{{");
    const result = loadBox();
    expect(result).toHaveLength(30);
    expect(result.every((s) => s === null)).toBe(true);
  });

  it("loadBox returns empty array when stored value is not an array", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notAnArray: true }));
    const result = loadBox();
    expect(result).toHaveLength(30);
    expect(result.every((s) => s === null)).toBe(true);
  });
});
