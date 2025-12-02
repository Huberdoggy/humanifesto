
# Humanifesto v1 – System Design (Milestone Spec)

> **Milestone Location Suggestion**: place this file under `milestones/Humanifesto_v1_System_Design.md` in the repo.  
> **Role**: this document is the *implementation blueprint* referenced by `AGENTS.md`, not a replacement for it.

---

## 1. Product Summary & Constraints

**Humanifesto (v1)** is a **catalog + light meta** Stremio add-on that:

- Accepts **user configuration** (genres, vibe/mode, short freeform text).
- Uses a **pre-built offline corpus** of titles (`corpus_v1.json`) labeled with IMDB IDs and tags.
- At runtime, **scores titles** against the user’s configuration.
- Returns a **small, curated catalog** of:
  - Up to ~20 **movies**
  - Up to ~5 **series**
- Relies on Stremio’s existing metadata and stream add-ons (e.g., Cinemeta) for:
  - Posters, backgrounds, synopses, cast, details
  - Streams and subtitles

**Non-goals for v1**

- No runtime calls to TMDB / Trakt / IMDB APIs.
- No user accounts, logins, or API keys.
- No Humanifesto-managed streams or subtitles.
- No logging of user-level behavior or analytics metrics.

---

## 2. High-Level Architecture

**Components**

1. **Stremio Client**
   - User-facing app (desktop or web).
   - Calls Humanifesto’s endpoints:
     - `/manifest.json`
     - `/catalog/...`
     - `/meta/...` (optional)
   - Independently calls other add-ons for streams/subtitles/extra metadata.

2. **Humanifesto Add-on (Node.js + Stremio SDK)**
   - Node service deployed on BeamUp or equivalent.
   - Uses `stremio-addon-sdk` to expose:
     - `manifest.json`
     - Catalog handlers for:
       - `humanifesto_movies` (type: `movie`)
       - `humanifesto_series` (type: `series`)
     - Optional meta handler for special/custom IDs.
   - Loads `corpus_v1.json` at startup into memory.

3. **Config UI (Web page, e.g. `/configure`)**
   - HTML/JS frontend hosted by the same service (or static hosting).
   - Lets user choose:
     - Primary genre (required)
     - Secondary genre (optional)
     - Exclusion toggle (optional)
     - Mode (`canon` / `oddities`)
     - Optional freeform seed text (short)
   - Builds a **manifest URL** with query params encoding the choices.

4. **Offline Corpus Builder**
   - Local script(s), not part of runtime, e.g.:
     - `scripts/build_corpus_v1.py` or `scripts/build_corpus_v1.ts`
   - Responsibilities:
     - Populate `corpus_v1.json` with:
       - IMDB IDs (`ttXXXXXXX`)
       - Title, year, type
       - Genres
       - Tags / vibe flags
       - Optional popularity signal
     - Validate integrity (no duplicate IDs, no malformed IMDB IDs).
   - May use external APIs *offline* during corpus construction.

---

## 3. Data Model – `corpus_v1.json`

**Shape**: an array of entries (optionally split into `movies` / `series` collections at runtime).

```jsonc
[
  {
    "id": "tt1234567",          // IMDB ID (canonical)
    "type": "movie",            // "movie" | "series"
    "title": "Prey 2",
    "year": 2025,
    "genres": ["Action", "Sci-Fi", "Thriller"],

    "tags": [
      "cat-and-mouse",
      "jungle",
      "survival",
      "slow-burn",
      "predator-hunt",
      "period-piece",
      "low-dialogue"
    ],

    "director": "Dan Trachtenberg",

    "vibe_flags": {
      "slow_burn": true,
      "extreme_violence": false,
      "campy": false,
      "ensemble": false,
      "arthouse": false
    },

    "popularity_weight": 0.8,   // optional float used to break ties / nudge
    "corpus_version": "v1"
  }
]
```

**Design principles**

- `id` uses the IMDB `tt` format for maximum compatibility with Cinemeta and common stream providers.
- `genres` represent high-level categories (aligned to Stremio’s genre vocabulary where possible).
- `tags` and `vibe_flags` encode nuanced signals Humanifesto cares about:
  - Pacing, tone, setting, structure.
- `popularity_weight` is an optional heuristic to avoid surfacing only ultra-obscure or ultra-mainstream content, depending on mode.

At runtime, the corpus can be held as:

```ts
interface CorpusEntry { /* matches JSON above */ }

const movies: CorpusEntry[] = loadCorpus().filter(e => e.type === "movie");
const series: CorpusEntry[] = loadCorpus().filter(e => e.type === "series");
```

---

## 4. Configuration Design

### 4.1 User-Facing Config Fields

The `/configure` page presents:

