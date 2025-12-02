// Is the below require supposed to resolve a nested TS file under ~/.cache ??
const { serveHTTP, publishToCentral } = require("stremio-addon-sdk");
const addonInterface = require("./addon");

const PORT = process.env.PORT || 7000;

serveHTTP(addonInterface, { port: PORT });

console.log(`Humanifesto addon listening on http://localhost:${PORT}/manifest.json`);

// If/when addon is deployed, un-comment the next line
// publishToCentral("https://my-addon.awesome/manifest.json")