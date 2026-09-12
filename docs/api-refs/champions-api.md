# Pokémon Champions Battle Data API — Reference

> **Base URL:** `https://championsbattledata.com`  
> **Asset root:** `https://championsbattledata.com/pokemon_champions_assets/`  
> **API guide:** `https://championsbattledata.com/api_guide`  
>
> — Use this reference when implementing `js/api/champions.js` or any client that fetches battle usage data.

---

## Quick-start: which endpoint for what

| What you need | Use |
|---|---|
| List all Pokémon in the game, their IDs, stats, types, sprites | `GET /api` (index) |
| Battle usage stats for one Pokémon (moves, items, teammates, etc.) | `GET /api/battle/{format}/{showdownId}` |
| Summary (top move/item/teammate, base stats, sprite path) for one Pokémon | `GET /api/pokemon/{showdownId}?format={format}` |
| Metadata (all forms, per-form stats, types, abilities, sprite paths) | `GET /api/metadata/{baseName}` |
| Latest daily snapshots of battle data | `GET /api/battle/{format}/{showdownId}?days=N` |
| Raw CSV for spreadsheets/data analysis | `GET /pokemon_champions_assets/battle_data/{format}/{ShowdownName}.csv` |
| Sprite image | `GET /pokemon_champions_assets/pokemon/{saved_name}.png` |
| Type icon | `GET /pokemon_champions_assets/types/{TypeName}.png` |

---

## 1. Index endpoint

**`GET /api`** or **`GET /api/index`** or **`GET /data/pokemon-index.json`**

Load this first — it's the entry point that lists every Pokémon with their IDs, available formats, seasons, stats, types, and sprites.

### JSON shape

```json
{
  "generatedAt": "2026-09-12T17:14:31.855Z",
  "dataVersion": "20260912171431855",
  "assetRoot": "pokemon_champions_assets",
  "seasons": ["Current", "M6", "M5", "M4"],
  "defaultSeason": "Current",
  "battleDataFolders": ["M6", "M5", "M4"],
  "dailyDataFolders": [
    "M6/12_09_2026", "M6/11_09_2026",
    "M5/09_09_2026", "M5/08_09_2026", "M5/07_09_2026", "M5/06_09_2026",
    "M5/05_09_2026", "M5/04_09_2026", "M5/03_09_2026", "M5/02_09_2026",
    "M5/01_09_2026", "M5/31_08_2026", "M5/30_08_2026", "M5/29_08_2026",
    "M5/24_08_2026", "M5/22_08_2026", "M5/21_08_2026", "M5/18_08_2026",
    "M4/18_08_2026", "M4/04_08_2026", "M4/30_07_2026", "M4/29_07_2026",
    "M4/28_07_2026", "M4/27_07_2026", "M4/26_07_2026", "M4/25_07_2026",
    "M4/24_07_2026", "M4/23_07_2026", "M4/22_07_2026", "M4/21_07_2026",
    "M4/20_07_2026", "M4/19_07_2026", "M4/18_07_2026", "M4/17_07_2026",
    "M4/16_07_2026"
  ],
  "pokemon": [
    {
      "name": "Garchomp",
      "battleName": "Garchomp",
      "slug": "garchomp",
      "showdownId": "garchomp",
      "showdownName": "Garchomp",
      "baseName": "Garchomp",
      "metadataCsv": "pokemon_champions_assets/metadata/Garchomp.csv",
      "battleDataCsvs": [
        {
          "season": "M6",
          "format": "Doubles",
          "path": "pokemon_champions_assets/battle_data/M6/12_09_2026/Doubles/Garchomp.csv",
          "date": "12_09_2026",
          "daily": true
        },
        {
          "season": "Current",
          "format": "Singles",
          "path": "pokemon_champions_assets/battle_data/Singles/Garchomp.csv"
        },
        {
          "season": "Current",
          "format": "Doubles",
          "path": "pokemon_champions_assets/battle_data/Doubles/Garchomp.csv"
        }
      ],
      "summary": {
        "sprite": "pokemon_champions_assets/pokemon/Garchomp.png",
        "types": ["Dragon", "Ground"],
        "forms": [
          {
            "form_name": "Garchomp",
            "saved_name": "Garchomp",
            "types": ["Dragon", "Ground"],
            "abilities": "Rough Skin|Sand Veil",
            "hp": 220, "attack": 170, "defense": 125,
            "sp_attack": 100, "sp_defense": 105, "speed": 150,
            "base_stat_total": 660
          }
        ],
        "baseStats": {"hp": 220, "attack": 170, "defense": 125, "sp_attack": 100, "sp_defense": 105, "speed": 150},
        "baseStatTotal": 660,
        "battleSummary": {
          "Current": {
            "Doubles": {
              "top": {
                "move": {"name": "Protect", "percentage": "77.8%", "percentage_value": 77.8},
                "held_item": {"name": "Garchompite Z", "percentage": "56.5%", "percentage_value": 56.5},
                "teammate": {"name": "Sneasler"},
                "stat_alignment": {"name": "Jolly", "percentage": "56.6%", "percentage_value": 56.6},
                "stat_points": {"name": "", "percentage": "36.3%", "percentage_value": 36.3,
                  "hp_points": 2, "attack_points": 32, "defense_points": 0, "sp_atk_points": 0,
                  "sp_def_points": 0, "speed_points": 32},
                "ability": {"name": "Rough Skin", "percentage": "97.8%", "percentage_value": 97.8}
              }
            }
          }
        }
      }
    }
    // ... more Pokémon entries ...
  ],
  "pokemonPages": [
    {"name": "Garchomp", "slug": "garchomp", "battleName": "Garchomp", "baseName": "Garchomp", "isForm": false},
    {"name": "Hisuian Arcanine", "slug": "hisuian-arcanine", "battleName": "Arcanine", "baseName": "Arcanine", "isForm": true},
    // ... all species ...
  ]
}
```

