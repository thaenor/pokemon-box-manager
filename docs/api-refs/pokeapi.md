# PokéAPI v2 — Per-Pokémon Data Reference

## Quick Reference: 5 Key Things This API Provides

| # | What | How |
|---|------|-----|
| 1 | **Sprite URLs** for every Pokémon (front, back, shiny, female, official artwork) | `GET /api/v2/pokemon/{id}` → `response.sprites.front_default` |
| 2 | **Base stats** (HP/Atk/Def/SpA/SpD/Spe) | `response.stats[n].base_stat` with `response.stats[n].stat.name` |
| 3 | **Types & abilities** (including hidden abilities) | `response.types[n].type.name`, `response.abilities[n].ability.name` |
| 4 | **Flavor text, evolution chain, egg groups** | `GET /api/v2/pokemon-species/{id}` → `response.flavor_text_entries`, `response.evolution_chain` |
| 5 | **Regional forms** (Alolan, Galarian, Hisuian, Paldean) | Separate endpoint entries e.g. `/api/v2/pokemon/raichu-alola` |

---

## 1. `GET /api/v2/pokemon/{id-or-name}` — Core Pokémon Data

**Base URL:** `https://pokeapi.co/api/v2/pokemon/{id_or_name}`

### Full response shape (real example: pikachu, id=25)

```json
{
  "id": 25,
  "name": "pikachu",
  "base_experience": 112,
  "height": 4,
  "is_default": true,
  "order": 35,
  "weight": 60,
  "abilities": [
    {
      "is_hidden": false,
      "slot": 1,
      "ability": { "name": "static", "url": "https://pokeapi.co/api/v2/ability/9/" }
    },
    {
      "is_hidden": true,
      "slot": 3,
      "ability": { "name": "lightning-rod", "url": "https://pokeapi.co/api/v2/ability/31/" }
    }
  ],
  "forms": [
    { "name": "pikachu", "url": "https://pokeapi.co/api/v2/pokemon-form/25/" }
  ],
  "moves": [ /* see §1.5 */ ],
  "species": {
    "name": "pikachu",
    "url": "https://pokeapi.co/api/v2/pokemon-species/25/"
  },
  "sprites": { /* see §1.7 */ },
  "stats": [ /* see §1.4 */ ],
  "types": [
    {
      "slot": 1,
      "type": { "name": "electric", "url": "https://pokeapi.co/api/v2/type/13/" }
    }
  ]
}
```

### 1.1 Field path reference

| Field path | Type | Description |
|---|---|---|
| `response.id` | int | National Pokédex number (1–1025+) |
| `response.name` | string | API name (lowercase, hyphenated) |
| `response.height` | int | Height in decimetres (dm ÷ 10 = metres) |
| `response.weight` | int | Weight in hectograms (hg ÷ 10 = kg) |
| `response.base_experience` | int | Base EXP awarded when fainted |
| `response.is_default` | bool | `true` = the standard form, `false` = regional/alternate form |
| `response.order` | int | Sort order within the API |
| `response.abilities` | array | Array of ability objects (see 1.2) |
| `response.types` | array | Array of type objects (see 1.3) |
| `response.stats` | array | Array of stat objects (see 1.4) |
| `response.moves` | array | Array of move objects (see 1.5) |
| `response.forms` | array | References to `/api/v2/pokemon-form/{id}` |
| `response.species` | object | Reference to `/api/v2/pokemon-species/{id}` |
| `response.sprites` | object | Sprite URL objects (see 1.7) |

### 1.2 Abilities

```json
{
  "is_hidden": false,
  "slot": 1,
  "ability": { "name": "static", "url": "https://pokeapi.co/api/v2/ability/9/" }
}
```

- **`slot`**: 1 = first ability, 2 = second ability, 3 = hidden ability
- **`is_hidden`**: `true` for the hidden ability (slot 3)
- To extract: `response.abilities.find(a => !a.is_hidden).ability.name` for non-hidden, or filter by slot
- `response.past_abilities` contains abilities that changed between generations

