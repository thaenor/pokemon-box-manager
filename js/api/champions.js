const RANKINGS_URL = "https://championsbattledata.com/api/rankings";
const POKEDEX_URL = "https://play.pokemonshowdown.com/data/pokedex.json";
const ARTWORK_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";
const SPRITES_URL = "https://play.pokemonshowdown.com/sprites/dex";
const REFRESH_INTERVAL = 15 * 60 * 1000;

const POKEAPI_ARTWORK_IDS = {
  absolmegaz: 10307,
  garchompmegaz: 10309,
  lucariomegaz: 10310,
  taurospaldeacombat: 10250,
  taurospaldeablaze: 10251,
  taurospaldeaaqua: 10252,
};

const POKEAPI_NAMES = {
  aegislash: "aegislash-shield",
  basculegion: "basculegion-male",
  basculegionf: "basculegion-female",
  farfetchd: "farfetchd",
  gourgeist: "gourgeist-average",
  indeedee: "indeedee-male",
  indeedeef: "indeedee-female",
  lycanroc: "lycanroc-midday",
  mausholdfour: "maushold-family-of-four",
  meowstic: "meowstic-male",
  meowsticf: "meowstic-female",
  mimikyu: "mimikyu-disguised",
  morpeko: "morpeko-full-belly",
  palafin: "palafin-zero",
  pyroar: "pyroar-male",
  sirfetchd: "sirfetchd",
  squawkabilly: "squawkabilly-green-plumage",
  squawkabillyyellow: "squawkabilly-yellow-plumage",
  taurospaldeaaqua: "tauros-paldea-aqua-breed",
  taurospaldeablaze: "tauros-paldea-blaze-breed",
  taurospaldeacombat: "tauros-paldea-combat-breed",
  toxtricity: "toxtricity-amped",
  vivillonfancy: "vivillon",
};

const DISPLAY_NAMES = {
  basculegionf: "Basculegion Female",
  indeedeef: "Indeedee Female",
  mausholdfour: "Maushold (Family of Four)",
  meowsticf: "Meowstic Female",
  mrmime: "Mr Mime",
  mrrime: "Mr Rime",
  kommoo: "Kommo O",
};

const LEGACY_IDS = {
  farfetchd: "farfetchd",
  kommoo: "kommoo",
  mrrime: "mrrime",
  sirfetchd: "sirfetchd",
  toxtricitylowkey: "toxtricity-lowkey",
};

export function toShowdownId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
}

export async function fetchRankings(format) {
  const url = new URL(RANKINGS_URL);
  url.searchParams.set("format", format);
  const data = await fetchJson(url);
  const rows = data?.rankings;
  if (
    data?.format !== format ||
    !Array.isArray(rows) ||
    !rows.length ||
    rows.length !== data.total ||
    rows.some(
      (row) =>
        !/^[a-z0-9]+$/.test(row?.showdownId ?? "") ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row?.slug ?? "") ||
        toShowdownId(row.slug) !== row.showdownId ||
        !Number.isInteger(row.position) ||
        row.position < 1,
    ) ||
    new Set(rows.map((row) => row.showdownId)).size !== rows.length
  ) {
    throw new Error(`Invalid Champions ${format} rankings`);
  }
  return rows.toSorted((a, b) => a.position - b.position);
}

export function fetchShowdownPokedex() {
  return fetchJson(POKEDEX_URL);
}

export function createRankedSpecies(row, pokedex) {
  const entry = pokedex?.[row.showdownId];
  if (
    typeof entry?.name !== "string" ||
    !Array.isArray(entry.types) ||
    !entry.types.length ||
    !Number.isInteger(entry.num) ||
    entry.num < 1
  ) {
    return null;
  }

  const key = row.showdownId;
  const showdownId = LEGACY_IDS[key] ?? row.slug;
  const pokeApiName = POKEAPI_NAMES[key] ?? row.slug;
  const artworkId = POKEAPI_ARTWORK_IDS[key] ?? (entry.forme ? null : entry.num);
  const name =
    DISPLAY_NAMES[key] ??
    (entry.forme ? entry.name.replaceAll("-", " ") : entry.name.replaceAll("’", "'"));
  return {
    id: entry.num,
    name,
    showdownId,
    ...(pokeApiName !== showdownId && { pokeApiName }),
    types: entry.types,
    isMega: false,
    isUltra: false,
    spriteUrl: artworkId ? `${ARTWORK_URL}/${artworkId}.png` : `${SPRITES_URL}/${row.slug}.png`,
  };
}

const cachedRosters = new Map();
let pendingPokedex;

function getPokedex() {
  if (!pendingPokedex) {
    pendingPokedex = fetchShowdownPokedex().finally(() => {
      pendingPokedex = undefined;
    });
  }
  return pendingPokedex;
}

export function loadRankedRoster(format, bundledRoster) {
  const cached = cachedRosters.get(format);
  if (cached && Date.now() < cached.expiresAt) return cached.request;

  const entry = { expiresAt: Infinity };
  entry.request = buildRankedRoster(format, bundledRoster)
    .then((roster) => {
      entry.expiresAt = Date.now() + REFRESH_INTERVAL;
      return roster;
    })
    .catch(() => {
      cachedRosters.delete(format);
      return null;
    });
  cachedRosters.set(format, entry);
  return entry.request;
}

async function buildRankedRoster(format, bundledRoster) {
  const rankings = await fetchRankings(format);
  const byId = new Map(bundledRoster.map((species) => [toShowdownId(species.showdownId), species]));
  const hasNewSpecies = rankings.some((row) => !byId.has(row.showdownId));
  const pokedex = hasNewSpecies ? await getPokedex().catch(() => null) : null;

  return rankings.map((row) => ({
    position: row.position,
    species: byId.get(row.showdownId) ?? createRankedSpecies(row, pokedex),
  }));
}