### Key fields

| Path | Type | Meaning |
|---|---|---|
| `.seasons[]` | `string[]` | Available season codes: `Current`, `M4`, `M5`, `M6` |
| `.dailyDataFolders[]` | `string[]` | All available daily snapshot folders |
| `.pokemon[].showdownId` | `string` | **Showdown internal ID** — use this in API route paths |
| `.pokemon[].showdownName` | `string` | Standard Showdown species name (e.g. `Raichu-Alola`) |
| `.pokemon[].battleName` | `string` | Canonical name used in CSV filenames |
| `.pokemon[].baseName` | `string` | Base Pokémon name (groups forms together) |
| `.pokemon[].summary.sprite` | `string` | Path to sprite, relative to asset root |
| `.pokemon[].summary.types` | `string[]` | Primary typing |
| `.pokemon[].summary.baseStats` | `object` | `{hp, attack, defense, sp_attack, sp_defense, speed}` |
| `.pokemon[].summary.battleSummary.Current.{format}.top` | `object` | Top-ranked item in each category for Current season |
| `.pokemon[].summary.battleSummary.Current.{format}.values` | `object` | All values in each category (top 10) |
| `.pokemon[].battleDataCsvs[]` | `object[]` | All available CSV paths per season+format+date |

### Form handling in the index

Each form gets its own entry with independent `showdownId`, `battleName`, and `baseName`.  
For example, a `pokemon` array entry for Zoroark has:

```json
{
  "name": "Zoroark",
  "showdownId": "zoroark",
  "baseName": "Zoroark",
  "summary": {
    "forms": [
      {"form_name": "Zoroark", "saved_name": "Zoroark", "slug": "zoroark", "types": ["Dark"]},
      {"form_name": "Hisuian Zoroark", "saved_name": "Hisuian Zoroark", "slug": "hisuian-zoroark",
       "types": ["Normal", "Ghost"], "hp": 130, "attack": 120, "defense": 80, ...}
    ]
  }
}
```

### Field path extraction patterns (JS)

```js
// Format: Pokemon name
const showdownId = entry.showdownId;

// Types as array
const types = entry.summary?.types ?? [];

// Base stats
const speed = entry.summary?.baseStats?.speed;

// Current Doubles top move
const topMoveDoubles = entry.summary?.battleSummary?.Current?.Doubles?.top?.move?.name;

// Current Doubles top ability
const topAbilityDoubles = entry.summary?.battleSummary?.Current?.Doubles?.top?.ability?.name;

// Current Doubles top item
const topItemDoubles = entry.summary?.battleSummary?.Current?.Doubles?.top?.held_item?.name;

// Current Doubles teammate
const topTeammate = entry.summary?.battleSummary?.Current?.Doubles?.top?.teammate?.name;

// Sprite URL (after prepending base URL)
const spriteUrl = `https://championsbattledata.com/${entry.summary.sprite}`;

// List of all available daily CSVs
const dailyCsvs = entry.battleDataCsvs.filter(c => c.daily);

