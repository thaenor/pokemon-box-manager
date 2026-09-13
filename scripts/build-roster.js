#!/usr/bin/env node
/**
 * build-roster.js — Build the full Reg M-C species roster
 *
 * Usage: node scripts/build-roster.js
 * Output: js/data/species-list.js
 */

"use strict";

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const POKEDEX_PATH = path.join(ROOT, "data", "pokedex.json");
const OUTPUT_PATH = path.join(ROOT, "js", "data", "species-list.js");
const METAVGC_URL = "https://metavgc.com/regulations/regulationm-c";

// Sprite sources
const POKEAPI_SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";
const SHOWDOWN_SPRITE_BASE = "https://play.pokemonshowdown.com/sprites/gen5";
const POKEAPI_SPECIES_URL = "https://pokeapi.co/api/v2/pokemon-species";

// ─── Manual name → showdownId ────────────────────────────────────────
const NAME_MAP = {
  Abomasnow: "abomasnow",
  Absol: "absol",
  Aegislash: "aegislash",
  Aerodactyl: "aerodactyl",
  Aggron: "aggron",
  Alakazam: "alakazam",
  Alcremie: "alcremie",
  Altaria: "altaria",
  Ampharos: "ampharos",
  Annihilape: "annihilape",
  Appletun: "appletun",
  Araquanid: "araquanid",
  Arbok: "arbok",
  Arboliva: "arboliva",
  Arcanine: "arcanine",
  Archaludon: "archaludon",
  Ariados: "ariados",
  Armarouge: "armarouge",
  Aromatisse: "aromatisse",
  Audino: "audino",
  Aurorus: "aurorus",
  Avalugg: "avalugg",
  Azumarill: "azumarill",
  Banette: "banette",
  Barbaracle: "barbaracle",
  Basculegion: "basculegion",
  Bastiodon: "bastiodon",
  Baxcalibur: "baxcalibur",
  Beartic: "beartic",
  Beedrill: "beedrill",
  Bellibolt: "bellibolt",
  Blastoise: "blastoise",
  Blaziken: "blaziken",
  Camerupt: "camerupt",
  Castform: "castform",
  Ceruledge: "ceruledge",
  Chandelure: "chandelure",
  Charizard: "charizard",
  Chesnaught: "chesnaught",
  Chimecho: "chimecho",
  Cinderace: "cinderace",
  Clawitzer: "clawitzer",
  Clefable: "clefable",
  Cofagrigus: "cofagrigus",
  Conkeldurr: "conkeldurr",
  Corviknight: "corviknight",
  Crabominable: "crabominable",
  Decidueye: "decidueye",
  Dedenne: "dedenne",
  Delphox: "delphox",
  Diggersby: "diggersby",
  Ditto: "ditto",
  Dragalge: "dragalge",
  Dragapult: "dragapult",
  Dragonite: "dragonite",
  Drampa: "drampa",
  Eelektross: "eelektross",
  Emboar: "emboar",
  Emolga: "emolga",
  Empoleon: "empoleon",
  Espathra: "espathra",
  Espeon: "espeon",
  Excadrill: "excadrill",
  Falinks: "falinks",
  Farigiraf: "farigiraf",
  Feraligatr: "feraligatr",
  Flapple: "flapple",
  Flareon: "flareon",
  Floette: "floette",
  Florges: "florges",
  Forretress: "forretress",
  Froslass: "froslass",
  Furfrou: "furfrou",
  Gallade: "gallade",
  Garbodor: "garbodor",
  Garchomp: "garchomp",
  Gardevoir: "gardevoir",
  Garganacl: "garganacl",
  Gengar: "gengar",
  Gholdengo: "gholdengo",
  Glaceon: "glaceon",
  Glalie: "glalie",
  Glimmora: "glimmora",
  Gliscor: "gliscor",
  Gogoat: "gogoat",
  Golisopod: "golisopod",
  Golurk: "golurk",
  Goodra: "goodra",
  Gourgeist: "gourgeist",
  Grapploct: "grapploct",
  Greninja: "greninja",
  Grimmsnarl: "grimmsnarl",
  Gyarados: "gyarados",
  Hatterene: "hatterene",
  Hawlucha: "hawlucha",
  Heliolisk: "heliolisk",
  Heracross: "heracross",
  Hippowdon: "hippowdon",
  Houndoom: "houndoom",
  Houndstone: "houndstone",
  Hydrapple: "hydrapple",
  Hydreigon: "hydreigon",
  Incineroar: "incineroar",
  Indeedee: "indeedee",
  "Indeedee Female": "indeedee-female",
  "Indeedee Male": "indeedee-male",
  Infernape: "infernape",
  Inteleon: "inteleon",
  Jolteon: "jolteon",
  Kangaskhan: "kangaskhan",
  Kingambit: "kingambit",
  Kleavor: "kleavor",
  Klefki: "klefki",
  "Kommo O": "kommoo",
  Krookodile: "krookodile",
  Leafeon: "leafeon",
  Liepard: "liepard",
  Lopunny: "lopunny",
  Lucario: "lucario",
  Luxray: "luxray",
  Lycanroc: "lycanroc",
  Mabosstiff: "mabosstiff",
  Machamp: "machamp",
  Malamar: "malamar",
  Mamoswine: "mamoswine",
  Manectric: "manectric",
  Maushold: "maushold",
  Mawile: "mawile",
  Medicham: "medicham",
  Meowscarada: "meowscarada",
  Meowstic: "meowstic",
  Metagross: "metagross",
  Milotic: "milotic",
  Mimikyu: "mimikyu",
  Morpeko: "morpeko",
  "Mr Mime": "mr-mime",
  "Mr Mime Galar": "mr-mime-galar",
  "Mr Rime": "mrrime",
  Mudsdale: "mudsdale",
  Musharna: "musharna",
  Ninetales: "ninetales",
  Noivern: "noivern",
  Oranguru: "oranguru",
  Orthworm: "orthworm",
  Overqwil: "overqwil",
  Palafin: "palafin",
  Pangoro: "pangoro",
  Passimian: "passimian",
  Pawmot: "pawmot",
  Pelipper: "pelipper",
  Perrserker: "perrserker",
  Persian: "persian",
  "Persian Alola": "persian-alola",
  Pidgeot: "pidgeot",
  Pikachu: "pikachu",
  Pincurchin: "pincurchin",
  Pinsir: "pinsir",
  Politoed: "politoed",
  Polteageist: "polteageist",
  Primarina: "primarina",
  Pyroar: "pyroar",
  Quaquaval: "quaquaval",
  Qwilfish: "qwilfish",
  Raichu: "raichu",
  Rampardos: "rampardos",
  Reuniclus: "reuniclus",
  Rhyperior: "rhyperior",
  Rillaboom: "rillaboom",
  Roserade: "roserade",
  Rotom: "rotom",
  Runerigus: "runerigus",
  Sableye: "sableye",
  Salamence: "salamence",
  Salazzle: "salazzle",
  Samurott: "samurott",
  Sandaconda: "sandaconda",
  Sceptile: "sceptile",
  Scizor: "scizor",
  Scolipede: "scolipede",
  Scovillain: "scovillain",
  Scrafty: "scrafty",
  Serperior: "serperior",
  Sharpedo: "sharpedo",
  "Sirfetch'd": "sirfetchd",
  Skarmory: "skarmory",
  Skeledirge: "skeledirge",
  Slowbro: "slowbro",
  Slowking: "slowking",
  Slurpuff: "slurpuff",
  Sneasler: "sneasler",
  Snorlax: "snorlax",
  Spiritomb: "spiritomb",
  Squawkabilly: "squawkabilly",
  Staraptor: "staraptor",
  Starmie: "starmie",
  Steelix: "steelix",
  Stunfisk: "stunfisk",
  Swalot: "swalot",
  Swampert: "swampert",
  Sylveon: "sylveon",
  Talonflame: "talonflame",
  Tinkaton: "tinkaton",
  Torkoal: "torkoal",
  Torterra: "torterra",
  Toucannon: "toucannon",
  Toxapex: "toxapex",
  Toxicroak: "toxicroak",
  Toxtricity: "toxtricity",
  "Toxtricity Amped": "toxtricity",
  "Toxtricity Low Key": "toxtricity-lowkey",
  Trevenant: "trevenant",
  Tsareena: "tsareena",
  Typhlosion: "typhlosion",
  Tyranitar: "tyranitar",
  Tyrantrum: "tyrantrum",
  Umbreon: "umbreon",
  Vanilluxe: "vanilluxe",
  Vaporeon: "vaporeon",
  Venusaur: "venusaur",
  Victreebel: "victreebel",
  Vileplume: "vileplume",
  Vivillon: "vivillon",
  Volcarona: "volcarona",
  Weavile: "weavile",
  Whimsicott: "whimsicott",
  Wigglytuff: "wigglytuff",
  Wyrdeer: "wyrdeer",
  Zoroark: "zoroark",

  // Farfetch'd with HTML-aware name
  "Farfetch'd": "farfetchd",
  "Farfetch'd Galar": "farfetchdgalar",
};