### 1.3 Types

```json
{
  "slot": 1,
  "type": { "name": "electric", "url": "https://pokeapi.co/api/v2/type/13/" }
}
```

- Always ordered by slot (1, then 2)
- Single-type Pokémon only have one entry
- To get type names: `response.types.map(t => t.type.name)`
- `response.past_types` contains type changes in past generations

### 1.4 Stats

```json
[
  { "base_stat": 35,  "effort": 0, "stat": { "name": "hp", "url": "..." } },
  { "base_stat": 55,  "effort": 0, "stat": { "name": "attack", "url": "..." } },
  { "base_stat": 40,  "effort": 0, "stat": { "name": "defense", "url": "..." } },
  { "base_stat": 50,  "effort": 0, "stat": { "name": "special-attack", "url": "..." } },
  { "base_stat": 50,  "effort": 0, "stat": { "name": "special-defense", "url": "..." } },
  { "base_stat": 90,  "effort": 2, "stat": { "name": "speed", "url": "..." } }
]
```

**Stat name mapping:**

| `stat.name` | Abbreviation | Meaning |
|---|---|---|
| `hp` | HP | Hit Points |
| `attack` | Atk | Physical Attack |
| `defense` | Def | Physical Defense |
| `special-attack` | SpA | Special Attack |
| `special-defense` | SpD | Special Defense |
| `speed` | Spe | Speed |

**Lookup pattern:**

```js
const statMap = {};
response.stats.forEach(s => { statMap[s.stat.name] = s.base_stat; });
// statMap.hp = 35, statMap.attack = 55, etc.
```

- `effort` is the EV yield for that stat
- `response.past_stats` contains stat values from previous generations (e.g. Gen I combined Special, Gen V stat changes)

### 1.5 Moves

```json
{
  "move": {
    "name": "thunder-shock",
    "url": "https://pokeapi.co/api/v2/move/84/"
  },
  "version_group_details": [
    {
      "level_learned_at": 1,
      "version_group": { "name": "sun-moon", "url": "..." },
      "move_learn_method": { "name": "level-up", "url": "..." },
      "order": null
    }
  ]
}
```

**Learn method names** (`move_learn_method.name`):
- `level-up` — learned naturally at `level_learned_at`
- `machine` — TM/HM/TR
- `tutor` — move tutor
- `egg` — egg move
- `form-change` — form-specific move

**Notes:**
- The move array is large (100+ entries). Filter by `version_group` for a specific generation.
- `level_learned_at: 0` means TM/tutor/egg (not level-up).
- For latest-generation filtering, filter `version_group_details` by `version_group.name`

### 1.6 Species reference

```json
"species": {
  "name": "pikachu",
  "url": "https://pokeapi.co/api/v2/pokemon-species/25/"
}
```

This is a **reference** — you must fetch the species endpoint separately to get flavor text, evolution chain, etc. See §2.

### 1.7 Sprites — Complete Reference

The `sprites` object has three tiers:

#### Tier 1: Current-generation "standard" sprites (top-level)

```json
{
  "front_default":      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
  "front_shiny":       "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png",
  "front_female":      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/female/25.png",
  "front_shiny_female":"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/female/25.png",
  "back_default":      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png",
  "back_shiny":        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/25.png",
  "back_female":       "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/female/25.png",
  "back_shiny_female": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/female/25.png"
}
```

All are 96×96 (or close) PNG. These are the **default sprites** — Gen VII/VIII era.

#### Tier 2: `sprites.other` — Alternative art styles

```json
"other": {
  "official-artwork": {
    "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    "front_shiny":   "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/25.png"
  },
  "home": {
    "front_default":      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/25.png",
    "front_shiny":        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/25.png",
    "front_female":       "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/female/25.png",
    "front_shiny_female": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/female/25.png"
  },
  "dream_world": {
    "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/25.svg",
    "front_female":  null
  },
  "showdown": {
    "front_default":  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif",
    "front_shiny":    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/25.gif",
    "back_default":   "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/25.gif",
    "back_shiny":     "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/shiny/25.gif",
    "front_female":   "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/female/25.gif",
    "front_shiny_female": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/female/25.gif",
    "back_female":    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/back/female/25.gif",
    "back_shiny_female": null
  }
}
```