// All forms
const forms = entry.summary?.forms ?? [];
```

---

## 2. Pokémon record

**`GET /api/pokemon/{showdownId}?format={format}`**  
**`GET /api/pokemon/{showdownId}?format={format}&season={season}&days={N}`**

Returns a single indexed Pokémon with format-filtered summary. This is a lighter response than the full battle rows.

### Parameters

| Param | Required | Values | Default |
|---|---|---|---|
| `format` | If battle data needed | `Doubles` or `Singles` | (no format-filtered data) |
| `season` | No | `Current`, `M4`, `M5`, `M6` | `Current` |
| `days` | No | 1–31 | (no daily snapshots) |

### JSON shape (with `format=Doubles`)

```json
{
  "name": "Garchomp",
  "battleName": "Garchomp",
  "slug": "garchomp",
  "showdownId": "garchomp",
  "showdownName": "Garchomp",
  "requestedFormat": "Doubles",
  "requestedSeason": "Current",
  "battleDataCsv": {
    "season": "Current",
    "format": "Doubles",
    "path": "pokemon_champions_assets/battle_data/Doubles/Garchomp.csv"
  },
  "dailyBattleDataCsvs": [
    {
      "season": "M4",
      "date": "23_07_2026",
      "format": "Doubles",
      "path": "pokemon_champions_assets/battle_data/M4/23_07_2026/Doubles/Garchomp.csv"
    }
  ],
  "dailyBattleSummary": [
    {
      "season": "M4",
      "date": "23_07_2026",
      "format": "Doubles",
      "source": "pokemon_champions_assets/battle_data/M4/23_07_2026/Doubles/Garchomp.csv",
      "summary": {
        "top": { "move": { "name": "Dragon Claw" } }
      }
    }
  ]
}
```

The `summary` sub-object from the index (`entry.summary`) is also included, giving you `sprite`, `types`, `baseStats`, `forms`, and `battleSummary` for the requested format.

If `season=M4&days=7` is appended, the response includes `dailyBattleSummary` — an array of snapshot summaries (one per day, newest first).

### Behaviour with vs without format param

- **Without `format`**: Returns the Pokémon record with metadata, all CSV paths, and `learnableMoveNames` array (every move the Pokémon can learn — useful for move pickers). **No** battle summary.
- **With `format=Doubles`**: Battle summary is scoped to Doubles usage.
- **With `format=Singles`**: Battle summary is scoped to Singles usage.

Example without format (includes learnableMoveNames):
```js
const res = await fetch('https://championsbattledata.com/api/pokemon/garchomp');
const d = await res.json();
console.log(d.learnableMoveNames); // ~58 moves for Garchomp
```

### Field path extraction

```js
// The current (root) CSV for this Pokémon + format
const currentCsv = data.battleDataCsv.path;
const currentCsvUrl = `https://championsbattledata.com/${currentCsv}`;

