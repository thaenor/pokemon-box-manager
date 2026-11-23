import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catalogue } from "../../violet/catalogue.js";

// PokéAPI's https://pokeapi.co/api/v2/pokedex/paldea/ ordered by entry_number.
const pokedex = readFileSync("tests/fixtures/paldea-pokedex.txt", "utf8").trim().split("\n");
const regionalForms = { wooper: "wooperpaldea", tauros: "taurospaldeacombat" };

function methodsFor(id) {
  const entry = catalogue.find((entry) => entry.id === id);
  expect(entry, id).toBeDefined();
  return entry.methods;
}

describe("Violet evolution catalogue", () => {
  it("assigns each Paldea Pokédex number to the correct species and regional form", () => {
    expect(pokedex).toHaveLength(400);
    const expected = pokedex.map((name, index) => ({
      number: index + 1,
      id: regionalForms[name] ?? name.replaceAll("-", ""),
    }));
    expect(catalogue.map(({ number, id }) => ({ number, id }))).toEqual(expected);
  });

  it("gives both Charcadet methods with the Violet solo path first", () => {
    const methods = methodsFor("charcadet");
    expect(methods).toHaveLength(2);
    expect(methods[0]).toMatchObject({
      kind: "Solo",
      title: expect.stringMatching(/Malicious Armor/i),
    });
    expect(methods[1]).toMatchObject({
      kind: "Trade",
      title: expect.stringMatching(/Auspicious Armor/i),
    });
    expect(JSON.stringify(methods)).not.toMatch(/Ceruledge|Armarouge/i);
  });

  it("keeps all eight Eevee methods distinct without naming their outcomes", () => {
    const methods = methodsFor("eevee");
    expect(new Set(methods.map(({ title }) => title)).size).toBe(8);
    expect(JSON.stringify(methods)).not.toMatch(
      /Vaporeon|Jolteon|Flareon|Espeon|Umbreon|Glaceon|Leafeon|Sylveon/i,
    );
  });

  it("represents special multiplayer requirements and species with no evolution", () => {
    const finizen = methodsFor("finizen");
    expect(JSON.stringify(finizen)).toMatch(/Union Circle/i);
    expect(JSON.stringify(finizen)).toMatch(/38/);
    expect(methodsFor("miraidon")).toEqual([]);
  });
});
