import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import PokemonCache from "../../js/cache/pokemon-cache.js";

/** Helper: seed a species entry into the cache. */
async function seedSpecies(cache, name, data = {}) {
  const db = cache.database;
  const tx = db.transaction("species", "readwrite");
  const store = tx.objectStore("species");
  store.put({ pokeApiName: name, ...data });
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/** Helper: seed a sprite entry into the cache. */
async function seedSprite(cache, url, blob) {
  const db = cache.database;
  const tx = db.transaction("sprites", "readwrite");
  const store = tx.objectStore("sprites");
  store.put({ spriteUrl: url, blob });
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

describe("PokemonCache — getStats", () => {
  /** @type {PokemonCache} */
  let cache;

  beforeEach(async () => {
    // Start fresh — delete any existing database
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase("pkmn-cache-v1");
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve(); // ignore block
    });
    cache = await PokemonCache.open();
  });

  afterEach(() => {
    cache.close();
  });

  it("returns zeros for an empty cache", async () => {
    const stats = await cache.getStats();
    expect(stats).toEqual({ species: 0, sprites: 0, sizeBytes: 0 });
  });

  it("returns correct species count", async () => {
    await seedSpecies(cache, "pikachu", { name: "Pikachu" });
    await seedSpecies(cache, "charizard", { name: "Charizard" });

    const stats = await cache.getStats();
    expect(stats.species).toBe(2);
    expect(stats.sprites).toBe(0);
  });

  it("returns correct sprite count", async () => {
    await seedSprite(cache, "https://example.com/pika.png", new Blob(["pika data"]));
    await seedSprite(cache, "https://example.com/char.png", new Blob(["char data"]));

    const stats = await cache.getStats();
    expect(stats.sprites).toBe(2);
    expect(stats.species).toBe(0);
  });

  it("returns both counts when both stores have data", async () => {
    await seedSpecies(cache, "pikachu", { name: "Pikachu" });
    await seedSprite(cache, "https://example.com/pika.png", new Blob(["pika data"]));

    const stats = await cache.getStats();
    expect(stats.species).toBe(1);
    expect(stats.sprites).toBe(1);
  });

  it("returns a reasonable sizeBytes estimate", async () => {
    await seedSpecies(cache, "pikachu", { name: "Pikachu", stats: { hp: 35 } });
    await seedSprite(cache, "https://example.com/pika.png", new Blob(["abc"]));

    const stats = await cache.getStats();
    expect(stats.sizeBytes).toBeGreaterThan(0);
    // Species JSON stringified size + blob size (3 bytes for "abc")
    expect(stats.sizeBytes).toBeGreaterThanOrEqual(3);
  });
});

describe("PokemonCache — clear", () => {
  /** @type {PokemonCache} */
  let cache;

  beforeEach(async () => {
    cache = await PokemonCache.open();
  });

  afterEach(() => {
    cache.close();
  });

  it("clears all species and sprites", async () => {
    await seedSpecies(cache, "pikachu", { name: "Pikachu" });
    await seedSprite(cache, "https://example.com/pika.png", new Blob(["data"]));

    await cache.clear();

    const stats = await cache.getStats();
    expect(stats).toEqual({ species: 0, sprites: 0, sizeBytes: 0 });
  });

  it("allows cache operations after clear", async () => {
    await seedSpecies(cache, "pikachu", { name: "Pikachu" });
    await cache.clear();

    // After clear, cache still works
    await seedSpecies(cache, "charizard", { name: "Charizard" });
    const stats = await cache.getStats();
    expect(stats.species).toBe(1);
    expect(stats.sprites).toBe(0);
  });

  it("is idempotent — calling clear on empty cache does not error", async () => {
    await expect(cache.clear()).resolves.toBeUndefined();
  });
});

describe("PokemonCache — error handling", () => {
  it("throws when calling getStats before open", async () => {
    const unopened = new PokemonCache();
    await expect(unopened.getStats()).rejects.toThrow("PokemonCache is not open");
  });

  it("throws when calling clear before open", async () => {
    const unopened = new PokemonCache();
    await expect(unopened.clear()).rejects.toThrow("PokemonCache is not open");
  });
});

describe("PokemonCache — sprite cache", () => {
  /** @type {PokemonCache} */
  let cache;

  beforeEach(async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase("pkmn-cache-v1");
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
    cache = await PokemonCache.open();
  });

  afterEach(() => {
    cache.close();
  });

  it("getSprite returns null for uncached URL", async () => {
    const result = await cache.getSprite("https://example.com/missing.png");
    expect(result).toBeNull();
  });

  it("stores sprite metadata retrievable via database read", async () => {
    const blob = new Blob(["test image data"], { type: "image/png" });
    const db = cache.database;
    const tx = db.transaction("sprites", "readwrite");
    tx.objectStore("sprites").put({
      spriteUrl: "https://example.com/test.png",
      blob,
      cachedAt: Date.now(),
      mimeType: "image/png",
    });
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });

    // Read back from store to verify data persisted
    const readTx = db.transaction("sprites", "readonly");
    const entry = await new Promise((resolve) => {
      const req = readTx.objectStore("sprites").get("https://example.com/test.png");
      req.onsuccess = () => resolve(req.result);
    });
    expect(entry).toBeTruthy();
    expect(entry.spriteUrl).toBe("https://example.com/test.png");
    expect(entry.mimeType).toBe("image/png");
    expect(entry.cachedAt).toBeGreaterThan(0);
  });

  it("throws on getSprite before open", async () => {
    cache.close();
    const unopened = new PokemonCache();
    await expect(unopened.getSprite("https://example.com/x.png")).rejects.toThrow(
      "PokemonCache is not open",
    );
  });

  it("throws on saveSprite before open", async () => {
    cache.close();
    const unopened = new PokemonCache();
    await expect(unopened.saveSprite("https://example.com/x.png")).rejects.toThrow(
      "PokemonCache is not open",
    );
  });
});