1. **Primary Genre** (required, single select)
   - `primaryGenre`: e.g. `Action`, `Horror`, `Sci-Fi`, `Thriller`, `Drama`, etc.

2. **Secondary Genre** (optional, single select)
   - `secondaryGenre`: same enum as primary, plus `None`.

3. **Exclusion Toggle** (optional)
   - `exclude`: e.g. `Comedy`, `Romance`, `Animation`, or `None`.

4. **Mode** (required)
   - `mode`:
     - `canon` → tighter, “safer” picks.
     - `oddities` → more offbeat, rarity-leaning picks.

5. **Seed Text** (optional, short freeform)
   - `seed`: 1–3 sentences describing what the user loved, e.g.:  
     _“Loved how stripped-down and tense the new Predator film was—minimal dialogue, lots of stalking, zero Marvel-style quips.”_

All of this is **per-install configuration**; one set of choices per Humanifesto entry in Stremio’s add-on list.

### 4.2 Config → Manifest URL

The config UI builds a manifest URL such as:

```text
https://humanifesto.example.com/manifest.json
  ?primaryGenre=Action
  &secondaryGenre=Horror
  &exclude=Comedy
  &mode=canon
  &seed=Loved+the+slow-burn+hunter-prey+vibes+in+Prey+2
```

- Stremio stores this URL as **the manifest** for this add-on instance.
- All subsequent calls from Stremio include the same query parameters, allowing the add-on to behave consistently given those preferences.
- The seed text should be kept short to avoid URL-length issues (practically, a couple of sentences).

---

## 5. Manifest & Resources

### 5.1 Manifest Shape (Conceptual)

```jsonc
{
  "id": "com.kyle.humanifesto",
  "version": "1.0.0",
  "name": "Humanifesto",
  "description": "Tell it what you loved, get a small, human-feeling list of films and shows that match the vibe.",
  "logo": "https://cdn.yourdomain.com/humanifesto/logo-256.png",

  "resources": [
    "catalog",
    {
      "name": "meta",
      "types": ["movie", "series"],
      "idPrefixes": ["tt", "human_"]
    }
    // Note: no "stream" or "subtitles" resources are declared in v1.
  ],

  "types": ["movie", "series"],

  "catalogs": [
    {
      "id": "humanifesto_movies",
      "type": "movie",
      "name": "Humanifesto: Movies"
    },
    {
      "id": "humanifesto_series",
      "type": "series",
      "name": "Humanifesto: Series"
    }
  ]
}
```

**Key decisions**

- `resources` intentionally **omits** `"stream"` and `"subtitles"`:
  - Humanifesto is purely a catalog (+ light meta) add-on.
  - Streams and subtitles are fully delegated to other add-ons the user already has installed.
- `idPrefixes` includes:
  - `"tt"` → standard IMDB IDs handled by Cinemeta and compatible addons.
  - `"human_"` → reserved for potential future custom IDs (v2+).

---

## 6. Runtime Flows

### 6.1 Install & Config Flow

1. User opens the Humanifesto `/configure` page in a browser.
2. User selects:
   - Primary genre, optional secondary genre, optional exclusion.
   - Mode (`canon` / `oddities`).
   - Optional seed text.
3. User clicks **“Install in Stremio”**.
4. Stremio is opened with the generated manifest URL.
5. Humanifesto’s SDK-based server returns `manifest.json`, optionally echoing some config in fields like `name`/`description` if desired.
6. Humanifesto is now installed as a configured add-on instance.

### 6.2 Catalog Fetch – Movies

When the user navigates to the **Humanifesto: Movies** catalog:

1. Stremio calls the add-on’s `catalog` handler with:
   - `type = "movie"`
   - `id   = "humanifesto_movies"`
   - Query params from the manifest URL (config).
2. Humanifesto:
   - Parses config (`primaryGenre`, `secondaryGenre`, `exclude`, `mode`, `seed`).
   - Filters `corpus_v1.movies` to a candidate subset.
   - Scores candidates (see **Section 7**).
   - Sorts them by score descending.
   - Slices to the top **N = 20** items.
3. Returns a response of the form:

```jsonc
{
  "metas": [
    {
      "id": "tt1234567",
      "type": "movie",
      "name": "Prey 2",
      "poster": "https://images.metahub.space/poster/medium/tt1234567/img",
      "year": 2025,
      "genres": ["Action", "Sci-Fi", "Thriller"]
    }
    // up to 20 items total
  ]
}
```

### 6.3 Catalog Fetch – Series

The **Humanifesto: Series** catalog operates identically, except:

- `type = "series"`
- `id   = "humanifesto_series"`
- Max results: **N = 5**