// ─── Z-Mega Champion-exclusive forms (custom IDs, not in Showdown) ───
const Z_MEGAS = {
  "Mega Absol Z": { showdownId: "absol-ultra", types: ["Dark"] },
  "Mega Garchomp Z": { showdownId: "garchomp-ultra", types: ["Dragon", "Ground"] },
  "Mega Lucario Z": { showdownId: "lucario-ultra", types: ["Fighting", "Steel"] },
};

// ─── Known species not in Showdown pokedex → base showdownId for fallback ─
const FORM_BASE_MAP = {
  "indeedee-female": "indeedee",
  "indeedee-male": "indeedee",
  farfetchdgalar: "farfetchd",
  "persian-alola": "persian",
  "toxtricity-lowkey": "toxtricity",
};

// ─── Type overrides for species where the base form fallback gives wrong types ─
const TYPE_OVERRIDES = {
  "persian-alola": ["Dark"],
};

// ─── Champions-exclusive species with hardcoded types ────────────────
const CHAMPIONS_EXCLUSIVE = {
  "mr-mime": { num: 122, types: ["Psychic", "Fairy"] },
  "mr-mime-galar": { num: 122, types: ["Ice", "Psychic"] },
  raichumegax: { num: 26, types: ["Electric", "Psychic"] },
  raichumegay: { num: 26, types: ["Electric", "Fighting"] },
  scolipede: { num: 545, types: ["Bug", "Poison"] },
};

