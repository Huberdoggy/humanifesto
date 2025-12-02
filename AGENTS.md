# Humanifesto – AGENTS.md  

## Introduction  

Richard,  

Pull your chair in close and imagine, for a moment, that the streaming wars have quieted down. No autoplay trailers shouting at you, no endless rail of thumbnails begging for attention. Just a person, a mood, and a night to fill.  

**Humanifesto** is our small rebellion against the industrial recommendation complex.  

This add-on doesn’t want another login, another “linked service,” or another harvested history file. It wants a story. A scrap of enthusiasm. A line like:  

> “Man, I just watched Dan Trachtenberg’s new 2025 Predator flick and it was top notch.”  

From that, Humanifesto doesn’t try to build a psychological dossier. It does something gentler and more honest: it reads between the lines, looks at what made that experience *feel* right, and proposes a short list of next watches that fit the same emotional frame.  

No Trakt accounts. No IMDB scraping. No infinite feed.  

Instead, the add-on behaves like a well-read friend behind the concession stand — someone who remembers what moved you last time and can say, “If that worked for you, here are a few more that might hit the same nerve.”  

Your job in this production is simple and sacred:  
- Give the Stremio backend what it needs, in the shape it expects.  
- Give the viewer a sense that every suggestion has a human thought behind it, even when it’s just rules and code doing the thinking.  

We’re building a tiny corner of the streaming universe where **taste feels hand-stitched** and every “play” button could plausibly earn two thumbs way up.  

---

## Analysis  

### A) Technical Direction  

This section is your production map. When in doubt, return here, then cross-reference the milestone specs.  

1. **Repository Layout & Scope**  
   - All Humanifesto implementation work lives under the root-level `addon/` directory.  
   - Within `addon/`, you will find (or create) the following subdirectories:  
     - `addon/artwork/` – visual identity assets  
       - `humanifesto_logo_fullsize.png`  
       - `favicon.png`  
       - `manifest_logo.png`  
       - The **specific usage, sizing, and placement** of each asset (config UI hero image vs. Stremio manifest logo vs. favicon) is **further detailed in** `addon/milestones/`. Treat those instructions as binding.  
     - `addon/milestones/` – your compendiums and living blueprints  
       - `humanifesto_config_ui_spec.md`  
         - Describes the standalone configuration page experience (the “red carpet” where the user sets knobs and leaves with a valid manifest URL).  
       - `humanifesto_v1_system_design.md`  
         - Describes the end-to-end Humanifesto architecture: inputs, corpus, scoring, and how it all plugs into the Stremio add-on SDK.  
       - In practice, **AGENTS.md is your narrative charter**; the milestone files are the scene-by-scene shooting script. Always reconcile them before making structural changes.

2. **Stremio SDK as Canon**  
   - For all protocol, manifest, and handler-shape questions, defer to the **official SDK knowledge via Context7**.  
   - Use the MCP inspector to introspect the `/stremio/stremio-addon-sdk` context:  

     ```bash
     npx -y @modelcontextprotocol/inspector --cli        npx @upstash/context7-mcp
     ```

   - Within that inspector, ensure you are consulting the **`/stremio/stremio-addon-sdk` library** for:  
     - Expected manifest structure  
     - Catalog / meta / stream handler signatures  
     - Accepted resource + type combinations  
     - Any nuances around `extra` parameters and filters  
   - The guiding principle: **Humanifesto should always “speak in a language” the Stremio backend understands.** If the SDK and AGENTS.md ever appear to diverge, SDK structure wins; we then update our docs to match.

3. **Branching & Workflow**  
   - Before performing any implementation work, **check out a fresh branch** from the canonical main branch.  
   - Use a concise, descriptive naming convention that makes the intent obvious at a glance. Examples:  
     - `feature/v1_implementation`  
     - `feature/config-ui-red-carpet`  
     - `chore/corpus-loader-refactor`  
   - Each branch should represent a coherent piece of the Humanifesto experience: a feature, a refinement, or a test pass – never a grab-bag of unrelated edits.

4. **Logic vs. Plumbing – Clear Separation**  
   - The **Stremio add-on SDK layer** is plumbing: manifest, handlers, CORS, wiring.  
   - The **Humanifesto engine** is the logic:  
     - Parsing user configuration and freeform text  
     - Consulting the offline corpus  
     - Scoring titles for “vibe fit”  
     - Emitting results in the exact schema expected by the SDK.  
   - Keep these concerns as distinct as possible inside `addon/` so that the taste engine can evolve without rewriting the protocol surface.

5. **Artwork & Identity Integration**  
   - When wiring artwork into the UI and manifest, follow the constraints laid down in the milestone docs:  
     - `humanifesto_logo_fullsize.png` – used where you have ample real estate to sell the “private premiere” fantasy (e.g., hero image for the config UI).  
     - `manifest_logo.png` – optimized for Stremio’s manifest/logo usage where clarity at small sizes matters more than flourish.  
     - `favicon.png` – the smallest, most legible brand mark for browser tabs and shortcut icons.  
   - In every context, the visuals should quietly reinforce the promise: curated, cinematic recommendations, not a generic SaaS widget.

---

### B) Support  

Humanifesto doesn’t just need to work; it needs to **earn trust** through predictable behavior. That’s what our tests are for.  

1. **Acceptance Tests – Your First Audience**  
   - Complete and ensure that **any assigned acceptance tests pass** before considering a branch ready for review.  
   - These tests are not optional extras; they are the first line of critique, the equivalent of watching the cut in an empty theater before inviting a crowd.  
   - The current and future test suites will be fully detailed under `addon/milestones/` alongside the design docs. When in doubt about expected behavior, look there first.

2. **Kyle’s Additional Validation**  
   - After your assigned tests pass, **Kyle Huber will perform additional exploratory tests** to validate nuanced interactivity and edge-case behavior before integrating your work into the master branch.  
   - Think of Kyle’s pass as that late-night screening with a critic friend: he’s looking for moments where the illusion breaks — where a recommendation feels off, a catalog response looks malformed, or a config flow feels anything less than intuitive.

3. **Dynamic Delegation & Staying Current**  
   - The **delegation of work and responsibility within the milestone files is subject to change.**  
   - At the **commencement of each implementation session**, review the docs in `addon/milestones/` to ensure:  
     - You’re working against the latest design intent.  
     - You understand which tests and components are currently in your lane.  
   - If you ever find a mismatch between behavior in code and the written milestones, treat that as a bug in *one* of the two:  
     - Either the code has drifted from the agreed experience,  
     - Or the docs need to be updated to reflect an intentional evolution.  
   - Surface those mismatches early; it’s always cheaper to reshoot while the sets are still standing.

---

## Conclusion  

We’re not trying to conquer the streaming landscape here, Richard. We’re just trying to carve out a small, honest corner of it — a place where recommendations feel like **conversation** instead of **surveillance**.  

Your craft on this project will never be seen directly by the viewer, but they’ll feel it every time Humanifesto hands them a list of titles that somehow “get” what they were in the mood for. That’s our quiet magic trick.  

So build this like you’d review a film you believe in: with clarity, with care, and with respect for the person on the other side of the screen who’s just trying to find something worthwhile to watch tonight. If we do our jobs right, every time they click into Humanifesto, it won’t be another algorithmic shrug — it’ll be a small moment of trust, two thumbs way up, and one more good story queued up for the projector.
