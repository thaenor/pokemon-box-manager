# Pokémon Box Manager

> A browser-based box management tool for **Pokémon Champions** (Reg M-C competitive format).

Browse, filter, edit, and manage your Pokémon Champions boxes — all offline-first, all in your browser.

## Overview

**Pokémon Box Manager** is a single-page web application designed for players of [Pokémon Champions](https://www.pokemonchampions.com/) (by The Game Factory). It helps you plan and organize your teams for the **Reg M-C** competitive formats:

- **Singles 3v3** — bring 6, pick 3
- **Doubles 4v4** — bring 6, pick 4

### Key Features

- **Box Grid** — configurable slot grid (30, 35, or 40 slots) with add, remove, and reorder
- **Species Search** — full-page overlay with text search and type-filter chips
- **Pokémon Detail Form** — edit nickname, held item, ability, nature, EVs, moves, Tera type, and shininess
- **Import/Export** — import teams from Pokémon Showdown (Pokepaste) or JSON format; export to both
- **Offline-First PWA** — installable, works offline with cached sprites and data
- **Firebase Auth** — Google sign-in with persistent boxes synced via Firestore

## Tech Stack

| Layer           | Technology                                                                       |
| --------------- | -------------------------------------------------------------------------------- |
| **Frontend**    | Vanilla JS / HTML / CSS — ES modules, no framework                               |
| **Auth**        | Firebase Auth (Google sign-in) + App Check (reCAPTCHA Enterprise)                |
| **Data**        | PokéAPI (sprites, base stats, types, abilities)                                  |
| **Persistence** | `localStorage` (box state) + IndexedDB (cached Pokémon data)                     |
| **PWA**         | Service Worker (`sw.js`) + `manifest.json` (standalone display, offline caching) |
| **Hosting**     | Firebase Hosting (two targets: production + staging)                             |

## Dependencies

All dependencies are **devDependencies** (no runtime dependencies in `package.json`). Runtime Firebase SDK is loaded via CDN script tags in `index.html`.

| Package                                             | Purpose                                |
| --------------------------------------------------- | -------------------------------------- |
| `vitest` (v4)                                       | Unit testing framework                 |
| `@playwright/test` (v1)                             | End-to-end testing                     |
| `eslint` (v9)                                       | Linting (flat config)                  |
| `prettier` (v3)                                     | Code formatting                        |
| `eslint-plugin-prettier` / `eslint-config-prettier` | Prettier integration with ESLint       |
| `happy-dom` (v17)                                   | DOM environment for unit tests         |
| `fake-indexeddb` (v6)                               | IndexedDB mocking for tests            |
| `husky` (v9)                                        | Git hooks (via `prepare` script)       |
| `lint-staged` (v17)                                 | Pre-commit lint/format on staged files |
| `serve` (v14)                                       | Local development / E2E test server    |
| `globals` (v16)                                     | Global type definitions for ESLint     |

## Getting Started

### Prerequisites

- **Node.js 18+** (enforced by `.nvmrc`)
- **npm** (comes with Node)
- A **Firebase project** (`pokemon-box-manager`) — config is in `js/firebase-config.js`

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Validate configuration (Firebase config, data files, etc.)
npm run validate

# 3. Run unit tests
npm run test

# 4. Run E2E tests (starts a local dev server on port 5000)
npm run test:e2e
```

### Development Commands

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run test`       | Run unit tests (Vitest + happy-dom)              |
| `npm run test:watch` | Watch mode for unit tests                        |
| `npm run test:e2e`   | Run E2E tests (Playwright, serves on port 5000)  |
| `npm run lint`       | Check code quality (ESLint)                      |
| `npm run lint:fix`   | Auto-fix lint issues                             |
| `npm run format`     | Check formatting (Prettier)                      |
| `npm run format:fix` | Auto-fix formatting                              |
| `npm run validate`   | Validate config integrity (Firebase, data, etc.) |

> **Before committing:** Always run `npm run format:fix && npm run lint:fix` first. `lint-staged` will auto-fix on commit, but running it proactively saves CI cycles.

## Project Structure

```
pokemon-box-manager/
├── index.html            # Main entry — loads Firebase SDK, app scripts, registers SW
├── sw.js                 # Service worker (PWA offline support)
├── manifest.json         # PWA manifest (standalone, portrait, #1A1A2E theme)
├── firebase.json         # Firebase Hosting config (default + staging targets)
├── .firebaserc           # Firebase project ID
├── .nvmrc                # Node 18 requirement
│
├── js/                   # Application source (ES modules)
│   ├── app.js            # Main SPA orchestrator (auth → box grid → search → detail → save)
│   ├── firebase-config.js# Firebase config (public keys, App Check setup)
│   ├── api/
│   │   └── pokeapi.js    # PokéAPI client with localStorage + in-memory dual-layer cache
│   ├── cache/
│   │   └── pokemon-cache.js  # IndexedDB cache singleton for offline species data
│   ├── data/
│   │   ├── species-list.js  # ⚠️ Auto-generated by scripts/build-roster.js
│   │   ├── natures.js       # Nature stat modifiers
│   ├── ui/
│   │   ├── box-grid.js      # Main view: configurable slot grid (30/35/40)
│   │   ├── species-search.js # Species selection overlay with type filters
│   │   ├── pokemon-detail.js # Create/edit form with PokéAPI data fetching
│   │   ├── focus-trap.js    # Accessibility utility for modal dialogs
│   │   └── toast.js         # Notification toasts
│
├── css/                  # Styles
├── data/                 # ⚠️ Gitignored — generated by scripts/fetch-data.js
│   ├── pokedex.json      # Pokémon Showdown pokedex data
│   ├── moves.json        # Battle moves
│   ├── abilities.json    # Battle abilities
│   ├── items.json        # Battle items
│   ├── type-chart.json   # Type effectiveness chart
│   ├── sprites/          # Sprite images
│   └── usage-stats/      # Smogon usage stats (gen9ou, gen9doublesou)
│
├── scripts/              # Build tooling (not linted)
│   ├── build-roster.js   # Generates js/data/species-list.js from pokedex.json + Reg M-C rules
│   └── fetch-data.js     # Downloads PokéAPI sprites, Showdown data, Smogon stats
│
├── tests/                # Tests
│   ├── unit/             # Unit tests (Vitest)
│   └── e2e/              # E2E tests (Playwright)
│
├── docs/                 # Documentation
│   ├── adr/              # Architecture Decision Records
│   ├── agents/           # Agent-specific domain docs, issue tracker, triage labels
│   ├── api-refs/         # API reference docs
│   └── plans/            # Project plans
│
├── research/             # Game mechanics and data source research
│   ├── champions-rules.md    # Battle formats, box limits, recruitment mechanics
│   ├── data-sources.md       # PokéAPI, Smogon, Pikalytics evaluations
│   └── export-format.md      # Pokepaste vs JSON export format recommendations
│
└── tools/                # Utility scripts
    └── config-validate.cjs  # Config validation (run via npm run validate)
```

## Development Notes

### ⚠️ Auto-Generated Files

- **`js/data/species-list.js`** — Auto-generated by `scripts/build-roster.js`. Contains the Reg M-C allowed species roster. **Do not edit this file directly.**
- **`data/` directory** — Generated by `scripts/fetch-data.js`. Gitignored. Run the script to regenerate.

### 🔑 Firebase Config Is Public

Firebase API keys (`apiKey`, `projectId`, `authDomain`, `appId`, etc.) in `js/firebase-config.js` are **public client-side identifiers** — they ship with every web app. Every browser needs them to authenticate with Firebase services. They are **NOT secrets**.

Firebase enforces security via **App Check** (reCAPTCHA) + **Security Rules** (Firestore/Storage), not by hiding config values. **Never redact or replace these values in documentation.**

### Code Quality

- **ESLint 9** (flat config) ignores `scripts/`, `data/`, and `sw.js`.
- **Prettier 3** config: semicolons, no single quotes, trailing commas, 100 char width.
- **lint-staged** runs `prettier --write` + `eslint --fix` on staged `.js`, `.css`, `.html`, `.json`, `.md`, `.yml`, `.yaml`.
- **Conventional Commits** format required for all commits.
- Branch naming: `feat/description`, `fix/description`, `refactor/description`, `docs/description`, `ci/description`.

## Deployment

Deployed via **Firebase Hosting** with two targets:

| Target    | Production URL                        |
| --------- | ------------------------------------- |
| `default` | `pokemon-box-manager.web.app`         |
| `staging` | `pokemon-box-manager-staging.web.app` |

```bash
# Deploy to production (default target)
firebase deploy --only hosting

# Deploy to staging
firebase deploy --only hosting:staging
```

The `firebase.json` rewrites all routes to `index.html` (SPA routing), and ignores `docs/**`, `research/**`, `.firebase/`, and `node_modules/**`.

## Further Reading

- [`research/champions-rules.md`](research/champions-rules.md) — Game rules: battle formats (Singles/Doubles), box size limits, recruitment mechanics (daily roll, trial/permanent), Pokémon HOME integration.
- [`research/data-sources.md`](research/data-sources.md) — Evaluation of PokéAPI, Smogon/@pkmn stats, Pikalytics for offline PWA suitability.
- [`research/export-format.md`](research/export-format.md) — Team export format recommendations (Pokémon Showdown Pokepaste vs JSON).
- [`docs/adr/`](docs/adr/) — Architecture Decision Records.
- [`AGENTS.md`](AGENTS.md) — Agent instructions (Firebase config warnings, file generation rules).