**Sprite size reference:**

| Source | Format | Size | Best for |
|---|---|---|---|
| `sprites.front_default` | PNG | 96×96 | List thumbnails, battle previews |
| `sprites.other.official-artwork.front_default` | PNG | ~475×475 | Detail view, Pokédex card hero image |
| `sprites.other.home.front_default` | PNG | ~256×256 | Medium-sized detail view |
| `sprites.other.dream_world.front_default` | SVG | Scalable | Vector art (smaller set, not all species) |
| `sprites.other.showdown.front_default` | GIF | ~120×120 | Animated sprites (Gen V style) |

**Context-specific sprite selection:**

```js
// For list/grid thumbnails (96×96):
img.src = pokemon.sprites.front_default;

// For detail page hero (full-size official art):
const artwork = pokemon.sprites.other['official-artwork'].front_default;
if (!artwork) { fallback = pokemon.sprites.front_default; }

// For shiny toggle on detail page:
const shinyArt = pokemon.sprites.other['official-artwork'].front_shiny;

// For female variant (where applicable):
const femaleArt = pokemon.sprites.front_female ?? pokemon.sprites.front_default;
```

#### Tier 3: `sprites.versions` — Per-generation sprites

Contains sprites for every game generation. Structure:
```
sprites.versions.generation-{i..ix}.{game-pair}.{front/back/shiny/...}
```

Full key listing: `generation-i`, `generation-ii`, `generation-iii`, `generation-iv`, `generation-v`, `generation-vi`, `generation-vii`, `generation-viii`, `generation-ix`.

### 1.8 Cries

```json
"cries": {
  "latest": "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg",
  "legacy": "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/25.ogg"
}
```

OGG audio files. `legacy` is the Gen I–V style cry; `latest` is the Gen VI+ style.

---

## 2. `GET /api/v2/pokemon-species/{id-or-name}` — Species Metadata

**Base URL:** `https://pokeapi.co/api/v2/pokemon-species/{id_or_name}`

### Full response shape (real example: pikachu, id=25)

```json
{
  "id": 25,
  "name": "pikachu",
  "order": 26,
  "gender_rate": 4,
  "capture_rate": 190,
  "base_happiness": 70,
  "is_baby": false,
  "is_legendary": false,
  "is_mythical": false,
  "hatch_counter": 10,
  "has_gender_differences": true,
  "forms_switchable": false,
  "growth_rate": {
    "name": "medium",
    "url": "https://pokeapi.co/api/v2/growth-rate/2/"
  },
  "pokedex_numbers": [
    { "entry_number": 25, "pokedex": { "name": "national", "url": "..." } },
    { "entry_number": 25, "pokedex": { "name": "kanto", "url": "..." } }
  ],
  "egg_groups": [
    { "name": "ground", "url": "https://pokeapi.co/api/v2/egg-group/5/" },
    { "name": "fairy",  "url": "https://pokeapi.co/api/v2/egg-group/6/" }
  ],
  "color": { "name": "yellow", "url": "..." },
  "shape": { "name": "quadruped", "url": "..." },
  "evolves_from_species": {
    "name": "pichu",
    "url": "https://pokeapi.co/api/v2/pokemon-species/172/"
  },
  "evolution_chain": {
    "url": "https://pokeapi.co/api/v2/evolution-chain/10/"
  },
  "habitat": { "name": "forest", "url": "..." },
  "generation": { "name": "generation-i", "url": "..." },
  "names": [
    { "name": "Pikachu",  "language": { "name": "en", "url": "..." } },
    { "name": "ピカチュウ", "language": { "name": "ja", "url": "..." } }
  ],
  "genera": [
    { "genus": "Mouse Pokémon", "language": { "name": "en", "url": "..." } },
    { "genus": "ねずみポケモン",  "language": { "name": "ja", "url": "..." } }
  ],
  "flavor_text_entries": [
    {
      "flavor_text": "When several of these POKéMON gather, their electricity could build and cause lightning storms.",
      "language": { "name": "en", "url": "..." },
      "version": { "name": "red", "url": "..." }
    }
  ],
  "varieties": [
    { "is_default": true,  "pokemon": { "name": "pikachu",         "url": "/api/v2/pokemon/25/" } },
    { "is_default": false, "pokemon": { "name": "pikachu-rock-star","url": "/api/v2/pokemon/10080/" } },
    { "is_default": false, "pokemon": { "name": "pikachu-belle",   "url": "/api/v2/pokemon/10081/" } },
    { "is_default": false, "pokemon": { "name": "pikachu-gmax",    "url": "/api/v2/pokemon/10199/" } }
  ]
}
```