### 6.4 Expanded View (Metadata, Backgrounds, Cast, etc.)

1. User selects a title from the catalog (e.g. `id = "tt1234567"`).
2. Stremio consults its metadata stack:
   - Cinemeta (built-in) and any other metadata addons installed by the user.
   - These provide background images, posters, full synopses, cast lists, ratings, etc.
3. Optionally, Stremio may also call Humanifesto’s `meta` handler:
   - For IDs with prefix `tt`, Humanifesto can:
     - Return minimal meta (matching the catalog preview), or
     - Defer entirely to Cinemeta.
   - For hypothetical future IDs with prefix `human_`, Humanifesto could provide full custom meta (v2+).

### 6.5 Streams and Subtitles

- Stremio calls all other addons that declare `"stream"` and `"subtitles"` resources and support:
  - The requested `type` (movie/series).
  - The requested ID (often IMDB-based, but depends on each provider).
- Humanifesto **does not** participate in stream or subtitle resolution in v1.
- This mirrors the behavior users already expect: one addon surfaces a list; others handle the actual playback and subtitles.

---

## 7. Matching & Scoring Logic

**Inputs**

- A list of candidate entries from `corpus_v1` matching the requested type.
- User config derived from manifest query params:
  - `primaryGenre`
  - `secondaryGenre`
  - `exclude`
  - `mode`
  - `seed` (optional)

**Scoring outline**

For each candidate `entry`:

```text
score =
  3 * primaryGenreMatch(entry)
+ 1 * secondaryGenreMatch(entry)
- 2 * excludedGenreMatch(entry)
+ modeBonus(entry)
+ seedSimilarity(entry)
+ 0.5 * entry.popularity_weight
```

Where:

- `primaryGenreMatch(entry)` is 1 if `primaryGenre ∈ entry.genres`, else 0.
- `secondaryGenreMatch(entry)` is 1 if `secondaryGenre` is set and present in `entry.genres`, else 0.
- `excludedGenreMatch(entry)` is 1 if `exclude` is set and present in `entry.genres`, else 0.
- `modeBonus(entry)`:
  - `canon`: slight positive bias for more mainstream or critically acclaimed entries.
  - `oddities`: slight positive bias toward entries with:
    - lower mainstream popularity
    - rarer tags
- `seedSimilarity(entry)` is derived from simple NLP:
  - Keyword overlap between `seed` text and `entry.tags` / title / director.
  - Optional: synonyms or stemmed forms for robustness.

**Filtering & selection**

1. Start from `movies` or `series` subset of `corpus_v1`.
2. Apply **hard filters**:
   - Exclude entries with no overlap at all with `primaryGenre` / `secondaryGenre`.
   - Exclude entries that obviously violate the `exclude` preference (e.g., `exclude = Comedy` and `entry.genres` contains `Comedy`).
3. Compute `score` for all remaining entries.
4. Sort entries by `score` descending.
5. Select top **N** (20 for movies, 5 for series).

This design keeps:

- Behavior **deterministic** given `(config, corpus_v1)`.
- Implementation **simple** enough to test thoroughly.
- Room for future enhancements (e.g. embeddings) without changing overall shape.

---

## 8. Operational & Deployment Notes

- **Runtime stack**
  - Node.js service using `stremio-addon-sdk`.
  - Exposes add-on endpoints and serves static config UI assets.
  - Loads `corpus_v1.json` into memory on startup for fast scoring.

- **Deployment**
  - Preferred: BeamUp (per SDK recommendations), but any Node-capable host works.
  - Environment variables for:
    - Host/port
    - Optional toggles (e.g. debug logging).

- **Corpus versioning**
  - `corpus_v1.json` lives in repo under `corpus/` or similar.
  - Future updates produce `corpus_v2.json`, etc.
  - The add-on uses the current corpus version by default; if multiple need to co-exist, a `corpusVersion` param could be added later.

- **Logging & privacy**
  - No logging of user-specific viewing behavior, preferences, or identifiers.
  - Runtime logs limited to **technical diagnostics** only, e.g.:
    - startup/shutdown messages
    - configuration parsing errors
    - corpus load failures
  - Any optional aggregate stats would be a future consideration, **not** part of v1.

---

## 9. Testing & Acceptance Criteria

Goal: give high confidence that Humanifesto behaves predictably and robustly across typical and edge-case scenarios, **without** exploding into unmanageable combinatorics.

### 9.1 Unit Tests (Scoring & Filtering)

**Focus**: scoring function, filtering rules, and deterministic behavior.

Examples:

1. **Primary genre dominance**
   - Given a set of entries where only some match `primaryGenre`, verify:
     - Non-matching entries always score strictly below matching ones (all else equal).

