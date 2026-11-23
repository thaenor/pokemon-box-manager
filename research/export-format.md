# Pokémon Team Export Formats

Research for Pokémon Box Manager, September 12, 2026. [Issue #4](https://github.com/thaenor/pokemon-box-manager/issues/4).

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Existing Formats Overview](#existing-formats-overview)
   - [Pokemon Showdown Export (Pokepaste)](#1-pokemon-showdown-export-aka-pokepaste)
   - [Pokemon Showdown JSON](#2-pokemon-showdown-json)
   - [Pokemon Showdown Packed](#3-pokemon-showdown-packed)
   - [Custom JSON/YAML Schemas](#4-custom-jsonyaml-schemas)
3. [Handling Regional Variants](#handling-regional-variants)
4. [Recommended Format](#recommended-format)
5. [Concrete Example](#concrete-example)
6. [Implementation Notes](#implementation-notes)
7. [Sources](#sources)

---

## Executive Summary

The **Pokémon Showdown Export format** (commonly called _Pokepaste_) is the unambiguous recommendation. It is the universal format used by the competitive Pokémon community (Smogon, VGC, Pokémon Showdown), handles all edge cases including regional variants, and requires no external tooling to produce or consume. Export JSON format is recommended as an internal/structured interchange format for programmatic use.

---

## Existing Formats Overview

Pokémon Showdown defines three canonical team formats ([source](https://github.com/smogon/pokemon-showdown/blob/master/sim/TEAMS.md)).

### 1. Pokemon Showdown Export (aka Pokepaste)

**Purpose:** Human-readable import/export (the "teambuilder" format users see).

**Strengths:**

- Universally understood by the competitive community — Smogon forums, VGC players, Discord servers
- Every existing Pokémon MCP server and tool produces/consumes this format
- Single text block, copy-pasteable into any chat
- pokepast.es and other sites render sprites from it inline

**Syntax (from [official spec](https://pokepast.es/syntax.html)):**

```
Nickname (Species) (Gender) @ Item
Ability: AbilityName
Level: N
Shiny: Yes/No
Tera Type: Type
EVs: X HP / X Atk / X Def / X SpA / X SpD / X Spe
IVs: X HP / X Atk / X Def / X SpA / X SpD / X Spe
Nature Nature
- Move 1
- Move 2
- Move 3
- Move 4
```

**Key rules:**

- Pokémon are separated by one or more blank lines (typically 6 per team)
- All fields except species name are optional with sensible defaults
- EVs default to 0, IVs default to 31, level defaults to 100 (50 for VGC)
- Only non-default IVs need to be listed
- Moves may use `Hidden Power [Type]` syntax for clarity
- Gender is `(M)` or `(F)` after species name (no space before nickname)

### 2. Pokemon Showdown JSON

**Purpose:** Internal codebase representation; structured programmatic interchange.

**Strengths:**

- Machine-parseable by default
- Used internally by Pokémon Showdown (`PokemonSet[]` type)
- Lossless — no ambiguity in stat keys
- Direct conversion to/from export format via `Teams.export()` / `Teams.import()`

**Schema:**

```json
{
  "name": "", // nickname (empty string = no nickname)
  "species": "Arcanine-Hisui", // full species name including forme
  "gender": "M", // "M", "F", or ""
  "item": "Heavy-Duty Boots", // held item name
  "ability": "Intimidate", // ability name
  "moves": ["Flare Blitz", "Head Smash", "Will-O-Wisp", "Extreme Speed"],
  "nature": "Adamant",
  "evs": {
    "hp": 252,
    "atk": 252,
    "def": 0,
    "spa": 0,
    "spd": 0,
    "spe": 4
  },
  "ivs": {
    "hp": 31,
    "atk": 31,
    "def": 31,
    "spa": 31,
    "spd": 31,
    "spe": 31
  },
  "level": 50,
  "shiny": false,
  "teraType": "Fire",
  "happiness": 255,
  "gigantamax": false,
  "pokeball": "",
  "hpType": ""
}
```

### 3. Pokemon Showdown Packed

**Purpose:** Compressed string for network transmission, server storage, and logging.

**Format:** Pipe-delimited fields, `]`-delimited Pokémon.

```
NICKNAME|SPECIES|ITEM|ABILITY|MOVES|NATURE|EVS|GENDER|IVS|SHINY|LEVEL|HAPPINESS,POKEBALL,HPTYPE,GIGANTAMAX,DYNAMAXLEVEL,TERATYPE]
```

**Example:**

```
||Arcanine-Hisui||intimidate|heavydutyboots|flareblitz,headsmash,willowisp,extremespeed|Adamant|252,252,,,4,|M|,,31,31,31,31,31,31||50|
```

**Verdict:** Best suited to compact storage and transmission.

### 4. Custom JSON/YAML Schemas

**Considered but rejected for the primary export format:**

- **Raw PokéAPI JSON** — overly verbose, includes unnecessary fields, no standard team representation
- **YAML** — less commonly used in the Pokémon community; no existing tooling
- **Custom flat formats** — no interoperability; reinventing the wheel

**When to use JSON:** Showdown JSON is useful for tools that need structured team data.

---

## Handling Regional Variants

Pokémon Showdown represents regional variants using a **`-Suffix`** pattern on the species name ([source](https://github.com/smogon/pokemon-showdown/blob/master/sim/dex-species.ts)):

| Variant                 | Export Format Species Name |
| ----------------------- | -------------------------- |
| Alolan Marowak          | `Marowak-Alola`            |
| Alolan Raichu           | `Raichu-Alola`             |
| Galarian Moltres        | `Moltres-Galar`            |
| Galarian Slowbro        | `Slowbro-Galar`            |
| Hisuian Arcanine        | `Arcanine-Hisui`           |
| Hisuian Decidueye       | `Decidueye-Hisui`          |
| Paldean Tauros (Combat) | `Tauros-Paldea-Combat`     |
| Paldean Tauros (Blaze)  | `Tauros-Paldea-Blaze`      |

**Aliases are also accepted** ([source](https://github.com/smogon/pokemon-showdown/blob/master/data/aliases.ts)):

- `harc` → `Arcanine-Hisui`
- `alowak` → `Marowak-Alola`
- `gmolt` / `goltres` → `Moltres-Galar`
- `hamurott` → `Samurott-Hisui`

**How the export format handles them — simply use the full species name on the first line:**

```
Arcanine-Hisui @ Heavy-Duty Boots
Ability: Intimidate
Tera Type: Fire
EVs: 252 Atk / 4 SpD / 252 Spe
Adamant Nature
- Flare Blitz
- Head Smash
- Extreme Speed
- Will-O-Wisp
```

This is unambiguous: the parser sees `Arcanine-Hisui`, looks up the species, and knows it's a Rock/Fire type with different base stats from standard Arcanine.

**In JSON format:**

```json
{ "species": "Arcanine-Hisui", ... }
```

---

## Recommended Format

### Primary: Pokémon Showdown Export (Pokepaste)

Use this format for:

- **Exporting teams** for the user to paste into pokepast.es or Pokémon Showdown
- **Displaying team data** in the UI (read-only or editable text blocks)
- **Sharing** via chat, forum, or clipboard

### Secondary: Pokémon Showdown JSON

Use this format for:

- **Programmatic manipulation** (sorting, filtering, transforming teams)
- **Round-trip safety** — parse once, validate, then export to any format

### Conversion Strategy

```
Export Format (shareable text)
        ↕ Teams.export() / Teams.import()
Showdown JSON (structured team data)
        ↕ Teams.pack() / Teams.unpack()
Packed Format (storage optimization, network)
```

Showdown provides conversion between these formats. The box manager uses its own JSON backup format.

---

## Concrete Example

### A full 6-Pokémon VGC team in the recommended Export format:

```
Incineroar @ Sitrus Berry
Ability: Intimidate
Tera Type: Ghost
EVs: 252 HP / 124 Def / 132 SpD
Careful Nature
- Flare Blitz
- Knock Off
- Parting Shot
- Fake Out

Raging Bolt @ Booster Energy
Ability: Protosynthesis
Tera Type: Electric
EVs: 252 HP / 20 Def / 4 SpA / 4 SpD / 228 Spe
Timid Nature
IVs: 0 Atk
- Thunderclap
- Draco Meteor
- Thunderbolt
- Protect

Urshifu-Rapid-Strike @ Focus Sash
Ability: Unseen Fist
Tera Type: Water
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Surging Strikes
- Close Combat
- Aqua Jet
- Protect

Flutter Mane @ Booster Energy
Ability: Protosynthesis
Tera Type: Fairy
EVs: 76 HP / 116 Def / 116 SpA / 4 SpD / 196 Spe
Timid Nature
IVs: 0 Atk
- Moonblast
- Shadow Ball
- Icy Wind
- Protect

Amoonguss @ Mental Herb
Ability: Regenerator
Tera Type: Water
EVs: 244 HP / 156 Def / 108 SpD
Sassy Nature
IVs: 0 Atk / 0 Spe
- Rage Powder
- Spore
- Pollen Puff
- Protect

Arcanine-Hisui @ Clear Amulet
Ability: Intimidate
Tera Type: Normal
EVs: 252 HP / 116 Atk / 4 Def / 28 SpD / 108 Spe
Adamant Nature
- Flare Blitz
- Head Smash
- Extreme Speed
- Will-O-Wisp
```

**Same team in JSON (internal format):**

```json
[
  {
    "name": "",
    "species": "Incineroar",
    "item": "Sitrus Berry",
    "ability": "Intimidate",
    "moves": ["Flare Blitz", "Knock Off", "Parting Shot", "Fake Out"],
    "nature": "Careful",
    "evs": { "hp": 252, "atk": 0, "def": 124, "spa": 0, "spd": 132, "spe": 0 },
    "ivs": { "hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31 },
    "level": 50,
    "teraType": "Ghost"
  },
  {
    "name": "",
    "species": "Raging Bolt",
    "item": "Booster Energy",
    "ability": "Protosynthesis",
    "moves": ["Thunderclap", "Draco Meteor", "Thunderbolt", "Protect"],
    "nature": "Timid",
    "evs": { "hp": 252, "atk": 0, "def": 20, "spa": 4, "spd": 4, "spe": 228 },
    "ivs": { "hp": 31, "atk": 0, "def": 31, "spa": 31, "spd": 31, "spe": 31 },
    "level": 50,
    "teraType": "Electric"
  },
  {
    "name": "",
    "species": "Urshifu-Rapid-Strike",
    "item": "Focus Sash",
    "ability": "Unseen Fist",
    "moves": ["Surging Strikes", "Close Combat", "Aqua Jet", "Protect"],
    "nature": "Jolly",
    "evs": { "hp": 0, "atk": 252, "def": 0, "spa": 0, "spd": 4, "spe": 252 },
    "ivs": { "hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31 },
    "level": 50,
    "teraType": "Water"
  },
  {
    "name": "",
    "species": "Flutter Mane",
    "item": "Booster Energy",
    "ability": "Protosynthesis",
    "moves": ["Moonblast", "Shadow Ball", "Icy Wind", "Protect"],
    "nature": "Timid",
    "evs": { "hp": 76, "atk": 0, "def": 116, "spa": 116, "spd": 4, "spe": 196 },
    "ivs": { "hp": 31, "atk": 0, "def": 31, "spa": 31, "spd": 31, "spe": 31 },
    "level": 50,
    "teraType": "Fairy"
  },
  {
    "name": "",
    "species": "Amoonguss",
    "item": "Mental Herb",
    "ability": "Regenerator",
    "moves": ["Rage Powder", "Spore", "Pollen Puff", "Protect"],
    "nature": "Sassy",
    "evs": { "hp": 244, "atk": 0, "def": 156, "spa": 0, "spd": 108, "spe": 0 },
    "ivs": { "hp": 31, "atk": 0, "def": 31, "spa": 31, "spd": 31, "spe": 0 },
    "level": 50,
    "teraType": "Water"
  },
  {
    "name": "",
    "species": "Arcanine-Hisui",
    "item": "Clear Amulet",
    "ability": "Intimidate",
    "moves": ["Flare Blitz", "Head Smash", "Extreme Speed", "Will-O-Wisp"],
    "nature": "Adamant",
    "evs": { "hp": 252, "atk": 116, "def": 4, "spa": 0, "spd": 28, "spe": 108 },
    "ivs": { "hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31 },
    "level": 50,
    "teraType": "Normal"
  }
]
```

---

## Implementation Notes

The Box Manager exports JSON backups and Pokémon Showdown text. Import accepts Box Manager JSON backups. For a backup you plan to restore, choose **JSON** in the export dialog and paste the copied text into **Import**.

---

## Sources

- [Pokepaste Syntax HOWTO](https://pokepast.es/syntax.html) — Official format spec
- [Pokémon Showdown TEAMS.md](https://github.com/smogon/pokemon-showdown/blob/master/sim/TEAMS.md) — Canonical format documentation
- [Pokemon Showdown dex-species.ts](https://github.com/smogon/pokemon-showdown/blob/master/sim/dex-species.ts) — Regional variant handling in species lookup
- [Pokemon Showdown aliases.ts](https://github.com/smogon/pokemon-showdown/blob/master/data/aliases.ts) — Community alias mapping
- [Pokemon Showdown teams.ts](https://github.com/smogon/pokemon-showdown/blob/master/sim/teams.ts) — Reference implementation of export/import/pack/unpack
- [ts-pokeapi Showdown utility](https://jaflesch.github.io/ts-pokeapi/docs/utils/showdown/) — TypeScript format() implementation
- [Pokepaste Guide (Pok Universe)](https://pokuniverse.com/knowledge-base/pokepaste-guide/) — Community usage documentation