### 2.1 Field path reference

| Field path | Type | Description |
|---|---|---|
| `response.gender_rate` | int | Female ratio (0–8, -1=genderless). Value ÷ 8 = female proportion. |
| `response.capture_rate` | int | Base capture rate (0–255, higher = easier) |
| `response.base_happiness` | int | Base friendship (0–255) |
| `response.hatch_counter` | int | Egg cycles to hatch (× 256 steps) |
| `response.is_baby` | bool | Is a baby Pokémon |
| `response.is_legendary` | bool | Is a legendary Pokémon |
| `response.is_mythical` | bool | Is a mythical Pokémon |
| `response.evolves_from_species` | object/null | Pre-evolution species reference |
| `response.evolution_chain.url` | string | Full evolution chain endpoint |
| `response.genera` | array | "Genus" (e.g. "Mouse Pokémon") per language |
| `response.flavor_text_entries` | array | Pokédex entries per game version and language |
| `response.egg_groups` | array | Egg groups (breeding compatibility) |
| `response.varieties` | array | All forms/varieties with `is_default` flag |
| `response.growth_rate` | object | Leveling rate (slow/medium/fast/parabolic/erratic/fluctuating) |
| `response.color` | object | Pokédex color category |
| `response.shape` | object | Pokémon body shape |
| `response.habitat` | object/null | Habitat type |
| `response.generation` | object | Debut generation |

### 2.2 Key data extraction patterns

**English flavor text (latest version):**
```js
const enEntries = response.flavor_text_entries.filter(
  e => e.language.name === 'en'
);
// Last entry is often the most recent game
const latestFlavor = enEntries[enEntries.length - 1].flavor_text;
// Replace hard-wrapped newlines (\f) and soft-wrapped newlines (\n)
const cleanText = latestFlavor.replace(/\\f|\\n/g, ' ');
```

**English genus:**
```js
const genus = response.genera.find(g => g.language.name === 'en')?.genus;
// e.g. "Mouse Pokémon"
```

**Evolution chain URL (fetch separately):**
```js
const evoUrl = response.evolution_chain.url;
// Fetch this to get the full chain (prevos, evolutions, conditions)
```

**Varieties → forms mapping:**
```js
const defaultForm = response.varieties.find(v => v.is_default);
const alternateForms = response.varieties.filter(v => !v.is_default);
```

### 2.3 How to use species alongside the pokemon endpoint

The two endpoints are complementary. The general pattern:

1. **`GET /api/v2/pokemon/{id}`** → get sprites, stats, types, abilities, moves
2. **`GET /api/v2/pokemon-species/{id}`** → get flavor text, evolution chain, egg groups, gender ratio, varieties

The species endpoint also tells you:
- Whether the species has gender differences (`has_gender_differences`)
- What the pre-evolution is (`evolves_from_species`)
- The full evolution chain endpoint (`evolution_chain.url`)
- All forms/varieties (`varieties` array)

---

## 3. Pagination / Listing Endpoints

### 3.1 `GET /api/v2/pokemon?limit=100&offset=0`