// Daily snapshots
const dailySummaries = data.dailyBattleSummary ?? [];
dailySummaries.forEach(d => {
  const { date, season, format, source, summary } = d;
  const topMove = summary?.top?.move?.name;
});
```

---

## 3. Battle data

**`GET /api/battle/{format}/{showdownId}`**  
**`GET /api/battle/{format}/{showdownId}?days={N}`**  
**`GET /api/battle/{format}/{showdownId}?season={season}&days={N}`**

This is the workhorse endpoint — returns parsed rows from the battle-data CSV. Use it to get usage percentages for moves, items, teammates, natures, EV spreads, and abilities.

### Parameters

| Param | Required | Values | Default | Description |
|---|---|---|---|---|
| `format` | Path param | `Doubles` or `Singles` | — | Format scope |
| `showdownId` | Path param | Showdown internal ID | — | Target Pokémon |
| `days` | No | 1–31 | (none → current root folder) | Number of most-recent daily snapshots to include |
| `season` | No | `Current`, `M4`, `M5`, `M6` | (all seasons) | Season folder to search in |

### JSON shape — current data (no `days` param)

```json
{
  "pokemon": "Garchomp",
  "showdownId": "garchomp",
  "format": "Doubles",
  "season": "Current",
  "date": null,
  "source": "pokemon_champions_assets/battle_data/Doubles/Garchomp.csv",
  "columns": [
    "pokemon", "column_position", "category", "rank",
    "name", "percentage", "stat_up", "stat_down",
    "hp_points", "attack_points", "defense_points",
    "sp_atk_points", "sp_def_points", "speed_points"
  ],
  "rows": [
    {
      "pokemon": "Garchomp",
      "column_position": 12,
      "category": "move",
      "rank": 1,
      "name": "Protect",
      "percentage": "77.8%",
      "percentage_value": 77.8,
      "stat_up": "",
      "stat_down": "",
      "hp_points": "",
      "attack_points": "",
      "defense_points": "",
      "sp_atk_points": "",
      "sp_def_points": "",
      "speed_points": ""
    },
    {
      "pokemon": "Garchomp",
      "category": "held_item",
      "rank": 1,
      "name": "Garchompite Z",
      "percentage": "56.5%",
      "percentage_value": 56.5
    },
    {
      "pokemon": "Garchomp",
      "category": "teammate",
      "rank": 1,
      "name": "Sneasler",
      "percentage": "",
      "percentage_value": null
    },
    {
      "pokemon": "Garchomp",
      "category": "stat_alignment",
      "rank": 1,
      "name": "Jolly",
      "percentage": "56.6%",
      "percentage_value": 56.6,
      "stat_up": "Speed",
      "stat_down": "Sp. Atk"
    },
    {
      "pokemon": "Garchomp",
      "category": "stat_points",
      "rank": 1,
      "name": "",
      "percentage": "36.3%",
      "percentage_value": 36.3,
      "hp_points": 2,
      "attack_points": 32,
      "defense_points": 0,
      "sp_atk_points": 0,
      "sp_def_points": 0,
      "speed_points": 32
    },
    {
      "pokemon": "Garchomp",
      "category": "ability",
      "rank": 1,
      "name": "Rough Skin",
      "percentage": "97.8%",
      "percentage_value": 97.8
    }
  ]
}
```

### Row categories

| `category` | What it contains | Percentage gauge |
|---|---|---|
| `move` | Most-used moves | % of sets that include it |
| `held_item` | Most-used held items | % of sets using it |
| `teammate` | Most common teammates | Empty string (no %), `percentage_value: null` |
| `stat_alignment` | Most common natures | % of sets |
| `stat_points` | Most common EV spreads | % of sets; individual stats in `*_points` fields |
| `ability` | Most common abilities | % of sets |

### Daily snapshots (with `days=N`)

```json
{
  "pokemon": "Garchomp",
  "showdownId": "garchomp",
  "format": "Doubles",
  "requestedDays": 7,
  "season": "M4",
  "daily": [
    {
      "season": "M4",
      "date": "23_07_2026",
      "source": "pokemon_champions_assets/battle_data/M4/23_07_2026/Doubles/Garchomp.csv",
      "columns": ["pokemon", "column_position", "category", "rank", "name", "percentage"],
      "rows": [ /* same structure as above */ ]
    }
  ]
}
```

The root-level `rows` array is **empty** when `days=N` is specified — all battle data moves to the `daily[]` array entries, one per day, returned newest-first. If you need both current and daily, make two separate calls.

### Archived seasons

Finished seasons (e.g., `M4`) are flagged with `"archived": true` on their CSV entries. Raw CSV files for archived seasons are **not hosted** on the static server — but every daily row is still available through the JSON API at `/api/battle/{format}/{showdownId}?season=M4&days=N`.

### Field path extraction

```js
// Filter by category
const moves = data.rows.filter(r => r.category === 'move');
const items = data.rows.filter(r => r.category === 'held_item');
const teammates = data.rows.filter(r => r.category === 'teammate');
const natures = data.rows.filter(r => r.category === 'stat_alignment');
const evSpreads = data.rows.filter(r => r.category === 'stat_points');
const abilities = data.rows.filter(r => r.category === 'ability');

// Top item (rank=1)
const topItem = items[0]?.name;

// Top EV spread (parse the _points fields)
const topSpread = evSpreads[0]; // {hp_points, attack_points, defense_points, ...}

