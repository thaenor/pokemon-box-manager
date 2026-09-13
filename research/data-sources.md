# Competitive Data Sources — Research Findings

> **Context:** Issue #3 — Research free data sources for Pokémon competitive battling.
> **Goal:** Evaluate each source's suitability for an offline-first PWA (Pokemon Box Manager).

---

## 1. PokéAPI

| Field           | Value                                                                           |
| --------------- | ------------------------------------------------------------------------------- |
| **URL**         | https://pokeapi.co/                                                             |
| **Docs**        | https://pokeapi.co/docs/v2                                                      |
| **Auth**        | None (public, no API key)                                                       |
| **Rate limits** | None (removed after move to static hosting in Nov 2018; 100/hr GraphQL variant) |
| **Data format** | RESTful JSON                                                                    |
| **License**     | Custom (free, no explicit commercial restriction)                               |

**What it provides:**

- Pokémon species + individual Pokémon data (all 1008+ species + forms)
- Regional forms: **Alolan, Galarian, Hisuian, Paldean** — covered as varieties/forms under species
- Sprites/artwork (URL references, not embedded binaries)
- Base stats, types, abilities, moves, evolution chains, egg groups, flavor text
- Items, berries, locations, machines (TMs/HMs)
- All generations (1–9)

**What it DOESN'T provide:**

- No competitive usage/viability data
- No moveset popularity, EV spreads, item distributions
- No tier rankings or format data
- No damage calculation data

**Reliability:** Excellent. 50B+ calls/month served. Static-hosted, community-maintained, open-source. No uptime SLA but widely relied upon.

**PWA suitability:** ✅ **Excellent for initial sync** (pre-cache all needed resources into IndexedDB). Serve from local storage, not live API.

---

## 2. Smogon Stats / @pkmn Ecosystem

| Field           | Value                                                 |
| --------------- | ----------------------------------------------------- |
| **URLs**        | https://www.smogon.com/stats/ (raw monthly dumps)     |
|                 | https://data.pkmn.cc/stats/ (processed JSON)          |
|                 | https://github.com/pkmn/smogon (community wrapper)    |
| **Auth**        | None (public files)                                   |
| **Rate limits** | None documented (be conservative; cache aggressively) |
| **Data format** | Raw: `.txt` + `chaos.json`; Processed: JSON           |

**What it provides:**

- Monthly usage percentages per Pokémon per tier (Singles: OU/UU/RU/NU/PU/LC; Doubles: Doubles OU/UU)
- Moveset usage rates, item distributions, ability splits
- EV spread distributions and common natures
- Teammate co-occurrence statistics
- Lead statistics, metagame reports
- **Tier ranking** (usage-based; actual tiering decisions are separate)
- All generations with active ladder (Gen 5–9 currently)

**Formats available (Gen 9 examples):**

- Singles: `gen9ou`, `gen9uu`, `gen9ubers`, `gen9nationaldex`, `gen9monotype`
- Doubles: `gen9doublesou`, `gen9doublesuu`
- Other: `gen9lc` (Little Cup), `gen9anythinggoes`, past generations

**Reliability:** Good aggregate data but no official API — Smogon can change file formats. The `@pkmn` wrapper provides stability. Data is monthly snapshots, not real-time.

**Community usage-stats API (unofficial):**

- `https://smogon-usage-stats.herokuapp.com/gen9ou/clefable` — simple per-Pokémon endpoint (may be defunct; Heroku sunset)
- Better to use raw `data.pkmn.cc/stats/` JSON directly

**PWA suitability:** ✅ **Excellent** — pre-cache monthly chaos.json or processed JSON for relevant formats. Bundle only needed tiers.

---

## 3. Pikalytics

| Field            | Value                                                            |
| ---------------- | ---------------------------------------------------------------- |
| **URL**          | https://www.pikalytics.com/                                      |
| **AI endpoints** | `GET /ai/pokedex/{format}`, `GET /ai/pokedex/{format}/{pokemon}` |
| **Auth**         | None (public Markdown endpoints)                                 |
| **Rate limits**  | None documented (use conservative rates + caching)               |
| **Data format**  | Markdown (AI endpoints); JSON-LD embedded on HTML pages          |

**What it provides:**

- Usage percentages and rankings per format
- Best moves with usage %, abilities, items, EV spreads, natures
- Teammates, counters/checks, team compositions
- Tera types (Gen 9)
- Win rates and records (tournament data)
- Formats: VGC 2025/2026, Gen 9 OU/Ubers, Battle Stadium, Doubles OU, National Dex, Monotype, Pokémon GO PvP, older VGC seasons
- Tournament-specific pages (limitless integration)

