// addon.js
// Humanifesto add-on definition and runtime logic

const fs = require("fs");
const path = require("path");
const { addonBuilder } = require("stremio-addon-sdk");

const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western"
];

const DEFAULT_POPULARITY = 0.6;
const IMDB_ID_PATTERN = /^tt\d{7,8}$/;

const POSTER_BASE = "https://images.metahub.space/poster/medium";

const corpusPath = path.join(__dirname, "corpus", "corpus_v1.json");

function loadCorpus() {
  try {
    const raw = fs.readFileSync(corpusPath, "utf8");
    const entries = JSON.parse(raw);
    const movies = entries.filter((e) => e.type === "movie");
    const series = entries.filter((e) => e.type === "series");
    return { entries, movies, series };
  } catch (err) {
    console.error("[Humanifesto] Failed to load corpus_v1.json:", err.message);
    return { entries: [], movies: [], series: [] };
  }
}

function validateCorpus(entries) {
  const seen = new Set();
  const duplicates = [];
  const malformed = [];

  entries.forEach((entry) => {
    if (!entry.id || !IMDB_ID_PATTERN.test(entry.id)) {
      malformed.push(entry.id || "<missing>");
    }
    if (seen.has(entry.id)) {
      duplicates.push(entry.id);
    }
    seen.add(entry.id);
  });

  if (duplicates.length) {
    console.warn(
      "[Humanifesto] Duplicate IDs found in corpus:",
      duplicates.join(", ")
    );
  }
  if (malformed.length) {
    console.warn(
      "[Humanifesto] Malformed or missing IMDB IDs:",
      malformed.join(", ")
    );
  }
}

function normalizeGenre(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.trim();
  const match = GENRES.find(
    (g) => g.toLowerCase() === normalized.toLowerCase()
  );
  return match || null;
}

function parseConfig(extra = {}) {
  return {
    primaryGenre: normalizeGenre(extra.primaryGenre || extra.genre),
    secondaryGenre: normalizeGenre(extra.secondaryGenre || extra.subGenre),
    exclude: normalizeGenre(extra.exclude),
    mode: extra.mode === "oddities" ? "oddities" : "canon",
    seed:
      typeof extra.seed === "string"
        ? extra.seed.trim().slice(0, 600)
        : ""
  };
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

function computeSeedScore(entry, seedTokens) {
  if (!seedTokens.length) return 0;

  const haystack = new Set();
  const pushTokens = (value) => {
    if (!value) return;
    tokenize(value).forEach((t) => haystack.add(t));
  };

  (entry.tags || []).forEach(pushTokens);
  pushTokens(entry.title);
  pushTokens(entry.director);
  pushTokens((entry.vibe_flags && entry.vibe_flags.notes) || "");

  const matches = seedTokens.filter((token) => haystack.has(token));
  if (!matches.length) return 0;

  const overlapRatio = matches.length / seedTokens.length;
  const base = 0.6;
  const incremental = Math.min(1.6, matches.length * 0.35);
  return base + incremental + overlapRatio * 0.4;
}

function modeBonus(entry, mode) {
  const pop = typeof entry.popularity_weight === "number"
    ? entry.popularity_weight
    : DEFAULT_POPULARITY;

  if (mode === "oddities") {
    const rarityBias = (1 - pop) * 1.1;
    const weirdness =
      (entry.vibe_flags && entry.vibe_flags.arthouse ? 0.3 : 0) +
      (entry.vibe_flags && entry.vibe_flags.experimental ? 0.2 : 0) +
      (entry.vibe_flags && entry.vibe_flags.surreal ? 0.2 : 0);
    return rarityBias + weirdness;
  }

  return pop * 1.1;
}

function scoreEntry(entry, config, seedTokens) {
  const primaryMatch =
    config.primaryGenre && entry.genres.includes(config.primaryGenre) ? 1 : 0;
  const secondaryMatch =
    config.secondaryGenre && entry.genres.includes(config.secondaryGenre)
      ? 1
      : 0;
  const excludeMatch =
    config.exclude && entry.genres.includes(config.exclude) ? 1 : 0;

  const pop =
    typeof entry.popularity_weight === "number"
      ? entry.popularity_weight
      : DEFAULT_POPULARITY;

  return (
    3 * primaryMatch +
    1 * secondaryMatch -
    2 * excludeMatch +
    modeBonus(entry, config.mode) +
    computeSeedScore(entry, seedTokens) +
    0.5 * pop
  );
}

function selectEntries(entries, config, limit) {
  const filtered = entries.filter((entry) => {
    if (config.primaryGenre && !entry.genres.includes(config.primaryGenre)) {
      return false;
    }
    if (config.exclude && entry.genres.includes(config.exclude)) {
      return false;
    }
    return true;
  });

  const seedTokens = tokenize(config.seed || "");

  const scored = filtered
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, config, seedTokens)
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.entry.title.localeCompare(b.entry.title);
    })
    .slice(0, limit)
    .map(({ entry }) => entry);

  return scored;
}

