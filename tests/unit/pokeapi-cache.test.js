import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchPokemon, fetchSprite } from "../../js/api/pokeapi.js";

const mockPikachu = {
  sprite: "https://example.com/pikachu.png",
  spriteShiny: "https://example.com/pikachu-shiny.png",
  stats: [
    { name: "hp", value: 35 },
    { name: "speed", value: 90 },
  ],
  types: ["Electric"],
  abilities: ["static", "lightning-rod"],
  speciesName: "pikachu",
};

beforeEach(() => {
  // Reset localStorage
  localStorage.clear();
  // Clear in-memory cache by importing a fresh perspective — we'll handle via vi.resetModules
});

describe("in-memory cache", () => {
  it("returns cached result on second call without network", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          sprites: { front_default: mockPikachu.sprite, front_shiny: mockPikachu.spriteShiny },
          stats: mockPikachu.stats.map((s) => ({ stat: { name: s.name }, base_stat: s.value })),
          types: mockPikachu.types.map((t) => ({ type: { name: t } })),
          abilities: mockPikachu.abilities.map((a) => ({ ability: { name: a } })),
          species: { name: mockPikachu.speciesName },
        }),
    });

    // First call hits network
    const first = await fetchPokemon("pikachu");
    expect(first).not.toBeNull();
    expect(first.sprite).toBe(mockPikachu.sprite);

    // Second call should hit in-memory cache — no fetch
    global.fetch.mockClear();
    const second = await fetchPokemon("pikachu");
    expect(second).not.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("localStorage cache", () => {
  it("reads from localStorage on cold in-memory cache", async () => {
    // Seed localStorage
    const cacheData = {};
    cacheData["pikachu"] = mockPikachu;
    localStorage.setItem("pokemon-box:cache", JSON.stringify(cacheData));

    // In-memory cache is empty — fetchPokemon should read from localStorage without network
    global.fetch = vi.fn();
    const result = await fetchPokemon("pikachu");
    expect(result).toEqual(mockPikachu);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns null when species is not in localStorage and not on network", async () => {
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await fetchPokemon("nonexistent");
    expect(result).toBeNull();
  });
});

describe("fetchSprite", () => {
  it("returns sprite from cache without network call", async () => {
    const cacheData = {};
    cacheData["charizard"] = {
      ...mockPikachu,
      sprite: "https://example.com/charizard.png",
      speciesName: "charizard",
    };
    localStorage.setItem("pokemon-box:cache", JSON.stringify(cacheData));

    global.fetch = vi.fn();
    const result = await fetchSprite("charizard");
    expect(result).toBe("https://example.com/charizard.png");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
