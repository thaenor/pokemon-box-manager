import { describe, it, expect } from "vitest";
import { speciesList, findSpecies } from "../../js/data/species-list.js";

describe("speciesList", () => {
  it("contains expected starter species", () => {
    const names = speciesList.map((s) => s.name);
    expect(names).toContain("Venusaur");
    expect(names).toContain("Charizard");
    expect(names).toContain("Blastoise");
  });

  it("contains multiple pseudo-legendary species", () => {
    const names = speciesList.map((s) => s.name);
    expect(names).toContain("Dragonite");
    expect(names).toContain("Garchomp");
    expect(names).toContain("Dragapult");
  });

  it("each entry has required fields", () => {
    for (const s of speciesList) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("name");
      expect(s).toHaveProperty("showdownId");
      expect(s).toHaveProperty("types");
      expect(Array.isArray(s.types)).toBe(true);
    }
  });
});

describe("findSpecies", () => {
  it("finds Charizard by showdownId", () => {
    const result = findSpecies("charizard");
    expect(result).toBeDefined();
    expect(result.name).toBe("Charizard");
  });

  it("finds Garchomp by display name (case-insensitive)", () => {
    const result = findSpecies("garchomp");
    expect(result).toBeDefined();
    expect(result.showdownId).toBe("garchomp");
  });

  it("finds regional variant by showdownId", () => {
    const result = findSpecies("persian-alola");
    expect(result).toBeDefined();
    expect(result.name).toBe("Persian Alola");
  });

  it("returns undefined for unknown species", () => {
    expect(findSpecies("missingno")).toBeUndefined();
  });
});
