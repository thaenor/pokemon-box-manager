/**
 * IndexedDB database schema for Pokémon data cache.
 *
 * Stores:
 *   - `species` — full PokéAPI responses, keyed by `pokeApiName` (static, no TTL)
 *   - `sprites`  — image blobs for offline viewing, keyed by `spriteUrl`
 *
 * Database versioned for future migrations: bump DB_VERSION and handle upgrades.
 */

export const DB_NAME = "pkmn-cache-v1";
export const DB_VERSION = 1;

/** Object store configurations — passed to createObjectStore() on upgrade. */
export const STORES = {
  species: { keyPath: "pokeApiName" },
  sprites: { keyPath: "spriteUrl" },
};
