# ADR-001: Trimmed Pokémon Object Shape

**Date:** 2026-09-13
**Status:** Accepted

## Context

The Pokémon detail/edit form originally included fields that won't be used in the box manager's v1: 4 move slots, held item, trial/permanent flag, and source (Ranch/HOME/Event). These added complexity without serving the core use case — storing a visual roster.

## Decision

Strip the following from the saved Pokémon object:

- `moves` — 4 move text input slots removed
- `heldItem` — held item text input removed
- `isTrial` — trial checkbox removed
- `source` — source select removed

The new object shape is:

```ts
{
  species: Species; // species object
  showdownId: string; // Showdown identifier
  nickname: string; // optional display name
  sprite: string; // default sprite URL
  spriteShiny: string; // shiny sprite URL
  isShiny: boolean; // shiny toggle
  stats: {
    name: string;
    value: number;
  }
  []; // base stats
  ability: string; // selected ability
  nature: string; // selected nature (default 'Serious')
  recruitedDate: string; // ISO date string
}
```

## Consequences

- Fewer form fields → simpler UX
- Saved objects are smaller in localStorage
- Stale box entries with old fields are silently sanitized via `sanitizePokemon()` in app.js
- Moves, held items, and source tracking will be added later if a Champions integration ticket requires them