**Data sources (as stated by Pikalytics):**

1. Pokémon HOME Battle Stadium ranked ladder
2. Pokémon Showdown (Smogon)
3. RK9 Tournament data (official VGC team sheets)
4. Pokémon GO PvP

**Reliability:** Good aggregate data. Public Markdown endpoints are new (2025); no uptime guarantees. Site has been active since 2017.

**PWA suitability:** ✅ **Good for metagame snapshots** — /ai/pokedex endpoint returns structured Markdown. Parse server-side, cache in app. Not suitable as live browser dependency.

---

## 4. Pokémon Showdown Data Files

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| **URL**         | https://play.pokemonshowdown.com/data/     |
| **GitHub**      | https://github.com/smogon/pokemon-showdown |
| **Auth**        | None (public static files)                 |
| **Rate limits** | None documented (be respectful)            |
| **Data format** | JS modules + JSON                          |

**What it provides (publicly served at `/data/`):**

| File              | Size     | Content                                                   |
| ----------------- | -------- | --------------------------------------------------------- |
| `pokedex.json`    | 512 KiB  | All species: stats, types, abilities, base species, forms |
| `moves.json`      | 479 KiB  | All moves: type, power, accuracy, PP, category, effects   |
| `abilities.js`    | 106 KiB  | All abilities with descriptions                           |
| `items.js`        | 152 KiB  | All items with effects                                    |
| `learnsets.json`  | 3.04 MiB | Egg moves, TMs, tutor, level-up moves per species+form    |
| `formats-data.js` | 69 KiB   | Tier banlists, clauses, format rules                      |
| `formats.js`      | 157 KiB  | Format definitions, tiers, ladder data                    |
| `typechart.js`    | 4 KiB    | Type effectiveness chart                                  |
| `aliases.js`      | 56 KiB   | Name aliases (different lang, form suffixes)              |
| `graphics.js`     | 704 KiB  | All sprites (icons)                                       |

**Reliability:** Excellent. These files ship with every Pokémon Showdown client and are updated with every game release. Always current.

**PWA suitability:** ✅ **Ideal** — JSON files can be bundled directly into the PWA or fetched at build time. `pokedex.json`, `moves.json`, `typechart.js` (type chart), `items.js`, and `abilities.js` together cover all static game data needed.

---

## 5. Pokékipe

| Field           | Value                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| **URL**         | https://pokekipe.com/api                                                    |
| **Docs**        | https://pokekipe.com/api-reference-frame.html                               |
| **Auth**        | Optional (60req/min anonymous; 600req/min with free key; 5K/day → 100K/day) |
| **Rate limits** | Published: 60/min, 5,000/day anonymous; 600/min, 100K/day authenticated     |
| **Data format** | RESTful JSON                                                                |
| **License**     | CC BY 4.0                                                                   |

**What it provides:**

- 100+ endpoints for competitive analytics
- Smogon usage stats parsed and enriched
- Per-format Pokémon stats, moves, items, abilities, spreads
- Tournament data (VGC, Smogon Tour)
- Historic data (monthly snapshots)
- Rate limit headers: `X-RateLimit-Remaining-Min`, `X-RateLimit-Remaining-Day`, `Retry-After`

**Reliability:** Good. Clear rate limits, has versioning (v1), OpenAPI 3 spec, well-documented. Active project.

**PWA suitability:** ✅ **Good** — well-designed API for fetch-on-demand. However, an offline-first PWA should still pre-cache key data rather than rely on live calls for core functionality. Use for supplemental/real-time lookups.

---

## 6. Bulbapedia Scraping

| Field             | Value                                                      |
| ----------------- | ---------------------------------------------------------- |
| **URL**           | https://bulbapedia.bulbagarden.net/                        |
| **MediaWiki API** | `https://bulbapedia.bulbagarden.net/w/api.php`             |
| **Auth**          | User-agent recommended; no API key                         |
| **Rate limits**   | Per MediaWiki standard (unregistered: ~500 req/min per IP) |

**What it provides:**

- The most complete wiki coverage of Pokémon data
- Official artwork, detailed form differences
- Game locations, encounter rates
- Detailed flavor text, anime references

**PWA suitability:** ⚠️ **Not recommended as primary source.** Data is unstructured HTML. MediaWiki API can extract text, but parsing is fragile. PokéAPI already covers this data better. Use only for:

- Official high-res artwork (but these are Nintendo IP — check redistribution)
- Data not yet in PokéAPI (very rare)
- Supplementary flavor text

---

## 7. Other Sources

| Source                       | URL                                      | Usefulness         | Note                                                                             |
| ---------------------------- | ---------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| **data.pkmn.cc**             | https://data.pkmn.cc/                    | ✅ Excellent       | Curated datasets: analyses, formats, sets, stats, teams — efficient batch access |
| **@pkmn/data** (npm)         | https://www.npmjs.com/package/@pkmn/data | ✅ Excellent       | TypeScript/JS library for parsing Showdown data — MIT license                    |
| **Pokémon Showdown replays** | https://replay.pokemonshowdown.com/      | ⚠️ Research only   | Replay logs; bulk download for analysis; not suitable for runtime                |
| **Metamon datasets**         | https://github.com/UT-Austin-RPL/metamon | ⚠️ Research only   | Million-battle datasets for ML; too large for PWA                                |
| **Trainer Tower**            | https://trainertower.com/                | ⚠️ Manual curation | VGC tournament results, rental teams; no API; scrape with permission             |
| **Victory Road**             | https://victoryroadvgc.com/              | ⚠️ Manual curation | Tournament articles, usage trends; editorial content, no API                     |
| **Limitless TCG**            | https://play.limitlesstcg.com/           | ⚠️ Manual curation | Tournament team sheets; no public API for VGC                                    |

---

## Recommendations for Pokémon Box Manager

### Primary data sources (in order of importance)

| #     | Source                                | What to use                                                                                | Pre-caching strategy                                                                                 |
| ----- | ------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **1** | **Pokémon Showdown `/data/` files**   | `pokedex.json`, `moves.json`, `abilities.js`, `items.js`, `typechart.js`, `learnsets.json` | **Bundle at build time.** JSON files are 500KB–3MB each, ideal for offline.                          |
| **2** | **Smogon usage stats (data.pkmn.cc)** | Monthly usage JSON per format (e.g. `gen9ou.json`)                                         | **Pre-cache latest 1-2 months** for supported formats. Update via background sync.                   |
| **3** | **PokéAPI**                           | Sprites (get sprite URLs), form data, species data not in Showdown                         | Use for **initial sync only** — fetch and cache sprites + species details, then go offline.          |
| **4** | **Pikalytics AI endpoints**           | Metagame usage, movesets, items for current regulation                                     | **Server-side fetch + cache** — not directly from browser. Use for "what's meta right now" features. |

### Offline-first architecture

```
PWA Build Pipeline
├── Bundle Showdown data (pokedex.json, moves.json, etc.)
├── Pre-cache 2 months of Smogon stats (selected formats)
├── Load PokéAPI data once (sprites, forms, species)
└── Ship as versioned data package

Runtime (in browser)
├── IndexedDB: Pokémon, moves, abilities, items, types
├── Cache: sprites, usage stats, team data
├── Service Worker: serve from cache, stale-while-revalidate
└── Background sync: refresh Smogon stats, Pikalytics snapshots
```

### What to pre-cache for offline use

- **~1.5 MB** — Basic Pokédex (species, stats, types, abilities from Showdown pokedex.json)
- **~500 KB** — All moves (moves.json with type/power/accuracy/PP/category)
- **~150 KB** — All items (items.js)
- **~100 KB** — All abilities (abilities.js)
- **~4 KB** — Type chart (typechart.js)
- **~100–500 KB** — 1-2 monthly usage stat snapshots
- **~2–10 MB** — Sprite images (once from PokéAPI or Showdown icons)

**Total offline bundle: ~5–15 MB**

### Key caveats

- **Licensing:** Showdown data is MIT licensed. Pikalytics data is website content (partial CC). PokéAPI is custom free license. Pokékipe is CC BY 4.0. Nintendo IP (Pokémon names, sprites) cannot be re-sold but generally tolerated for non-commercial tools.
- **No real-time:** All competitive stats are monthly snapshots, not live ladder data. Design for "last month's meta" refresh cycle.
- **Sprite sourcing:** PokéAPI provides official sprite URLs. Showdown provides mini icons (`pokedex-mini-bw.js`, `graphics.js`). Neither provides binaries you can bundle — you must cache sprites at runtime.
- **Form completeness:** PokéAPI covers regional forms as species varieties. Showdown's `pokedex.json` includes form data (e.g. `Rotom-Wash`, `Toxtricity-Low-Key`). Validate coverage for Hisuian/Paradox forms.