```json
{
  "count": 1351,
  "next": "https://pokeapi.co/api/v2/pokemon?offset=100&limit=100",
  "previous": null,
  "results": [
    { "name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/" },
    { "name": "ivysaur",   "url": "https://pokeapi.co/api/v2/pokemon/2/" },
    { "name": "venusaur",  "url": "https://pokeapi.co/api/v2/pokemon/3/" }
  ]
}
```

### 3.2 `GET /api/v2/pokemon-species?limit=100&offset=0`

```json
{
  "count": 1025,
  "next": "https://pokeapi.co/api/v2/pokemon-species?offset=100&limit=100",
  "previous": null,
  "results": [
    { "name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon-species/1/" },
    { "name": "ivysaur",   "url": "https://pokeapi.co/api/v2/pokemon-species/2/" },
    { "name": "venusaur",  "url": "https://pokeapi.co/api/v2/pokemon-species/3/" }
  ]
}
```

### 3.3 Field reference

| Field | Type | Description |
|---|---|---|
| `response.count` | int | Total number of items (including forms) |
| `response.next` | string/null | URL for the next page (null when at end) |
| `response.previous` | string/null | URL for the previous page (null when at start) |
| `response.results[]` | array | Objects with `name` and `url` |
| `response.results[].name` | string | API name (use this to fetch full data) |
| `response.results[].url` | string | Full endpoint URL |

**Important:** The **count differs** between the two endpoints:
- `/api/v2/pokemon` returns ~1351 entries — this **includes regional forms** (e.g. `raichu-alola`, `meowth-galar`), alternate forms (cosplay, G-Max), and Megas as separate numbered entries.
- `/api/v2/pokemon-species` returns ~1025 entries — this is the **unique species count** (one entry per species, ignoring forms).

**Pagination pattern:**
```js
async function fetchAllPokemon() {
  let url = 'https://pokeapi.co/api/v2/pokemon?limit=100&offset=0';
  const allNames = [];
  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    allNames.push(...data.results.map(r => r.name));
    url = data.next;
  }
  return allNames; // all 1351+ names
}
```

---

## 4. Regional Forms

### 4.1 How PokéAPI handles regional forms

PokéAPI treats each regional form as a **separate Pokémon entry** in the `/api/v2/pokemon` endpoint. The name follows the pattern `{species}-{region}`:

| Form convention | API path | Example ID |
|---|---|---|
| Alolan (Sun/Moon) | `/api/v2/pokemon/raichu-alola` | 10100 |
| Galarian (Sword/Shield) | `/api/v2/pokemon/meowth-galar` | 10161 |
| Hisuian (Legends: Arceus) | `/api/v2/pokemon/growlithe-hisui` | — |
| Paldean (Scarlet/Violet) | `/api/v2/pokemon/tauros-paldea-combat` | — |

**Key characteristics of regional form entries:**
- `is_default: false` — distinguishes from the base form
- **Different types, abilities, stats** from the base form
- Different sprites (distinct artwork)
- Each has its own unique `id` (usually in the 10100+ range)
- They have their own `moves` array (learnset may differ from base form)
- They have their own `species` reference (points to the same species endpoint)

### 4.2 Species-to-form mapping

The `species.varieties` array links a species to all its forms:

```json
// From /api/v2/pokemon-species/26/ (Raichu species)
{
  "varieties": [
    { "is_default": true,  "pokemon": { "name": "raichu",      "url": "/api/v2/pokemon/26/" } },
    { "is_default": false, "pokemon": { "name": "raichu-alola", "url": "/api/v2/pokemon/10100/" } }
  ]
}
```

So to discover all regional forms for a species:
1. Fetch `species.varieties`
2. Filter varieties (the ones where `is_default === false` are regional/alternate forms)
3. Fetch each non-default form's data from its `pokemon.url`

### 4.3 Sprite differences for regional forms

Regional forms get **completely separate sprite images**. Example — Alolan Raichu:

```json
{
  "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10100.png",
  "other": {
    "official-artwork": {
      "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10100.png"
    },
    "home": {
      "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/10100.png"
    }
  }
}
```

Compare with base Raichu (id=26):
- Base: `.../sprites/pokemon/26.png`
- Alola: `.../sprites/pokemon/10100.png`

The sprite ID matches the Pokémon ID, so you never need to manually construct URLs — just use the returned URLs.

**Important:** some regional forms only have valid sprites for specific generations where they exist. For example, Galarian Meowth has `null` for many earlier-generation sprite slots.

### 4.4 Known regional form species

| Region | Known species |
|---|---|
| **Alola** | Rattata, Raticate, Raichu, Sandshrew, Sandslash, Vulpix, Ninetales, Diglett, Dugtrio, Meowth, Persian, Geodude, Graveler, Golem, Grimer, Muk, Exeggutor, Marowak |
| **Galar** | Meowth, Ponyta, Rapidash, Slowpoke, Slowbro, Slowking, Farfetch'd, Mr. Mime, Corsola, Zigzagoon, Linoone, Darumaka, Darmanitan, Yamask, Stunfisk |
| **Hisui** | Growlithe, Arcanine, Voltorb, Electrode, Typhlosion, Qwilfish, Sneasel, Samurott, Lilligant, Zorua, Zoroark, Braviary, Sliggoo, Goodra, Avalugg, Decidueye, Ursaluna, Enamorus |
| **Paldea** | Tauros (Combat/Blaze/Aqua), Wooper, Farigiraf |
| **Kitakami** | (Regional variants of existing species in The Teal Mask DLC) |

---

## 5. Name Resolution

### 5.1 PokéAPI names vs. Pokémon Showdown names

The APIs use different naming conventions:

| Aspect | PokéAPI | Pokémon Showdown |
|---|---|---|
| Separator | hyphen (`-`) | no separator or uppercase |
| Case | lowercase | CamelCase or lowercase |
| Regional forms | `raichu-alola` | `Raichu-Alola` (internal: `Raichualola`) |
| Special characters | `mr-mime` | `Mr. Mime` or `Mr. Mime` |
| Gender forms | `meowstic-f` | `Meowstic-F` |
| Mega forms | `charizard-mega-x` | `Charizard-Mega-X` |
| Base Pokémon | lowercase, hyphenated | lowercase, no hyphen |

### 5.2 Name mapping table for common species

| Dex # | Species | PokéAPI name | Showdown name | Showdown alias |
|---|---|---|---|---|
| 25 | Pikachu | `pikachu` | `Pikachu` | — |
| 26 | Raichu | `raichu` | `Raichu` | — |
| 26-A | Raichu (Alola) | `raichu-alola` | `Raichu-Alola` | `aloraichu` |
| 37 | Vulpix | `vulpix` | `Vulpix` | — |
| 37-A | Vulpix (Alola) | `vulpix-alola` | `Vulpix-Alola` | `alovulpix` |
| 52 | Meowth | `meowth` | `Meowth` | — |
| 52-G | Meowth (Galar) | `meowth-galar` | `Meowth-Galar` | — |
| 133 | Eevee | `eevee` | `Eevee` | — |
| 150 | Mewtwo | `mewtwo` | `Mewtwo` | — |
| 150-MX | Mewtwo (Mega X) | `mewtwo-mega-x` | `Mewtwo-Mega-X` | `mmx`, `megamewtwox` |
| 172 | Pichu | `pichu` | `Pichu` | — |
| 448 | Lucario | `lucario` | `Lucario` | — |
| 448-M | Lucario (Mega) | `lucario-mega` | `Lucario-Mega` | `mluc`, `megaluc` |
| 658 | Greninja | `greninja` | `Greninja` | — |
| 658-A | Greninja (Ash) | `greninja-ash` | `Greninja-Ash` | `ashgreninja` |
| 745 | Lycanroc | `lycanroc` | `Lycanroc` | `lycanrocmidday` |
| 745-N | Lycanroc (Night) | `lycanroc-midnight` | `Lycanroc-Midnight` | `lycanm` |
| 745-D | Lycanroc (Dusk) | `lycanroc-dusk` | `Lycanroc-Dusk` | `duskroc` |
| 778 | Mimikyu | `mimikyu` | `Mimikyu` | — |
| 778-D | Mimikyu (Disguised) | `mimikyu-disguised` | `Mimikyu-Disguised` | — |
| 849 | Toxtricity | `toxtricity` | `Toxtricity` | — |
| 849-L | Toxtricity (Low Key) | `toxtricity-low-key` | `Toxtricity-Low-Key` | `toxtricitylk` |