function toMetaPreview(entry) {
  return {
    id: entry.id,
    type: entry.type,
    name: entry.title,
    year: entry.year,
    genres: entry.genres,
    poster: `${POSTER_BASE}/${entry.id}/img`
  };
}

function toMeta(entry) {
  return {
    id: entry.id,
    type: entry.type,
    name: entry.title,
    year: entry.year,
    genres: entry.genres,
    poster: `${POSTER_BASE}/${entry.id}/img`,
    description: entry.summary || "",
    director: entry.director,
    cast: entry.cast || [],
    links: entry.links || []
  };
}

function buildManifest(baseUrl) {
  return {
    id: "community.humanifesto",
    version: "1.0.0",
    name: "Humanifesto",
    description:
      "Tell it what you loved, and Humanifesto rolls out a small, hand-picked list of films and shows that match the vibe — no accounts, no watchlist scraping.",
    logo: `${baseUrl}/artwork/manifest_logo.png`,
    resources: [
      "catalog",
      {
        name: "meta",
        types: ["movie", "series"],
        idPrefixes: ["tt", "human_"]
      }
    ],
    types: ["movie", "series"],
    catalogs: [
      {
        id: "humanifesto_movies",
        type: "movie",
        name: "Humanifesto: Movies"
      },
      {
        id: "humanifesto_series",
        type: "series",
        name: "Humanifesto: Series"
      }
    ],
    idPrefixes: ["tt", "human_"]
  };
}

function createAddonInterface(options = {}) {
  const baseUrl = options.baseUrl || "http://localhost:7000";
  const corpus = loadCorpus();
  validateCorpus(corpus.entries);
  console.log(
    `[Humanifesto] Corpus loaded: ${corpus.movies.length} movies, ${corpus.series.length} series`
  );
  const manifest = buildManifest(baseUrl);

  const builder = new addonBuilder(manifest);

  builder.defineCatalogHandler((args) => {
    const config = parseConfig({ ...(args || {}), ...(args.extra || {}) });
    const isMovies = args.type === "movie" && args.id === "humanifesto_movies";
    const isSeries = args.type === "series" && args.id === "humanifesto_series";

    if (!isMovies && !isSeries) {
      return Promise.resolve({ metas: [] });
    }

    const limit = isMovies ? 20 : 5;
    const pool = isMovies ? corpus.movies : corpus.series;
    const entries = selectEntries(pool, config, limit);

    return Promise.resolve({
      metas: entries.map(toMetaPreview)
    });
  });

  builder.defineMetaHandler((args) => {
    const entry = corpus.entries.find((e) => e.id === args.id);
    if (!entry) {
      return Promise.resolve({ meta: null });
    }
    return Promise.resolve({ meta: toMeta(entry) });
  });

  return builder.getInterface();
}

module.exports = { createAddonInterface };