// ─── Fetch page & extract species ──────────────────────────────────
async function fetchSpeciesGrid() {
  console.log("[BUILD] Fetching MetaVGC page...");
  const html = cp
    .execSync(`curl -sL --max-time 30 '${METAVGC_URL}' 2>/dev/null`, {
      timeout: 35000,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    })
    .toString();

  const g = html.match(/<ul id="pokemon-grid"[^>]*>([\s\S]*?)<\/ul>/i);
  if (!g) throw new Error("Could not find pokemon-grid in HTML");

  const species = [];
  const liParts = g[1].split(/<li\s/);
  for (const part of liParts) {
    const dsm = part.match(/data-search="([^"]+)"/);
    const nm = part.match(/<span class="truncate">([^<]+)<\/span>/);
    if (dsm && nm) {
      species.push({
        searchId: dsm[1],
        displayName: nm[1].trim().replace(/&#x27;/g, "'"),
      });
    }
  }
  return species;
}

// ─── Resolve species data from pokedex ───────────────────────────
function resolveSpecies(pokedex, displayName, searchId) {
  // 1. Check Z-Megas (keep these — they are ultra forms, not megas)
  if (Z_MEGAS[displayName]) {
    const z = Z_MEGAS[displayName];
    // Strip '-ultra' to get base species id
    const baseId = z.showdownId.replace("-ultra", "");
    const baseEntry = pokedex[baseId];
    const num = baseEntry ? baseEntry.num : 0;
    return { showdownId: z.showdownId, types: z.types, num };
  }

  // 2. Check manual NAME_MAP
  const mappedId = NAME_MAP[displayName];
  if (mappedId) {
    if (pokedex[mappedId]) {
      return { showdownId: mappedId, types: pokedex[mappedId].types, num: pokedex[mappedId].num };
    }
    if (CHAMPIONS_EXCLUSIVE[mappedId]) {
      return { showdownId: mappedId, ...CHAMPIONS_EXCLUSIVE[mappedId] };
    }
    const baseKey = FORM_BASE_MAP[mappedId];
    if (baseKey && pokedex[baseKey]) {
      const result = {
        showdownId: mappedId,
        types: pokedex[baseKey].types,
        num: pokedex[baseKey].num,
      };
      if (TYPE_OVERRIDES[mappedId]) result.types = TYPE_OVERRIDES[mappedId];
      return result;
    }
    if (pokedex[searchId]) {
      return { showdownId: searchId, types: pokedex[searchId].types, num: pokedex[searchId].num };
    }
    console.warn(`  ⚠ Unresolved: ${displayName} → '${mappedId}'`);
    return null;
  }

  // 3. Fallback: use searchId directly
  if (pokedex[searchId]) {
    return { showdownId: searchId, types: pokedex[searchId].types, num: pokedex[searchId].num };
  }

  console.warn(`  ⚠ Unresolveable: ${displayName} (searchId=${searchId})`);
  return null;
}

