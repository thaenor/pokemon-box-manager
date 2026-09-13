const API_BASE = 'https://pokeapi.co/api/v2';

/**
 * Fetch basic Pokémon data from PokéAPI by name or ID.
 * @param {string} name — Pokémon name (e.g. "wigglytuff", "toxtricity-low-key")
 * @returns {Promise<Object|null>} Normalized Pokémon data:
 *   - sprite: string (front_default URL)
 *   - spriteShiny: string (front_shiny URL)
 *   - stats: [{name, value}] — 6 base stats
 *   - types: string[] — type names (e.g. ["Normal", "Fairy"])
 *   - abilities: string[] — ability names (all, including hidden)
 *   - speciesName: string — PokéAPI species name
 */
export async function fetchPokemon(name) {
  try {
    const res = await fetch(`${API_BASE}/pokemon/${encodeURIComponent(name.toLowerCase())}`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`fetchPokemon: Pokémon "${name}" not found (404)`);
        return null;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();

    return {
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
  } catch (err) {
    console.warn(`fetchPokemon: Error fetching "${name}" — ${err.message}`);
    return null;
  }
}

/**
 * Fetch sprite URL only (lighter call).
 * @param {string} name
 * @returns {Promise<string|null>} front_default sprite URL
 */
export async function fetchSprite(name) {
  try {
    const res = await fetch(`${API_BASE}/pokemon/${encodeURIComponent(name.toLowerCase())}`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`fetchSprite: Pokémon "${name}" not found (404)`);
        return null;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.sprites.front_default;
  } catch (err) {
    console.warn(`fetchSprite: Error fetching sprite for "${name}" — ${err.message}`);
    return null;
  }
}