const path = require("path");
const express = require("express");
const { getRouter } = require("stremio-addon-sdk");
const { createAddonInterface } = require("./addon");

const PORT = process.env.PORT || 7000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const app = express();

// Serve local artwork and config UI assets
app.use(
  "/artwork",
  express.static(path.join(__dirname, "artwork"), {
    maxAge: "1d"
  })
);
app.use(
  "/config",
  express.static(path.join(__dirname, "config"), {
    maxAge: 0
  })
);
app.use(
  "/corpus",
  express.static(path.join(__dirname, "corpus"), {
    maxAge: "1d"
  })
);

app.get("/", (_req, res) => {
  res.redirect("/configure");
});

app.get("/configure", (_req, res) => {
  res.sendFile(path.join(__dirname, "config", "index.html"));
});

const addonInterface = createAddonInterface({ baseUrl: BASE_URL });

// Mount Stremio router after static/config routes
app.use(getRouter(addonInterface));

app.listen(PORT, () => {
  console.log(`Humanifesto dev server at ${BASE_URL}`);
  console.log(`Manifest: ${BASE_URL}/manifest.json`);
  console.log(`Logo:     ${BASE_URL}/artwork/manifest_logo.png`);
});