// Daily snapshots
const daily3 = data.daily ?? [];
daily3.forEach(day => {
  const topMoves = day.rows.filter(r => r.category === 'move');
});
```

---

## 4. Metadata endpoint

**`GET /api/metadata/{baseName}`**

Returns all forms for a base Pokémon. Request by **base name** (e.g. `tauros`) — the response contains one row per form, each identified by its form-specific `saved_name`.

The `saved_name` is the key to:
- **Sprite paths**: `pokemon_champions_assets/pokemon/{saved_name}.png`
- **Battle data CSVs** (battleName, not saved_name): `battle_data/Doubles/{battleName}.csv`

### Example: `GET /api/metadata/tauros`

```json
{
  "pokemon": "Tauros",
  "source": "pokemon_champions_assets/metadata/Tauros.csv",
  "rows": [
    {
      "title": "Tauros [Paldean Form (Aqua Breed)]",
      "base_name": "Tauros",
      "saved_name": "Paldean Tauros Aqua Breed",
      "types": "Fighting/Water",
      "abilities": "Intimidate|Anger Point|Cud Chew",
      "image_path": "pokemon_champions_assets/pokemon/Paldean Tauros Aqua Breed.png",
      "form": "Paldean Aqua Breed",
      "hp": 150, "atk": 130, "def": 125,
      "spa": 50, "spd": 90, "spe": 120, "total": 610
    },
    {
      "title": "Tauros [Paldean Form (Blaze Breed)]",
      "base_name": "Tauros",
      "saved_name": "Paldean Tauros Blaze Breed",
      "types": "Fighting/Fire",
      "abilities": "Intimidate|Anger Point|Cud Chew",
      "image_path": "pokemon_champions_assets/pokemon/Paldean Tauros Blaze Breed.png",
      "form": "Paldean Blaze Breed",
      "hp": 150, "atk": 130, "def": 125,
      "spa": 50, "spd": 90, "spe": 120, "total": 610
    },
    {
      "title": "Tauros [Paldean Form (Combat Breed)]",
      "base_name": "Tauros",
      "saved_name": "Paldean Tauros Combat Breed",
      "types": "Fighting",
      "abilities": "Intimidate|Anger Point|Cud Chew",
      "image_path": "pokemon_champions_assets/pokemon/Paldean Tauros Combat Breed.png",
      "form": "Paldean Combat Breed",
      "hp": 150, "atk": 130, "def": 125,
      "spa": 50, "spd": 90, "spe": 120, "total": 610
    },
    {
      "title": "Tauros",
      "base_name": "Tauros",
      "saved_name": "Tauros",
      "types": "Normal",
      "abilities": "Intimidate|Anger Point|Sheer Force",
      "image_path": "pokemon_champions_assets/pokemon/Tauros.png",
      "form": "",
      "hp": 150, "atk": 120, "def": 115,
      "spa": 60, "spd": 90, "spe": 130, "total": 610
    }
  ]
}
```

### Key fields

| Field | Meaning |
|---|---|
| `base_name` | Shared name for all forms; matches the metadata filename and route parameter |
| `saved_name` | Form-specific name used for sprite PNGs and CSV files |
| `form` | Human-readable form label, empty string for the base form |
| `abilities` | Pipe-separated list of all abilities for this form |
| `types` | Type string in `"Type/Type"` format |
| `image_path` | Relative path to the sprite image |
| `hp`, `atk`, `def`, `spa`, `spd`, `spe`, `total` | Base stats for this form |

### Use this endpoint when you need

- All stat variants of a base Pokémon to display in a team builder
- The correct `saved_name` to build sprite URLs for each form
- Per-form ability lists (e.g., to show ability options in a selector)

### Field path extraction

```js
// Find specific form
const aquaBreed = data.rows.find(r => r.form === 'Paldean Aqua Breed');
const baseForm = data.rows.find(r => r.form === '');

// Abilities as array
const abilities = baseForm.abilities.split('|'); // ["Intimidate", "Anger Point", "Sheer Force"]

// Sprite URL
const spriteUrl = `https://championsbattledata.com/${baseForm.image_path}`;

