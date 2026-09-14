import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockPokeData = {
  sprite: "https://example.com/pikachu.png",
  spriteShiny: "https://example.com/pikachu-shiny.png",
  stats: [
    { name: "hp", value: 35 },
    { name: "attack", value: 55 },
    { name: "defense", value: 40 },
    { name: "special-attack", value: 50 },
    { name: "special-defense", value: 50 },
    { name: "speed", value: 90 },
  ],
  types: ["Electric"],
  abilities: ["static", "lightning-rod"],
  speciesName: "pikachu",
};

vi.mock("../../js/api/pokeapi.js", () => ({
  fetchPokemon: vi.fn().mockResolvedValue(mockPokeData),
}));

let showPokemonDetail;

beforeEach(async () => {
  // Reset mock state
  vi.clearAllMocks();
  const mod = await import("../../js/ui/pokemon-detail.js");
  showPokemonDetail = mod.showPokemonDetail;
});

afterEach(() => {
  document.querySelectorAll(".overlay").forEach((el) => el.remove());
});

describe("showPokemonDetail", () => {
  const species = {
    name: "Pikachu",
    showdownId: "pikachu",
    types: ["Electric"],
    spriteUrl: "https://example.com/pikachu.png",
  };

  it("renders header with species name and sprite", async () => {
    const promise = showPokemonDetail(species);
    // Await the async function
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain("Pikachu");
    });

    // Save to clean up
    const saveBtn = document.querySelector(".btn-primary");
    saveBtn.click();
    await expect(promise).resolves.not.toBeNull();
  });

  it("renders shiny checkbox, defaults unchecked for new pokemon", async () => {
    const promise = showPokemonDetail(species);
    await vi.waitFor(() => {
      expect(document.querySelector("#detail-shiny")).not.toBeNull();
    });

    const checkbox = document.querySelector("#detail-shiny");
    expect(checkbox.checked).toBe(false);

    // Save to clean up
    const saveBtn = document.querySelector(".btn-primary");
    saveBtn.click();
    await promise;
  });

  it("renders base stats for all 6 stats", async () => {
    const promise = showPokemonDetail(species);
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain("HP");
      expect(document.body.textContent).toContain("Attack");
      expect(document.body.textContent).toContain("Defense");
      expect(document.body.textContent).toContain("Sp. Atk");
      expect(document.body.textContent).toContain("Sp. Def");
      expect(document.body.textContent).toContain("Speed");
    });

    // Save to clean up
    const saveBtn = document.querySelector(".btn-primary");
    saveBtn.click();
    await promise;
  });

  it("renders ability select with options from API data", async () => {
    const promise = showPokemonDetail(species);
    await vi.waitFor(() => {
      expect(document.querySelector("#detail-ability")).not.toBeNull();
    });

    const select = document.querySelector("#detail-ability");
    expect(select.options.length).toBe(2);
    expect(select.options[0].textContent).toContain("Static");

    // Save to clean up
    const saveBtn = document.querySelector(".btn-primary");
    saveBtn.click();
    await promise;
  });

  it("renders nature select with all 25 natures", async () => {
    const promise = showPokemonDetail(species);
    await vi.waitFor(() => {
      expect(document.querySelector("#detail-nature")).not.toBeNull();
    });

    const select = document.querySelector("#detail-nature");
    // 25 natures
    expect(select.options.length).toBe(25);
    expect(select.options[0].value).toBe("Hardy");

    // Save to clean up
    const saveBtn = document.querySelector(".btn-primary");
    saveBtn.click();
    await promise;
  });

  it("nickname input defaults to empty for new pokemon", async () => {
    const promise = showPokemonDetail(species);
    await vi.waitFor(() => {
      expect(document.querySelector("#detail-nickname")).not.toBeNull();
    });

    const input = document.querySelector("#detail-nickname");
    expect(input.value).toBe("");

    // Save to clean up
    const saveBtn = document.querySelector(".btn-primary");
    saveBtn.click();
    await promise;
  });

  it("save button collects form data and resolves with {action,save}", async () => {
    const promise = showPokemonDetail(species);
    await vi.waitFor(() => {
      expect(document.querySelector(".btn-primary")).not.toBeNull();
    });

    // Set some form values
    document.querySelector("#detail-nickname").value = "Sparky";
    document.querySelector("#detail-ability").value = "lightning-rod";
    document.querySelector("#detail-nature").value = "Timid";

    const saveBtn = document.querySelector(".btn-primary");
    saveBtn.click();
    const result = await promise;
    expect(result).not.toBeNull();
    expect(result.action).toBe("save");
    expect(result.pokemon.nickname).toBe("Sparky");
    expect(result.pokemon.ability).toBe("lightning-rod");
    expect(result.pokemon.nature).toBe("Timid");
    expect(result.pokemon.species).toBe(species);
    expect(result.pokemon.isShiny).toBe(false);
  });

  it("cancel button resolves null", async () => {
    const promise = showPokemonDetail(species);
    await vi.waitFor(() => {
      const btns = document.querySelectorAll("button");
      const cancelBtn = Array.from(btns).find((b) => b.textContent === "Cancel");
      expect(cancelBtn).not.toBeNull();
    });

    const btns = document.querySelectorAll("button");
    const cancelBtn = Array.from(btns).find((b) => b.textContent === "Cancel");
    cancelBtn.click();
    const result = await promise;
    expect(result).toBeNull();
  });

  it("loading error (fetch returns null) shows error state", async () => {
    // Override mock for this test
    const mockFetchPokemon = (await import("../../js/api/pokeapi.js")).fetchPokemon;
    mockFetchPokemon.mockResolvedValue(null);

    const championSpecies = {
      name: "Mega Golisopod",
      showdownId: "golisopod-mega",
      types: ["Bug", "Water"],
    };
    const promise = showPokemonDetail(championSpecies);
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain("Couldn't fetch data");
    });

    // Close button should resolve null
    const btns = document.querySelectorAll("button");
    const closeBtn = Array.from(btns).find((b) => b.textContent === "Close");
    closeBtn.click();
    const result = await promise;
    expect(result).toBeNull();
  });
});
