/**
 * PokéAPI client with localStorage-backed response cache.
 *
 * Cache schema (key: `pokemon-box:cache`):
 *   { [slug: string]: { sprite, spriteShiny, stats, types, abilities, speciesName } }
 *
 * Cache key is the lowercase species slug — case-insensitive by construction.
 * In-memory cache (`pokemonCache`) supplements localStorage for faster session reads.
 * localStorage is the canonical persistence layer; the in-memory cache is a hot mirror.
 * Cache is never auto-evicted for MVP — manual clear via DevTools is acceptable.
 */

const API_BASE = 'https://pokeapi.co/api/v2';

/* ── localStorage cache layer ── */

const POKEMON_CACHE_KEY = 'pokemon-box:cache';

/** Read the full cache object from localStorage. Returns {} on miss or corruption. */
function loadCache() {
  try {
    const raw = localStorage.getItem(POKEMON_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Write the full cache object to localStorage. */
function saveCache(cache) {
  try {
    localStorage.setItem(POKEMON_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('PokéAPI cache: localStorage write failed —', e.message);
  }
}

/** Get a single entry from localStorage cache. Returns undefined if not found. */
function getCached(slug) {
  const cache = loadCache();
  return cache[slug];
}

/** Set a single entry in localStorage cache and flush immediately. */
function setCached(slug, data) {
  const cache = loadCache();
  cache[slug] = data;
  saveCache(cache);
}

/* ── In-memory cache (session hot mirror) ── */

const pokemonCache = new Map();

/* ── Public API ── */

/**
 * Fetch basic Pokémon data from PokéAPI by name or ID.
 * Results are cached in localStorage (cross-session) and in-memory (session hot mirror).
 *
 * @param {string} name — Pokémon name slug (e.g. "wigglytuff", "toxtricity-low-key")
 * @returns {Promise<Object|null>} Normalized Pokémon data:
 *   - sprite: string (front_default URL)
 *   - spriteShiny: string (front_shiny URL)
 *   - stats: [{name, value}] — 6 base stats
 *   - types: string[] — type names (e.g. ["Normal", "Fairy"])
 *   - abilities: string[] — ability names (all, including hidden)
 *   - speciesName: string — PokéAPI species name
 */
export async function fetchPokemon(name) {
  const slug = name.toLowerCase();

  // 1. Check in-memory cache first (fastest path)
  const memCached = pokemonCache.get(slug);
  if (memCached) return memCached;

  // 2. Check localStorage cache (cross-session — promotes to in-memory)
  const lsCached = getCached(slug);
  if (lsCached) {
    pokemonCache.set(slug, lsCached);
    return lsCached;
  }

  // 3. Fetch from network
  try {
    const res = await fetch(`${API_BASE}/pokemon/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`fetchPokemon: Pokémon "${name}" not found (404)`);
        return null;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();

    // Trim to minimal shape (no full API response saved)
    const result = {
      sprite: data.sprites.front_default,
      spriteShiny: data.sprites.front_shiny,
      stats: data.stats.map((s) => ({
        name: s.stat.name,
        value: s.base_stat,
      })),
      types: data.types.map((t) => t.type.name),
      abilities: data.abilities.map((a) => a.ability.name),
      speciesName: data.species.name,
    };

    // 4. Persist to both caches
    pokemonCache.set(slug, result);
    setCached(slug, result);

    return result;
  } catch (err) {
    console.warn(`fetchPokemon: Error fetching "${name}" — ${err.message}`);
    return null;
  }
}

/**
 * Fetch sprite URL only (lighter call).
 * Also cached to localStorage and in-memory per the same schema.
 *
 * @param {string} name
 * @returns {Promise<string|null>} front_default sprite URL
 */
export async function fetchSprite(name) {
  const slug = name.toLowerCase();

  // Reuse the full cache — if the species was fetched before, serve the sprite without a network call
  const memCached = pokemonCache.get(slug);
  if (memCached) return memCached.sprite;

  const lsCached = getCached(slug);
  if (lsCached) {
    pokemonCache.set(slug, lsCached);
    return lsCached.sprite;
  }

  try {
    const res = await fetch(`${API_BASE}/pokemon/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`fetchSprite: Pokémon "${name}" not found (404)`);
        return null;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();

    const result = {
      sprite: data.sprites.front_default,
      spriteShiny: data.sprites.front_shiny,
      stats: data.stats.map((s) => ({
        name: s.stat.name,
        value: s.base_stat,
      })),
      types: data.types.map((t) => t.type.name),
      abilities: data.abilities.map((a) => a.ability.name),
      speciesName: data.species.name,
    };

    pokemonCache.set(slug, result);
    setCached(slug, result);

    return result.sprite;
  } catch (err) {
    console.warn(`fetchSprite: Error fetching sprite for "${name}" — ${err.message}`);
    return null;
  }
}