# Dev Artwork Serving Note (for Codex)

> **Context**: This note supplements the existing Humanifesto v1 system design and UI specs.  
> **Scope**: How to serve local artwork correctly in a non-hosted / localhost v1 dev scenario.

## 1. Asset Layout (Repo-Level)

Artwork files are expected to live under the `addon/artwork/` directory, for example:

- [manifest_logo.png](../artwork/manifest_logo.png) → 256×256 icon used for the Stremio add-on manifest logo.  
- [favicon.png](../artwork/favicon.png) → 32×32 (or similar) favicon for the config UI page.  
- [humanifesto_logo_fullsize.png](../artwork/humanifesto_logo_fullsize.png) → larger hero image used in the config UI.

You may assume this structure already exists or will be created accordingly.

## 2. Dev Server Requirements (Local / Non-Hosted v1)

In the v1 “pure localhost” development scenario, the goal is:

- The Stremio web test instance and desktop client should see the **manifest logo**.  
- The browser should see the **favicon** and **hero logo** when loading the config UI page.  
- **No external hosting** (BeamUp, CDN, etc.) is required for initial demos and screenshots.

To achieve this, please ensure:

1. The Node server that powers the Humanifesto add-on also serves `/artwork` as static files from `addon/artwork/`.

   A typical pattern (using Express) would be:

   ```js
   const path = require("path");
   const express = require("express");
   const { serveHTTP } = require("stremio-addon-sdk");
   const addonInterface = require("./addon");

   const app = express();
   const PORT = process.env.PORT || 7000;

   // Serve local artwork under /artwork
   app.use(
     "/artwork",
     express.static(path.join(__dirname, "artwork"))
   );

   // Attach Stremio addon interface to the same app
   serveHTTP(addonInterface, { app });

   app.listen(PORT, () => {
     console.log(`Humanifesto dev server at http://localhost:${PORT}`);
     console.log(`Manifest: http://localhost:${PORT}/manifest.json`);
     console.log(`Logo:     http://localhost:${PORT}/artwork/manifest_logo.png`);
   });
   ```

   The exact wiring can differ, but the key requirement is:
   - Assets in `addon/artwork/` are reachable via HTTP URLs like:  
     `http://localhost:<PORT>/artwork/manifest_logo.png`

2. The Humanifesto manifest object must reference the logo via **HTTP URL**, not a filesystem path.

   **Do NOT** use repo paths like:

   ```js
   // ❌ Incorrect (filesystem path, not visible to Stremio)
   logo: "addon/artwork/manifest_logo.png"
   ```

   Instead, for local dev, use the HTTP URL exposed by the server:

   ```js
   // ✅ Correct for localhost dev
   logo: "http://localhost:7000/artwork/manifest_logo.png";
   ```

   This ensures Stremio can fetch the logo when it requests `/manifest.json`.

3. The config UI must reference artwork via the same HTTP paths.

   For example, in the config UI HTML:

   ```html
   <!-- Hero logo in the header -->
   <img src="/artwork/humanifesto_logo_full.png" alt="Humanifesto logo" />

   <!-- Favicon in <head> -->
   <link rel="icon" type="image/png" href="/artwork/favicon.png" />
   ```

   Because the UI is being served by the same server, relative `/artwork/...` paths will resolve correctly.

## 3. Rationale

Stremio and browsers cannot see raw repository paths such as `addon/artwork/manifest_logo.png`.  
They can only access what is exposed over HTTP.

For v1 dev (even if the add-on is **never** deployed to BeamUp or a public host), this arrangement guarantees:

- The manifest logo renders correctly in the Stremio test web instance and desktop client.  
- The config UI displays the intended hero image and favicon for screenshots and demos.  
- No external asset hosting is required beyond the local Node server.

Please implement **the minimal static serving** needed to satisfy these constraints; no extra complexity is required.