2. **Secondary genre tiebreaker**
   - Two entries both match `primaryGenre`, but only one matches `secondaryGenre`:
     - That entry should score higher.

3. **Exclusion enforcement**
   - If `exclude = Comedy`:
     - Entries containing `Comedy` in `genres` must be filtered out *before* scoring, or receive a sufficiently large penalty that they never appear in top N.

4. **Mode behavior**
   - For a fixed config and corpus:
     - `mode = canon` yields a top-N dominated by entries with higher `popularity_weight`.
     - `mode = oddities` shifts some less-popular entries into top-N, without sacrificing complete relevance.

5. **Seed similarity impact**
   - Construct a small synthetic corpus where only one entry has tags overlapping heavily with the `seed` text.
   - Confirm that entry bubbles into the top-N, and verify that removing the seed lowers its rank.

6. **Determinism**
   - Running the scoring and selection multiple times with the same `(config, corpus_v1)` must always yield the same ordered list of IDs.

### 9.2 Integration Tests (Add-on Handlers)

**Focus**: correct behavior of `catalog` and (optionally) `meta` endpoints with realistic payloads.

1. **Movies catalog basic behavior**
   - Call the movies `catalog` handler with:
     - `type = movie`, `id = humanifesto_movies`
     - Realistic config params.
   - Assert:
     - Response JSON is valid (no missing fields).
     - `metas.length <= 20`.
     - All entries have `type = "movie"`.
     - All entries respect primary/exclusion genre constraints.

2. **Series catalog basic behavior**
   - Same as above, but for `type = series`, `id = humanifesto_series`, and `metas.length <= 5`.

3. **Empty candidate set edge-case**
   - Use a contrived config that theoretically matches nothing (e.g. primary genre not present in corpus + restrictive exclusions).
   - Catalog handler should:
     - Return a **valid** response with an empty `metas` array (not an error).
     - Not crash or throw.

4. **Malformed config fallback**
   - Omit some optional params or provide invalid values (e.g. unknown genre token).
   - Verify handler:
     - Falls back to sensible defaults (e.g. ignore bad secondary genre).
     - Still returns a valid response.

5. **Corpus load failure**
   - Simulate `corpus_v1.json` missing or corrupted.
   - On startup, service should:
     - Log a clear error.
     - Either refuse to start, or respond with a graceful error message (depending on chosen strategy).
   - Under no circumstance should it return malformed JSON to Stremio.

### 9.3 Stremio Web Test (End-to-End)

**Focus**: real-world behavior in the official Stremio test environment.

Scenarios:

1. **Standard install and browse**
   - Use `/configure` to produce a manifest URL.
   - Install the add-on in the Stremio web test environment.
   - Confirm:
     - Humanifesto catalogs appear under `Discover`.
     - Entries show up as expected (visually and count-wise).

2. **Expanded meta resolution**
   - Click a Humanifesto-listed title that uses a real IMDB ID.
   - Confirm:
     - Background, poster, synopsis, and cast resolve via Cinemeta or other metadata addons.
     - Humanifesto itself does not need to provide extended meta for `tt` IDs in v1.

3. **Streams from other providers**
   - With a known stream provider add-on installed (e.g. a torrent-based addon), click through from a Humanifesto item.
   - Confirm:
     - Streams are offered by the provider add-on as expected.
     - Humanifesto is not in the stream list, as it declares no `stream` resource.

4. **Graceful behavior under no-stream scenario**
   - Test on an account with **no** stream providers installed.
   - Opening a Humanifesto item should:
     - Still show metadata (via Cinemeta, if enabled).
     - Simply have no available streams.
   - This ensures Humanifesto does not couple its correctness to the presence of provider addons.

### 9.4 Edge-Case Scenarios (High-Level Checklist)

Without exhaustively enumerating every combination, we aim to confirm Humanifesto behaves sanely for:

- **Sparse corpus**: very few entries matching a config.
  - Expect: small result lists, not errors or poorly scored unrelated items.
- **Dense corpus**: many possible matches.
  - Expect: top-N remains focused and deterministic; no runaway or unstable behavior when small corpus changes occur.
- **Ambiguous genres**: titles with overlapping or multi-genre tags.
  - Expect: consistent treatment in scoring (primary > secondary > excluded).
- **No seed text provided**.
  - Expect: scoring still produces coherent lists purely from genre/mode/weights.
- **Highly expressive seed text**.
  - Expect: seed influence is noticeable but not overpowering; it should refine, not completely override, genre-based constraints.

Meeting these criteria should be sufficient to consider Humanifesto v1 “ready for handoff” to Codex for implementation and, eventually, public testing—**without** falling into a combinatorial “bag of marbles” testing trap.
