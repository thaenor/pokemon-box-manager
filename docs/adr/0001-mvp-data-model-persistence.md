# ADR-0001: MVP Data Model & Persistence Strategy

**Status:** Accepted
**Date:** 2026-09-13
**Deciders:** Essentialist, Hermes Agent

## Context

Ticket #6 (Box Data Model & UI) requires decisions on how Pokémon data is stored, persisted, and resolved in the Pokémon Box Manager MVP. The app is a client-side SPA hosted on Firebase Hosting with an existing Firestore config but no auth or persistence logic.

Key questions:
- How does the user authenticate and own their data?
- Where does saved box data live between sessions?
- How much Pokémon data is stored locally vs. fetched live from PokéAPI?
- Which fields make the MVP cut?
- How does the box structure handle multiple boxes?

## Decision

### 1. No auth — localStorage only

The MVP uses **zero authentication**. All box data is persisted to the browser's `localStorage`. Firestore is not used for MVP. This eliminates the need for auth UI, security rules, and backend persistence infrastructure.

### 2. Two localStorage keys

- `pokemon-box:slots` — serialized array of saved Pokémon objects (the 30-slot box)
- `pokemon-box:cache` — key-value map of trimmed PokéAPI responses, keyed by species name

The cache and the box have different lifetimes and purposes. Separating them prevents a cache clear from destroying saved Pokémon, and vice versa.

### 3. Saved Pokémon schema (MVP)

Each slot stores a resolved object (not just identifiers):

```js
{
  species: { id, name, showdownId, types, isMega, isUltra },
  showdownId, nickname, sprite, spriteShiny, isShiny,
  stats: { hp, attack, defense, spAttack, spDefense, speed },
  abilities: ['Blaze', 'Solar Power'],
  ability: 'Blaze',
  nature: 'Timid',
  recruitedDate: 'YYYY-MM-DD'
}
```

**Excluded from MVP:** `moves`, `heldItem`, `isTrial`, `source`. These will be added in future tickets when the data model for each is better understood.

### 4. Save timing

Auto-save on every box mutation (add, delete, reorder). No manual save button. The box is small (30 slots, ~15KB JSON) so writes are instant.

### 5. PokéAPI cache strategy

`fetchPokemon()` is wrapped to cache a **trimmed subset** of the API response — species info, base stats, abilities list, sprite URLs. Not the full verbose API response. Sprite **URLs** are stored, not base64 images.

On first fetch of a species: live API call → cache → render.
On repeat fetch: cache hit → render instantly.
On cache miss (cleared, corrupted, first visit): gracefully fall back to live API call.

### 6. Single box

A single 30-slot box. No multi-box navigation for MVP. The `BOX 01 / 01` header signals a single box.

### 7. Champions API

Deferred to a follow-up ticket. The 5 Champions-exclusive forms (Mega Golisopod, Mega Baxcalibur, Absol Z, Garchomp Z, Lucario Z) remain as a noted gap.

## Consequences

**Positive:**
- Zero backend cost and zero auth friction for users
- Page loads are instant once species have been cached
- Simple architecture — two localStorage keys, no async persistence pipeline
- Easy to add auth + Firestore later (the existing `firebase-config.js` is already wired)

**Negative:**
- Data is device-local — no cross-device sync without a future Firestore migration
- Cached PokéAPI data never auto-evicts; manual DevTools clear is the escape hatch
- 5-10MB localStorage limit could become a constraint if the roster grows to 1000+ species with cached data (mitigated by storing URLs not images)

**Risks:**
- A user clearing browser data loses their box. This is acceptable for MVP; a future export/backup feature can mitigate it.
- Migrating from localStorage to Firestore later requires a one-time data migration script — manageable as long as the schema of saved objects is stable.