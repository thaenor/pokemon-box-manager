import { DB_NAME, DB_VERSION, STORES } from "./schema.js";

/** Singleton instance held across `open()` calls. */
let instance = null;

/** Promise-based lock to serialize concurrent open() calls. */
let openPromise = null;

/**
 * IndexedDB-backed cache for Pokémon data.
 *
 * Usage:
 *   const cache = await PokemonCache.open();
 *
 * The returned instance is a singleton — multiple calls within the same
 * session share the same underlying IDBDatabase connection.
 */
export class PokemonCache {
  /** @type {IDBDatabase | null} */
  #db = null;

  /**
   * Open (or return an existing) connection to the IndexedDB database.
   * Creates stores and any needed indexes on first open (upgradeneeded).
   *
   * @returns {Promise<PokemonCache>}
   */
  static async open() {
    if (instance) return instance;
    if (openPromise) return openPromise;

    openPromise = (async () => {
      const cache = new PokemonCache();
      await cache.#connect();
      instance = cache;
      openPromise = null;
      return instance;
    })();

    return openPromise;
  }

  /**
   * Internal: open the IDB connection and set up stores on upgrade.
   */
  async #connect() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        for (const [storeName, config] of Object.entries(STORES)) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: config.keyPath });
          }
        }
      };

      request.onsuccess = (event) => {
        this.#db = event.target.result;

        // Handle database close from outside (e.g., devtools manual delete)
        this.#db.onclose = () => {
          instance = null;
          this.#db = null;
        };

        // Handle versionchange (another tab opened a newer version)
        this.#db.onversionchange = () => {
          this.#db.close();
          instance = null;
          this.#db = null;
        };

        resolve();
      };

      request.onerror = (event) => {
        reject(
          new Error(`IndexedDB open failed: ${event.target.error?.message ?? "unknown error"}`),
        );
      };

      request.onblocked = () => {
        reject(
          new Error(
            "IndexedDB open blocked — another tab has the database open with a pending version change",
          ),
        );
      };
    });
  }

  /**
   * Returns the raw IDBDatabase reference for advanced use.
   * Prefer the helper methods over direct access.
   *
   * @returns {IDBDatabase}
   */
  get database() {
    return this.#db;
  }

  /**
   * Close the connection and reset the singleton.
   * Useful for testing or cleanup.
   */
  close() {
    if (this.#db) {
      this.#db.close();
      this.#db = null;
    }
    instance = null;
  }

  /**
   * Get cache statistics — entry counts and estimated storage size.
   *
   * @returns {Promise<{ species: number, sprites: number, sizeBytes: number }>}
   */
  async getStats() {
    this.#requireDb();

    const [speciesItems, spriteItems] = await Promise.all([
      this.#getAll("species"),
      this.#getAll("sprites"),
    ]);

    const species = speciesItems.length;
    const sprites = spriteItems.length;
    const sizeBytes =
      speciesItems.reduce((sum, item) => sum + new Blob([JSON.stringify(item)]).size, 0) +
      spriteItems.reduce((sum, item) => sum + (item.blob?.size || 0), 0);

    return { species, sprites, sizeBytes };
  }

  /**
   * Clear all cached data from both stores.
   *
   * @returns {Promise<void>}
   */
  async clear() {
    this.#requireDb();

    await Promise.all([this.#clearStore("species"), this.#clearStore("sprites")]);
  }

  /**
   * Ensure the database connection is open.
   *
   * @returns {IDBDatabase}
   */
  #requireDb() {
    if (!this.#db) {
      throw new Error("PokemonCache is not open. Call await PokemonCache.open() first.");
    }
    return this.#db;
  }

  /**
   * Retrieve all entries from an object store.
   *
   * @param {string} storeName
   * @returns {Promise<Array<object>>}
   */
  #getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.#db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete all entries from an object store.
   *
   * @param {string} storeName
   * @returns {Promise<void>}
   */
  #clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.#db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export default PokemonCache;