### 5.3 Mapping between Showdown and PokéAPI names

**Showdown → PokéAPI (with `-` separator adjustment):**

Showdown internal names typically use CamelCase with hyphenated suffixes. The main difference is:
1. Showdown uses `raichualola` (conjoined) as internal form **aliases**
2. But Showdown's canonical species names use `Raichu-Alola` (hyphenated, CamelCase)

**Simple transformation:**

```
Showdown canonical: "Raichu-Alola"     → PokéAPI: "raichu-alola"
Showdown canonical: "Meowth-Galar"     → PokéAPI: "meowth-galar"
Showdown canonical: "Toxtricity-Low-Key" → PokéAPI: "toxtricity-low-key"
```

**The rule:** lowercase the Showdown canonical name, and it matches the PokéAPI name exactly.

**Showdown aliases** (from `data/aliases.ts`) are compact short forms like `aloraichu`, `alowak`, `duskroc`, `glowbro`. These do NOT match PokéAPI names directly — they must be mapped through the alias table first.

```js
// Showdown → PokéAPI (canonical Showdown names)
const toPokeApi = (showdownName) => showdownName.toLowerCase();

// PokéAPI → Showdown canonical
const toShowdown = (pokeApiName) => {
  const words = pokeApiName.split('-').map(w => w[0].toUpperCase() + w.slice(1));
  return words.join('-');
};

// For Showdown aliases, you must resolve via aliases.ts first
```

### 5.4 Which forms exist in PokéAPI