// All form names
const formNames = data.rows.map(r => r.saved_name);
```

---

## 5. Name resolution

The API accepts **Pokémon Showdown internal IDs** — lowercase, stripped of punctuation/hyphens, and concatenated for regional forms and variants.

### Rules

| Species name (display) | Showdown internal ID (API) |
|---|---|
| Garchomp | `garchomp` |
| Raichu-Alola (Alolan Raichu) | `raichualola` |
| Incineroar | `incineroar` |
| Arcanine-Hisui (Hisuian Arcanine) | `arcaninehisui` |
| Tauros-Paldea-Aqua-Breed (Paldean Tauros Aqua Breed) | `taurospaldeaaqua` |
| Tauros-Paldea-Blaze-Breed | `taurospaldeablaze` |
| Rotom-Wash | `rotomwash` |
| Basculegion-Female | `basculegionf` |
| Flutter Mane | `fluttermane` | **NOT in Champions API** | Check index for correct ID if added later |
| Raging Bolt | `ragingbolt` | **NOT in Champions API** | Check index for correct ID if added later |
| Urshifu-Rapid-Strike | `urshifurapidstrike` | **NOT in Champions API** | Gen 8/9 DLC — not yet in game |
| Amoonguss | `amoonguss` |

### Algorithm: display name → Showdown ID

1. Start with the Showdown species name (e.g. `Arcanine-Hisui`)
2. Lowercase everything: `arcanine-hisui`
3. Strip all non-alphanumeric characters (hyphens, spaces, apostrophes): `arcaninehisui`

```
function toShowdownId(speciesName) {
  return speciesName.toLowerCase().replace(/[^a-z0-9]/g, '');
}
```

The API is **case-insensitive** — `GARCHOMP` and `garchomp` both work. Route names accept Showdown internal IDs, human-readable names, and site slugs.

### Mapping for the example team (6 known species)

| Display name (Showdown format) | Showdown ID (API) | Battle data CSV name |
|---|---|---|
| `Incineroar` | `incineroar` | `Incineroar.csv` |
| `Raging Bolt` | `ragingbolt` | `Raging Bolt.csv` | ⚠️ NOT in Champions API |
| `Urshifu-Rapid-Strike` | `urshifurapidstrike` | `Urshifu Rapid Strike.csv` | ⚠️ NOT in Champions API |
| `Flutter Mane` | `fluttermane` | `Flutter Mane.csv` | ⚠️ NOT in Champions API |
| `Amoonguss` | `amoonguss` | `Amoonguss.csv` |
| `Arcanine-Hisui` | `arcaninehisui` | `Hisuian Arcanine.csv` *(confirm via index)* |

**NOTE:** The `saved_name` used for CSV filenames and sprite images may differ from the Showdown ID. Use the `battleName` from the index entry to construct raw CSV URLs, and `saved_name` from metadata for sprite URLs.

### How to resolve correctly (recommended implementation)

Always load the **index** once at app startup, then use it as a lookup table:

```js
const index = await (await fetch('https://championsbattledata.com/api')).json();

// Find a Pokémon by any display name
function resolvePokemon(nameOrShowdownId) {
  const normalized = nameOrShowdownId.toLowerCase();
  return index.pokemon.find(p =>
    p.showdownId === normalized ||
    p.showdownName?.toLowerCase() === normalized ||
    p.name.toLowerCase() === normalized ||
    p.slug === normalized
  );
}

// Then use .showdownId for API routes
const entry = resolvePokemon('Arcanine-Hisui');
const battleUrl = `https://championsbattledata.com/api/battle/Doubles/${entry.showdownId}`;
```

### Important: battleName is form-specific

Each form has its own `battleName`, which is used for CSV filenames. This means Hisuian Arcanine has `battleName: "Hisuian Arcanine"` with its own `Hisuian Arcanine.csv`, separate from regular Arcanine's `Arcanine.csv`.

The API uses three naming schemes:

| Concept | Example | Used for |
|---|---|---|
| `showdownId` | `arcaninehisui` | API routes: `/api/battle/Doubles/arcaninehisui` |
| `showdownName` | `Arcanine-Hisui` | Pokémon Showdown's canonical display name |
| `battleName` | `Hisuian Arcanine` | CSV filename: `battle_data/Doubles/Hisuian Arcanine.csv` |
| `saved_name` | `Hisuian Arcanine` | Sprite filename: `pokemon/Hisuian Arcanine.png` |

To construct static asset URLs:

```js
// CSV: use battleName (from index entry) — this IS form-specific
const csvUrl = `https://championsbattledata.com/pokemon_champions_assets/battle_data/Doubles/${encodeURIComponent(entry.battleName)}.csv`;

// Sprite: use saved_name (from metadata entry or form data)
const spriteUrl = `https://championsbattledata.com/pokemon_champions_assets/pokemon/${encodeURIComponent(formData.saved_name)}.png`;
```

Note: `battleName` and `saved_name` are often the same string, but for some Pokemon they differ (base form may have `saved_name` equal to the species name, while the battleName is the same). Always use `battleName` from the index entry or Pokemon record for CSV paths, and `saved_name` from metadata for sprite paths.

---

## 6. Static assets

All static assets are served under `https://championsbattledata.com/pokemon_champions_assets/`.

### Folder structure

```
pokemon_champions_assets/
  battle_data/
    Doubles/
      Garchomp.csv                    <-- current season Doubles
    Singles/
      Garchomp.csv                    <-- current season Singles
    M5/                               <-- season M5 snapshots
      08_09_2026/
        Doubles/Garchomp.csv
        Singles/Garchomp.csv
    M4/                               <-- finished season (archived)
      (CSVs not served individually, use JSON API)
  metadata/
    Tauros.csv                        <-- all forms in one file
  pokemon/
    Tauros.png                        <-- sprite for base form
    Paldean Tauros Aqua Breed.png     <-- sprite for form
  types/
    Dragon.png                        <-- type icons
```

