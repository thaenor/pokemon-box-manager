import { describe, it, expect } from "vitest";
import { natures, findNature, natureModifier } from "../../js/data/natures.js";

describe("natures data", () => {
  it("has exactly 25 natures", () => {
    expect(natures).toHaveLength(25);
  });

  it("includes all expected nature names", () => {
    const names = natures.map((n) => n.name);
    expect(names).toContain("Adamant");
    expect(names).toContain("Modest");
    expect(names).toContain("Jolly");
    expect(names).toContain("Timid");
    expect(names).toContain("Bold");
    expect(names).toContain("Calm");
    expect(names).toContain("Hardy");
    expect(names).toContain("Serious");
  });
});

describe("findNature", () => {
  it("finds Adamant with correct modifiers", () => {
    const nature = findNature("Adamant");
    expect(nature).not.toBeNull();
    expect(nature.increased).toBe("Attack");
    expect(nature.decreased).toBe("Special Attack");
  });

  it("finds Timid (case-insensitive)", () => {
    const nature = findNature("timid");
    expect(nature).not.toBeNull();
    expect(nature.increased).toBe("Speed");
  });

  it("finds neutral natures", () => {
    const nature = findNature("Hardy");
    expect(nature.increased).toBeNull();
    expect(nature.decreased).toBeNull();
  });

  it("returns null for unknown nature", () => {
    expect(findNature("FakeNature")).toBeNull();
  });
});

describe("natureModifier", () => {
  it("returns 1.1 for increased stat on Adamant", () => {
    const adamant = findNature("Adamant");
    expect(natureModifier(adamant, "Attack")).toBe(1.1);
  });

  it("returns 0.9 for decreased stat on Adamant", () => {
    const adamant = findNature("Adamant");
    expect(natureModifier(adamant, "Special Attack")).toBe(0.9);
  });

  it("returns 1.0 for unaffected stat on Adamant", () => {
    const adamant = findNature("Adamant");
    expect(natureModifier(adamant, "Speed")).toBe(1.0);
  });

  it("returns 1.0 for all stats on neutral nature", () => {
    const hardy = findNature("Hardy");
    expect(natureModifier(hardy, "Attack")).toBe(1.0);
    expect(natureModifier(hardy, "Defense")).toBe(1.0);
    expect(natureModifier(hardy, "Speed")).toBe(1.0);
  });
});