PokéAPI includes entries for:
- **All standard Pokémon** (#1–1025)
- **Mega Evolutions** (as separate entries)
- **Regional forms** (Alola, Galar, Hisui, Paldea) 
- **Alternate forms** (Deoxys, Rotom, Cherrim, Keldeo, etc.)
- **Cosplay forms** (Pikachu hats, etc.)
- **Gigantamax forms** (as separate entries)
- **Primal Reversions** (Groudon, Kyogre)
- **Fused forms** (Necrozma-Dusk-Mane etc.)

Forms that do NOT exist as PokéAPI entries:
- **Spinda spot patterns** (only one entry for Spinda; spots are handled client-side)
- **Unown letter variants** (only one entry for Unown; no individual letter endpoints)
- **Vivillon patterns / Furfrou trims** (handled as form values, not separate endpoints)
- Some minor cosmetic variants
- **Shiny forms** (handled via sprite URLs, not separate entries — `sprites.front_shiny`)

The total count (`/api/v2/pokemon?limit=1` returns `count: 1351`) includes all forms.

---

## 6. Rate Limits, Caching & Libraries

### 6.1 No authentication needed

PokéAPI v2 requires **no API key, no auth token, no registration**. Just make HTTP GET requests.

### 6.2 Rate limits (fair use policy)

As of 2018, PokéAPI **removed all rate limits**. The current policy:

> **"No auth, no rate limits, no more PokeAPI v2 API keys."**
> – PokéAPI team (2018)

Fair use expectations:
- Cache responses aggressively — do not fetch the same Pokémon repeatedly
- Reasonable request volume is fine (the API sits behind Cloudflare)
- If you are scraping all 1351 entries, batch requests and add small delays (100ms–500ms between batches)
- The API has been production-stable for years

### 6.3 Caching strategy

Since the data is immutable (Pokémon stats, sprites, and types never change), cache aggressively:

**Recommended cache layers:**
1. **Local cache** (e.g. IndexedDB / localStorage in browser, or a JSON file in Node):
   - Cache key: `pokeapi-v2-{endpoint-path}` (e.g. `pokeapi-v2-pokemon-25`)
   - TTL: Never expires (data is permanent)
   - Bust cache only on client version updates

2. **In-memory cache** during a session:
   - Store fetched Pokémon in a `Map<number, object>`
   - Store species data in a separate `Map<number, object>`

3. **Sprite caching**:
   - Browser: `<img>` tags cache naturally via HTTP cache headers
   - Node: Use `Cache-Control` headers or a dedicated sprite download cache

**Loading strategy for large lists:**
```js
// Batch fetches and cache
const BATCH_DELAY = 100; // ms between requests
async function fetchPokemonBatch(ids) {
  const results = [];
  for (const id of ids) {
    const data = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json());
    cache.set(id, data);
    results.push(data);
    await new Promise(r => setTimeout(r, BATCH_DELAY));
  }
  return results;
}
```

### 6.4 Available libraries

**Official / community libraries:**

| Library | Platform | Features |
|---|---|---|
| **pokeapi-js-wrapper** | Browser / Node | Auto-caching, concurrent requests, TTL config, sprite URLs |
| **PokeAPI Python** | Python | Wrapper with caching (not actively maintained) |
| **PokeAPI Kotlin** | Android/Kotlin | JVM wrapper |

**Recommended: `pokeapi-js-wrapper`**

npm: `pokeapi-js-wrapper`

```js
import { Pokedex } from 'pokeapi-js-wrapper';

const P = new Pokedex({
  protocol: 'https',
  timeout: 30000,
  cache: true,
  // Optional: custom cache TTL
});

// Returns cached result on second call
const pikachu = await P.getPokemonByName('pikachu');
const species = await P.getPokemonSpeciesByName('pikachu');

// Sprite URL extraction
const sprite = pikachu.sprites.other['official-artwork'].front_default;
```

The wrapper handles caching, rate-limiting safeguards, and pagination helpers.

### 6.5 Base URL pattern

All sprites are served from a separate GitHub repository:

```
Base sprite URL: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/
Sprite pattern:  {base}/{variant}/{id}.png
Cries repo:      https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/{id}.ogg
```

Never construct sprite URLs manually — always use the URLs returned in the API response. The URL format is an implementation detail of the PokeAPI repository.

---

## Appendix: Complete Endpoint Summary

| Endpoint | Purpose | Key fields |
|---|---|---|
| `GET /api/v2/pokemon/{id}` | Core Pokémon data | sprites, stats, types, abilities, moves |
| `GET /api/v2/pokemon-species/{id}` | Species metadata | flavor text, evolution chain, egg groups, gender |
| `GET /api/v2/pokemon-form/{id}` | Form-specific data | form name, form sprites, type overrides |
| `GET /api/v2/evolution-chain/{id}` | Full evolution tree | chain of species with evolution conditions |
| `GET /api/v2/pokemon?limit=L&offset=O` | List all Pokémon | paginated list of name+url |
| `GET /api/v2/pokemon-species?limit=L&offset=O` | List all species | species-only paginated list |
| `GET /api/v2/type/{id}` | Type data | damage relations, move list |
| `GET /api/v2/ability/{id}` | Ability data | effect text, Pokémon with this ability |
| `GET /api/v2/move/{id}` | Move data | power, accuracy, PP, type, category, effect |

### Recommended fetch order for a full Pokémon detail view:

```
1. GET /api/v2/pokemon/{id}         → stats, sprites, types, abilities
2. GET /api/v2/pokemon-species/{id} → flavor text, genus, evolution chain
3. (optional) GET evolution_chain.url → full evolution chain
4. (per ability) GET ability.url     → ability effect text
```

These two parallel requests (`pokemon` + `pokemon-species`) give you everything needed for a complete Pokédex card.