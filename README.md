# 🧒 Humanifesto 🍿

Humanifesto is a Stremio add-on that makes *"what should I watch next?"* feel human again; no extra accounts, no Trakt/IMDB scraping, no infinite feed. Just tell it what you loved, and it returns a small, hand-picked list of films and shows that match the vibe, not the algorithm.


---

## 📷 Screenshots
![Upper UI](./addon/screenshots/ui_view1.png?raw=true)
![Lower UI](./addon/screenshots/ui_view2.png?raw=true)
![Add-on Installation Prompt](./addon/screenshots/install_view.png?raw=true)
![Catalogue Meta](./addon/screenshots/catalogue_view.png?raw=true)

---

## 🛠️ Setup

1) Install deps: `cd addon && npm install`
2) Run locally: `npm start` (serves addon + config UI on port 7000 by default)
3) Open `http://localhost:7000/configure` to generate a manifest URL; artwork is served locally from `/artwork/...`.

---

## 🛠️ Backend Commands (Local Testing)

- `npm start` — start the Express dev server (default `PORT=7000`), serving `/manifest.json`, `/catalog`, `/meta`, `/configure`, and `/artwork/*`.
- `PORT=7090 BASE_URL=http://localhost:7090 npm start` — override host/port if desired; keep `BASE_URL` aligned so manifest/logo links resolve.
- Corpus lives at `addon/corpus/corpus_v1.json`; loaded at startup with basic validation output to the console.
- Manifest logo is wired to `${BASE_URL}/artwork/manifest_logo.png`; config UI hero + favicon use `/artwork` paths.

### Installing in Stremio (desktop + web dev)
- From `http://localhost:7000/configure`, click **Install in Stremio**:
  - Attempts `stremio://install-addon?addonUrl=<manifest>` deep link for the desktop app.
  - Also opens the manifest URL in a new tab so you can copy/paste.
- Manual flow (web dev instance): copy the manifest URL shown in the preview box and paste into Stremio → Add-ons → Add via URL. Cinemeta will provide posters/meta when browsing the Humanifesto catalogs.



## 👤 Authorship and Use

Humanifesto is crafted by [Kyle Huber](https://linkedin.com/in/kyle-james-my-filenames) and is currently implemented and tested against the Stremio web dev environment as a portfolio proof-of-concept. It's not published to a public add-on host by design, to keep maintainership and hosting overhead minimal. The codebase is fully deployable to any Node-friendly host with HTTPS if future maintainers wish to run it in the wild.

Terms of use (and the *"as is"* disclaimer) are futher detailed in the [LICENSE](./LICENSE.md)