// ─── Detect if species is a mega form by showdownId ────────────────
function isMegaForm(showdownId, name) {
  // False positive on "meganium" check: "meganium" does not end with "mega"
  // Mega showdownIds end with "mega" or are "scolipede-mega"
  if (showdownId.endsWith("mega") || showdownId.endsWith("-mega")) {
    return true;
  }
  // Mega Raichu X/Y are special — they use "raichumegax/y" which don't end with "mega"
  if (showdownId === "raichumegax" || showdownId === "raichumegay") {
    return true;
  }
  return false;
}

// ─── Detect if species is an ultra/Z-Mega form ────────────────────
function isUltraForm(showdownId, name) {
  return showdownId.includes("-ultra");
}

// ─── Sleep helper for rate limiting ───────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Fetch sprite URL from PokéAPI with fallback to Showdown CDN ──
async function fetchSpriteUrl(num, showdownId) {
  // Try PokéAPI species endpoint
  const apiUrl = `${POKEAPI_SPECIES_URL}/${num}/`;
  try {
    const result = cp
      .execSync(`curl -sL --max-time 8 '${apiUrl}' 2>/dev/null`, {
        timeout: 15000,
        encoding: "utf-8",
        maxBuffer: 256 * 1024,
      })
      .toString();
    if (result && result.includes('"id"')) {
      return `${POKEAPI_SPRITE_BASE}/${num}.png`;
    }
  } catch {
    // fallthrough to Showdown fallback
  }
  // Fallback to Showdown CDN
  return `${SHOWDOWN_SPRITE_BASE}/${showdownId}.png`;
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("═════════════════════════════════════════");
  console.log("  Reg M-C Species Roster Builder");
  console.log("═════════════════════════════════════════\n");

  const pokedex = JSON.parse(fs.readFileSync(POKEDEX_PATH, "utf-8"));
  console.log(`  Pokedex: ${Object.keys(pokedex).length} entries`);

  const species = await fetchSpeciesGrid();
  console.log(`  Species grid: ${species.length} entries`);

  const results = [];
  const failures = [];
  for (const s of species) {
    const resolved = resolveSpecies(pokedex, s.displayName, s.searchId);
    if (resolved) {
      results.push({ name: s.displayName, ...resolved });
    } else {
      failures.push(s.displayName);
    }
  }

  console.log(`  Mapped: ${results.length}`);
  if (failures.length > 0) {
    console.log(`  Failures: ${failures.length}`);
    for (const f of failures.slice(0, 20)) console.log(`    ❌ ${f}`);
    if (failures.length > 20) console.log(`    ... and ${failures.length - 20} more`);
  }

  // Deduplicate by name
  const nameSeen = new Set();
  const dedupedByName = results.filter((r) => {
    const k = r.name.toLowerCase();
    if (nameSeen.has(k)) return false;
    nameSeen.add(k);
    return true;
  });

  // Also deduplicate by showdownId
  const sidSeen = new Set();
  const unique = dedupedByName.filter((r) => {
    if (sidSeen.has(r.showdownId)) return false;
    sidSeen.add(r.showdownId);
    return true;
  });

  // Sort by dex number, then name
  unique.sort((a, b) => (a.num !== b.num ? a.num - b.num : a.name.localeCompare(b.name)));

  // Build entries with sprite URLs
  const entries = [];
  const spriteCache = new Map(); // showdownId → spriteUrl cache

  for (let i = 0; i < unique.length; i++) {
    const e = unique[i];
    const isMega = isMegaForm(e.showdownId, e.name);
    const isUltra = isUltraForm(e.showdownId, e.name);
    const cacheKey = `${e.num}-${e.showdownId}`;

    // Determine sprite URL
    let spriteUrl;
    if (spriteCache.has(cacheKey)) {
      spriteUrl = spriteCache.get(cacheKey);
    } else {
      // For ultra forms and Champions-exclusive forms, skip PokeAPI and use Showdown CDN
      if (isUltra || CHAMPIONS_EXCLUSIVE[e.showdownId]) {
        spriteUrl = `${SHOWDOWN_SPRITE_BASE}/${e.showdownId}.png`;
        spriteCache.set(cacheKey, spriteUrl);
      } else {
        spriteUrl = await fetchSpriteUrl(e.num, e.showdownId);
        spriteCache.set(cacheKey, spriteUrl);
        // Rate limiting: 500ms base delay + jitter (0-500ms) between PokeAPI fetches
        const delay = 500 + Math.floor(Math.random() * 500);
        await sleep(delay);
      }
    }

    // Log progress every 25 entries
    if ((i + 1) % 25 === 0 || i === unique.length - 1) {
      console.log(`  [${i + 1}/${unique.length}] ✓ sprite resolved`);
    }

    entries.push({
      id: e.num, // Use national dex number as ID
      name: e.name,
      showdownId: e.showdownId,
      types: e.types,
      spriteUrl,
      isMega,
      isUltra,
    });
  }

  // Verify
  const checks = [
    "Wigglytuff",
    "Rillaboom",
    "Cinderace",
    "Inteleon",
    "Indeedee",
    "Indeedee Female",
    "Indeedee Male",
    "Squawkabilly",
    "Mega Absol Z",
    "Mega Garchomp Z",
    "Mega Lucario Z",
    "Persian Alola",
    "Farfetch'd Galar",
    "Mr Mime Galar",
    "Mr Rime",
    "Toxtricity Low Key",
    "Kommo O",
    "Sirfetch'd",
  ];
  console.log("\n[Verification]");
  let allOk = true;
  for (const c of checks) {
    const f = entries.find((e) => e.name === c);
    console.log(f ? `  ✅ ${c} → ${f.showdownId}` : `  ❌ ${c} MISSING`);
    if (!f) allOk = false;
  }

  // Check no mega entries snuck in (except Z-megas)
  const megaEntries = entries.filter((e) => e.name.startsWith("Mega ") && !e.name.endsWith(" Z"));
  if (megaEntries.length > 0) {
    console.log(`\n  ⚠ Mega entries still present (${megaEntries.length}):`);
    for (const m of megaEntries) console.log(`    ❌ ${m.name}`);
  } else {
    console.log("\n  ✅ No mega entries present");
  }

  // Verify Meganium false positive is fixed
  const meganium = entries.find((e) => e.name === "Meganium");
  if (meganium) {
    console.log(
      meganium.isMega
        ? "  ❌ Meganium falsely marked as mega!"
        : "  ✅ Meganium correctly not mega",
    );
  }

  // Write output
  const lines = entries.map((e) => {
    const typesStr = JSON.stringify(e.types);
    return `  { id: ${e.id}, name: ${JSON.stringify(e.name)}, showdownId: ${JSON.stringify(e.showdownId)}, types: ${typesStr}, isMega: ${e.isMega}, isUltra: ${e.isUltra}, spriteUrl: ${JSON.stringify(e.spriteUrl)} },`;
  });

  const output = `// Auto-generated by scripts/build-roster.js — do not edit manually
// Source: MetaVGC Regulation M-C (${entries.length} legal species (no megas))
export const speciesList = [
${lines.join("\n")}
];

export function findSpecies(name) {
  const search = name.toLowerCase().trim();
  return speciesList.find(
    (s) => s.showdownId.toLowerCase() === search || s.name.toLowerCase() === search
  );
}
`;

  fs.writeFileSync(OUTPUT_PATH, output, "utf-8");
  console.log(`\n✅ Written: js/data/species-list.js (${entries.length} species)`);
  if (failures.length > 0) console.log(`⚠ Unresolved: ${failures.length}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