### Direct URLs

```
CSV (current):    /pokemon_champions_assets/battle_data/Doubles/{battleName}.csv
CSV (daily):      /pokemon_champions_assets/battle_data/{season}/{DD_MM_YYYY}/Doubles/{battleName}.csv
Metadata:          /pokemon_champions_assets/metadata/{baseName}.csv
Sprite:            /pokemon_champions_assets/pokemon/{saved_name}.png
Type icon:         /pokemon_champions_assets/types/{TypeName}.png
```

### URL encoding

Sprite and CSV filenames contain spaces. Always `encodeURIComponent()` the filename when constructing URLs in JavaScript.

```js
const spriteUrl = `https://championsbattledata.com/pokemon_champions_assets/pokemon/${encodeURIComponent('Paldean Tauros Aqua Breed')}.png`;
```

### Type icon filenames

Type icons use the type name as written in English with capital first letter: `Dragon.png`, `Fire.png`, `Fighting.png`, `Water.png`, `Ghost.png`, `Normal.png`, etc.

---

## 7. CORS, rate limits, auth

### CORS
✅ **Enabled** — all API endpoints return `Access-Control-Allow-Origin: *`. Works directly from browser fetch.

### Authentication
🔓 **None required** — no API key, no OAuth, no token. All endpoints are public.

### Rate limits
⚠️ **No documented rate limits** — however, the static CSV files and JSON endpoints are production assets. Be reasonable with polling frequency. For periodic data fetch, cache aggressively and poll no more than once per hour.

### Response format
- JSON API endpoints always return `Content-Type: application/json`
- CSV and image endpoints serve with appropriate MIME types
- No `Content-Encoding` specific to the API; standard HTTP/1.1+ caching headers may be added in the future

### Error handling
- 404 is returned if the Pokémon or format is not found
- Malformed requests return descriptive error JSON
- Network errors should be retried with exponential backoff (standard practice for HTTPS APIs)

---

## Appendix A: Name mapping table template

This table should be filled with the user's 34 tracked Pokémon. The 6 known species from the project's example team are provided.

| # | Display name | Showdown internal ID (`showdownId`) | Base name (`baseName`) | Battle name (`battleName`) | Has forms? |
|---|---|---|---|---|---|
| 1 | Incineroar | `incineroar` | Incineroar | Incineroar | No |
| 2 | Raging Bolt | `ragingbolt` | Raging Bolt | Raging Bolt | No |
| 3 | Urshifu-Rapid-Strike | `urshifurapidstrike` | Urshifu | Urshifu Rapid Strike | Yes (2 styles) |
| 4 | Flutter Mane | `fluttermane` | Flutter Mane | Flutter Mane | No |
| 5 | Amoonguss | `amoonguss` | Amoonguss | Amoonguss | No |
| 6 | Arcanine-Hisui | `arcaninehisui` | Arcanine | Arcanine | Yes (regular + Hisuian) |

### Name resolution helper functions

```js
// After loading the index:
function getShowdownId(displayName) {
  const entry = index.pokemon.find(p =>
    p.showdownName?.toLowerCase() === displayName.toLowerCase() ||
    p.name.toLowerCase() === displayName.toLowerCase() ||
    p.showdownId === displayName.toLowerCase().replace(/[^a-z0-9]/g, '')
  );
  return entry?.showdownId;
}

function getBattleName(showdownId) {
  return index.pokemon.find(p => p.showdownId === showdownId)?.battleName;
}

function getSpriteUrl(showdownId) {
  const entry = index.pokemon.find(p => p.showdownId === showdownId);
  return entry?.summary?.sprite
    ? `https://championsbattledata.com/${entry.summary.sprite}`
    : null;
}
```

> **Note:** The complete table for all 34 species should be generated by iterating the user's species list through the index lookup at app initialization.

---

## Appendix B: Season reference

| Season | Status | Date range (approx) | Note |
|---|---|---|---|
| `Current` | Active latest | Ongoing | Root `Doubles/` and `Singles/` folders |
| `M6` | Active | Sep 2026 | Current season being collected |
| `M5` | Recent | Aug–Sep 2026 | Finished, CSVs still hosted |
| `M4` | Archived | Jul 2026 | CSVs **not hosted**, use JSON API |

Daily CSVs for the current season are hosted individually under `{Season}/{DD_MM_YYYY}/{Format}/{battleName}.csv`.

---

## Appendix C: Field reference (quick lookup)

```
index.pokemon[].showdownId           — API route ID
index.pokemon[].showdownName         — Showdown display name
index.pokemon[].battleName           — CSV filename (base form name)
index.pokemon[].baseName             — Form grouping key
index.pokemon[].summary.sprite       — Relative sprite path
index.pokemon[].summary.types[]      — Type array
index.pokemon[].summary.baseStats    — {hp, attack, defense, sp_attack, sp_defense, speed}
index.pokemon[].summary.forms[]      — Array of all form variants

