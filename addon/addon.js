// addon.js
// Humanifesto add-on definition

const { addonBuilder } = require("stremio-addon-sdk");

// 1) Manifest object (our spec lives here)
const manifest = {
  id: "community.humanifesto",
  version: "1.0.0",

  name: "Humanifesto",
  description:
    "Tell it what you loved, and Humanifesto rolls out a small, hand-picked list of films and shows that match the vibe — no accounts, no watchlist scraping.",

  logo: "https://YOUR-CDN-OR-DOMAIN/humanifesto/logo-256.png",

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

// 2) Builder using that manifest
const builder = new addonBuilder(manifest);

// 3) Handlers will go here (Codex’ job)
// builder.defineCatalogHandler(...)
// builder.defineMetaHandler(...)

// 4) Export the generic addon interface
module.exports = builder.getInterface();