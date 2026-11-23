import { describe, it, expect, vi, beforeEach } from "vitest";
let fetchPokemon, fetchSprite;

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

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  ({ fetchPokemon, fetchSprite } = await import("../../js/api/pokeapi.js"));
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

    const [first, sprite] = await Promise.all([fetchPokemon("pikachu"), fetchSprite("PIKACHU")]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(sprite).toBe(mockPikachu.sprite);
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
    await fetchPokemon("nonexistent");
    expect(global.fetch).toHaveBeenCalledTimes(2);
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
