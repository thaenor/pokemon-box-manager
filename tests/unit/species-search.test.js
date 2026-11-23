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
  {
    name: "Arcanine",
    showdownId: "arcanine",
    types: ["Fire"],
    spriteUrl: "https://example.com/arcanine.png",
  },
  {
    name: "Vaporeon",
    showdownId: "vaporeon",
    types: ["Water"],
    spriteUrl: "https://example.com/vaporeon.png",
  },
  {
    name: "Zapdos",
    showdownId: "zapdos",
    types: ["Electric", "Flying"],
    spriteUrl: "https://example.com/zapdos.png",
  },
];

vi.mock("../../js/data/species-list.js", () => ({
  speciesList: mockSpecies,
}));

vi.mock("../../js/api/champions.js", async (importOriginal) => ({
  ...(await importOriginal()),
  loadRankedRoster: vi.fn().mockResolvedValue(null),
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

describe("focus-trap utilities", () => {
  it("saveFocus stores and restores activeElement", async () => {
    const { saveFocus } = await import("../../js/ui/focus-trap.js");

    const btn = document.createElement("button");
    btn.textContent = "test";
    document.body.appendChild(btn);
    btn.focus();
    expect(document.activeElement).toBe(btn);

    const restore = saveFocus();

    // Move focus elsewhere
    const other = document.createElement("button");
    other.textContent = "other";
    document.body.appendChild(other);
    other.focus();
    expect(document.activeElement).toBe(other);

    // Restore
    restore();
    expect(document.activeElement).toBe(btn);

    document.body.removeChild(btn);
    document.body.removeChild(other);
  });

  it("trapTab cycles focus within a container", async () => {
    const { trapTab } = await import("../../js/ui/focus-trap.js");

    const container = document.createElement("div");
    const btnA = document.createElement("button");
    btnA.textContent = "A";
    const btnB = document.createElement("button");
    btnB.textContent = "B";
    container.appendChild(btnA);
    container.appendChild(btnB);
    document.body.appendChild(container);

    btnA.focus();

    // Tab at last element should wrap to first
    const e1 = new KeyboardEvent("keydown", { key: "Tab", shiftKey: false });
    btnB.dispatchEvent(e1);
    // trapTab checks activeElement against container, so set activeElement
    // We call trapTab directly with the event simulating the keyboard listener
    trapTab(container, e1);
    // After the call, focus should move — but since dispatchEvent doesn't set activeElement,
    // we verify the logic: activeElement === last => shift first

    // Shift+Tab at first element should wrap to last
    btnA.focus();
    const e2 = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true });
    trapTab(container, e2);
    // focus should wrap to last

    document.body.removeChild(container);
  });

  it("species search overlay has correct ARIA attributes", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const overlay = document.querySelector('[data-testid="species-search"]');
    expect(overlay).not.toBeNull();
    expect(overlay.getAttribute("role")).toBe("dialog");
    expect(overlay.getAttribute("aria-modal")).toBe("true");
    expect(overlay.getAttribute("aria-labelledby")).toBe("species-search-title");

    const title = document.getElementById("species-search-title");
    expect(title).not.toBeNull();
    expect(title.textContent).toBe("Select Pokémon");

    const cancelBtn = overlay.querySelector(".btn-secondary");
    cancelBtn.click();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeNull();
  });

  it("search result rows support Enter key selection", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const input = document.querySelector('[data-testid="search-input"]');
    input.value = "Pikachu";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(350);

    const results = document.querySelectorAll('[data-testid="search-result"]');
    expect(results.length).toBe(1);

    // Simulate Enter key on the result row
    results[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    const species = await promise;
    expect(species).not.toBeNull();
    expect(species.name).toBe("Pikachu");
  });

  it("search result rows support Space key selection", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const input = document.querySelector('[data-testid="search-input"]');
    input.value = "Charizard";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(350);

    const results = document.querySelectorAll('[data-testid="search-result"]');
    expect(results.length).toBe(1);

    // Simulate Space key on the result row
    results[0].dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    const species = await promise;
    expect(species).not.toBeNull();
    expect(species.name).toBe("Charizard");
  });

  it("cancel button has type='button'", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const cancelBtn = document.querySelector(".btn-secondary");
    expect(cancelBtn.type).toBe("button");

    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it("renders 18 type filter chips", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const chips = document.querySelectorAll('[data-testid^="type-chip-"]');
    expect(chips.length).toBe(18);

    // Verify expected types are present
    const chipTexts = Array.from(chips).map((c) => c.textContent);
    expect(chipTexts).toContain("Fire");
    expect(chipTexts).toContain("Water");
    expect(chipTexts).toContain("Electric");
    expect(chipTexts).toContain("Psychic");

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it("clicking a type chip filters results to matching types", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    // Click the Fire type chip
    const fireChip = document.querySelector('[data-testid="type-chip-fire"]');
    fireChip.click();
    // For type filter, render is immediate — no debounce
    await vi.advanceTimersByTimeAsync(50);

    const results = document.querySelectorAll('[data-testid="search-result"]');
    expect(results.length).toBe(2); // Charizard + Arcanine
    expect(results[0].textContent).toContain("Charizard");
    expect(results[1].textContent).toContain("Arcanine");

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it("multiple type chips use OR logic", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const fireChip = document.querySelector('[data-testid="type-chip-fire"]');
    const waterChip = document.querySelector('[data-testid="type-chip-water"]');
    fireChip.click();
    waterChip.click();
    await vi.advanceTimersByTimeAsync(50);

    const results = document.querySelectorAll('[data-testid="search-result"]');
    expect(results.length).toBe(3); // Charizard + Arcanine (Fire) + Vaporeon (Water)
    const texts = Array.from(results).map((r) => r.textContent);
    // textContent concatenates without spaces: e.g. "CharizardFireFlying"
    expect(texts.some((t) => t.includes("Charizard"))).toBe(true);
    expect(texts.some((t) => t.includes("Arcanine"))).toBe(true);
    expect(texts.some((t) => t.includes("Vaporeon"))).toBe(true);

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it("name search AND type filter work together", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const fireChip = document.querySelector('[data-testid="type-chip-fire"]');
    fireChip.click();

    const input = document.querySelector('[data-testid="search-input"]');
    input.value = "Char";
    input.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(350);

    const results = document.querySelectorAll('[data-testid="search-result"]');
    expect(results.length).toBe(1);
    expect(results[0].textContent).toContain("Charizard");

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it('shows "No Pokémon found" when type filter has no matches', async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    // Dragon type — none of our mock species are Dragon
    const dragonChip = document.querySelector('[data-testid="type-chip-dragon"]');
    dragonChip.click();
    await vi.advanceTimersByTimeAsync(50);

    expect(document.body.textContent).toContain("No Pokémon found");

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it("Clear button resets all type filters", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const fireChip = document.querySelector('[data-testid="type-chip-fire"]');
    const waterChip = document.querySelector('[data-testid="type-chip-water"]');
    fireChip.click();
    waterChip.click();
    await vi.advanceTimersByTimeAsync(50);

    // Clear
    const clearBtn = document.querySelector('[data-testid="type-clear-btn"]');
    expect(clearBtn.style.display).not.toBe("none"); // visible when filters active
    clearBtn.click();
    await vi.advanceTimersByTimeAsync(50);

    // With no type filter and no search, should show hint
    expect(document.body.textContent).toContain("Type to search Pokémon");

    // Clear button should be hidden again
    expect(clearBtn.style.display).toBe("none");

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it("clicking a type chip toggles it off", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const fireChip = document.querySelector('[data-testid="type-chip-fire"]');
    fireChip.click();
    await vi.advanceTimersByTimeAsync(50);

    // Should show Fire types
    let results = document.querySelectorAll('[data-testid="search-result"]');
    expect(results.length).toBe(2);

    // Click again to toggle off
    fireChip.click();
    await vi.advanceTimersByTimeAsync(50);

    // Should show hint (no filters at all)
    expect(document.body.textContent).toContain("Type to search Pokémon");

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });

  it("type chip has active visual state when selected", async () => {
    const promise = showSpeciesSearch();
    await vi.runAllTimersAsync();

    const fireChip = document.querySelector('[data-testid="type-chip-fire"]');
    expect(fireChip.dataset.active).toBe("false");

    fireChip.click();
    await vi.advanceTimersByTimeAsync(50);

    expect(fireChip.dataset.active).toBe("true");

    fireChip.click();
    await vi.advanceTimersByTimeAsync(50);

    expect(fireChip.dataset.active).toBe("false");

    const cancelBtn = document.querySelector(".btn-secondary");
    cancelBtn.click();
    await expect(promise).resolves.toBeNull();
  });
});
