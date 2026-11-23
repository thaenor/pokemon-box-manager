import { describe, expect, it } from "vitest";
import { catalogue } from "../../violet/catalogue.js";

function methodsFor(id) {
  const entry = catalogue.find((entry) => entry.id === id);
  expect(entry, id).toBeDefined();
  return entry.methods;
}

describe("Violet evolution catalogue", () => {
  it("covers every regional Pokédex number and uniquely identifies each searchable form", () => {
    const numbers = [...new Set(catalogue.map((entry) => entry.number))].sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 400 }, (_, index) => index + 1));
    expect(new Set(catalogue.map((entry) => entry.id)).size).toBe(catalogue.length);
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