/api/battle/:format/:id -> .rows[].category  — "move" | "held_item" | "teammate" | "stat_alignment" | "stat_points" | "ability"
/api/battle/:format/:id -> .rows[].rank      — 1-based position
/api/battle/:format/:id -> .rows[].name      — the move/item/ability/nature/teammate name
/api/battle/:format/:id -> .rows[].percentage         — string like "90.3%"
/api/battle/:format/:id -> .rows[].percentage_value   — number like 90.3 (null for teammates)

/api/metadata/:base -> .rows[].base_name     — groups forms together
/api/metadata/:base -> .rows[].saved_name    — sprite/CSV path segment
/api/metadata/:base -> .rows[].image_path    — sprite relative path
/api/metadata/:base -> .rows[].form          — human-readable form label
/api/metadata/:base -> .rows[].abilities     — pipe-delimited ability list
/api/metadata/:base -> .rows[].hp, .atk, .def, .spa, .spd, .spe, .total  — base stats
```

---

Generated 2026-09-12 for the Pokémon Box Manager project.  
Source: [championsbattledata.com/api_guide](https://championsbattledata.com/api_guide) + live API responses.

---

## Appendix: MVP Roster Name Mapping

The 34 Pokémon in the initial roster, with their user-facing name, Showdown ID (used in Champions API routes), and PokéAPI name.

| User-facing name | Showdown ID | PokéAPI name |
|---|---|---|
| Wigglytuff | `wigglytuff` | wigglytuff |
| Persian | `persian` | persian |
| Alolan Persian | `persianalola` | persian-alola |
| Farfetch'd | `farfetchd` | farfetchd |
| Mr. Mime | `mrmime` | mr-mime |
| Swalot | `swalot` | swalot |
| Salamence | `salamence` | salamence |
| Gogoat | `gogoat` | gogoat |
| Golisopod | `golisopod` | golisopod |
| Rillaboom | `rillaboom` | rillaboom |
| Cinderace | `cinderace` | cinderace |
| Inteleon | `inteleon` | inteleon |
| Thievul | `thievul` | thievul |
| Toxtricity (Amped) | `toxtricity` | toxtricity |
| Toxtricity (Low Key) | `toxtricitylowkey` | toxtricity-low-key |
| Grapploct | `grapploct` | grapploct |
| Perrserker | `perrserker` | perrserker |
| Sirfetch'd | `sirfetchd` | sirfetchd |
| Pincurchin | `pincurchin` | pincurchin |
| Indeedee (Male) | `indeedee` | indeedee |
| Indeedee (Female) | `indeedeef` | indeedee-female |
| Pawmot | `pawmot` | pawmot |
| Arboliva | `arboliva` | arboliva |
| Squawkabilly (Green) | `squawkabilly` | squawkabilly |
| Squawkabilly (Blue) | `squawkabillyblue` | squawkabilly-blue |
| Squawkabilly (Yellow) | `squawkabillyyellow` | squawkabilly-yellow |
| Squawkabilly (White) | `squawkabillywhite` | squawkabilly-white |
| Mabosstiff | `mabosstiff` | mabosstiff |
| Baxcalibur | `baxcalibur` | baxcalibur |
| Mega Salamence | `salamencemega` | salamence-mega |
| Mega Golisopod | `golisopodmega` | golisopod-mega |
| Mega Baxcalibur | `baxcaliburmega` | baxcalibur-mega |
| Mega Absol Z | `absolzmega` | absol-z |
| Mega Garchomp Z | `garchompzmega` | garchomp-z |
| Mega Lucario Z | `lucariozmega` | lucario-z |

**Name rules:** Showdown IDs are lowercase, no hyphens/apostrophes, region suffix appended directly (e.g. `persian` → `persianalola`). Verify new IDs against `GET /api/pokemon/{id}?format=Doubles` before use.