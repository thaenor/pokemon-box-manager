import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSpecies = [
  {
    name: "Pikachu",
    showdownId: "pikachu",
    types: ["Electric"],
    spriteUrl: "https://example.com/pikachu.png",
  },
  {
    name: "Charizard",
    showdownId: "charizard",
    types: ["Fire", "Flying"],
    spriteUrl: "https://example.com/charizard.png",
  },
  {
    name: "Mewtwo",
    showdownId: "mewtwo",
    types: ["Psychic"],
    spriteUrl: "https://example.com/mewtwo.png",
  },
];

vi.mock("../../js/data/species-list.js", () => ({
  speciesList: mockSpecies,
}));

let showSpeciesSearch;

beforeEach(async () => {
  vi.useFakeTimers();
  const mod = await import("../../js/ui/species-search.js");
  showSpeciesSearch = mod.showSpeciesSearch;
});

afterEach(() => {
  vi.useRealTimers();
  // Remove any overlays left in the DOM
  document.querySelectorAll(".overlay").forEach((el) => el.remove());
});

describe("showSpeciesSearch", () => {
  it("renders overlay with search input", async () => {
    const promise = showSpeciesSearch();
    // Let microtasks flush (the promise constructor is sync, but append is in it)
    await vi.runAllTimersAsync();

    const overlay = document.querySelector('[data-testid="species-search"]');
    expect(overlay).not.toBeNull();
    const input = document.querySelector('[data-testid="search-input"]');
    expect(input).not.toBeNull();
    expect(input.placeholder).toContain("Search");

    // Cleanup: dismiss
    const cancelBtn = overlay.querySelector(".btn-secondary");
    cancelBtn.click();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeNull();
  });

  it("typing filters species list", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const input = document.querySelector('[data-testid="search-input"]');
    input.value = "Char";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(350);
    // After debounce, results should show Charizard
    const results = document.querySelectorAll('[data-testid="search-result"]');
    expect(results.length).toBe(1);
    expect(results[0].textContent).toContain("Charizard");

    // Cleanup
    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it('shows "No Pokémon found" for non-matching query', async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const input = document.querySelector('[data-testid="search-input"]');
    input.value = "zzznotexist";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(350);

    expect(document.body.textContent).toContain("No Pokémon found");

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it("shows hint when query is empty", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    expect(document.body.textContent).toContain("Type to search Pokémon");

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it("clicking result resolves promise with species", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const input = document.querySelector('[data-testid="search-input"]');
    input.value = "Pikachu";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(350);

    const results = document.querySelectorAll('[data-testid="search-result"]');
    results[0].click();

    const species = await promise;
    expect(species).not.toBeNull();
    expect(species.name).toBe("Pikachu");
  });

  it("clicking cancel resolves null", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    const result = await promise;
    expect(result).toBeNull();
  });

  it("Escape key resolves null", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    const result = await promise;
    expect(result).toBeNull();
  });

  it("backdrop click resolves null", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const overlay = document.querySelector('[data-testid="species-search"]');
    overlay.click();
    const result = await promise;
    expect(result).toBeNull();
  });
});
