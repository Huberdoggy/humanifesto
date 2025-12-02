
# Humanifesto – Red Carpet Config UI Spec (for Codex)

> **Audience**: This document is written for the Codex implementation agent.  
> **Purpose**: Describe the desired look, feel, and behavior of the Humanifesto configuration page so precisely that you, Codex, can _see_ the experience as if you were stepping out of a limo onto a Hollywood red carpet.

This page is **not** part of Stremio’s UI. It is a standalone HTTPS web page you will host alongside the add-on service. Its primary job:

- Let the user set a small number of configuration knobs.  
- Produce a valid **manifest URL** for Stremio including those knobs as query parameters.  
- Make the user feel like they just arrived at a private premiere, not a generic SaaS form.

The details below are intentionally sensory and cinematic. Treat them as design constraints, not prose flourishes.

---

## 1. Experience North Star

When you implement this, imagine yourself as the attendee:

- A limousine door closes behind you.  
- You’re on a **night-time Hollywood Boulevard**: neon signs, poster walls, soft camera flashes.  
- An usher leads you to a **single, elegant form**, framed by cinematic imagery.

The user should feel:

- **Oriented** – they know exactly what this tool does in one glance.  
- **Invited** – the form reads like a concierge, not a tax return.  
- **Respected** – few fields, each meaningful; no account, no API key, no friction.

Your implementation _must_ prioritize:

- Immediate clarity about the **main action** (“Install in Stremio”).  
- Minimal but expressive configuration controls.  
- A visual atmosphere that screams _“we care about movies and shows.”_

---

## 2. Layout Skeleton

The page is a **single-screen experience** with a full-bleed background. Structure it like this:

1. **Background layer (full viewport)**  
   - A dark gradient: deep navy into charcoal.  
   - Subtle noise or grain to avoid flatness.  
   - Very low-opacity silhouettes: poster frames, film reels, or building facades along the sides or bottom.
   - Optional: two soft “spotlight” cones from top left and right, barely visible but adding theatrical depth.

2. **Top bar (floating, subtle)**  
   - Stretches horizontally, anchored at the top.  
   - Background: semi-transparent dark strip (`rgba(0, 0, 0, 0.5)`), with a blur effect if feasible (`backdrop-filter: blur(10px)`).  
   - Left side: Humanifesto “H” logo + wordmark.  
   - Right side: two small text links, e.g.:
     - `Docs`
     - `View on GitHub`  
   - These links are secondary; they should not outshine the main CTA in the form.

3. **Hero strip (upper center)**  
   - Centered collection of:
     - The Humanifesto logo badge.  
     - The product name.  
     - A 1–2 sentence logline.
   - Keep this **above** the main card so the card doesn’t feel cramped.

4. **Central config card (main focal point)**  
   - Glassy, frosted panel, centered both vertically and horizontally on typical desktop resolutions.  
   - Desktop width target: `min(720px, 90vw)`.  
   - Card content may be split into two columns:
     - Left: form.  
     - Right: ambience (poster wall / preview).  
   - On small screens, these stack vertically (form first, ambience second).

5. **Footer strip (discreet)**  
   - A single line of small text near the bottom:  
     - e.g. `Humanifesto v1 · A Stremio catalog add-on`  
   - Optionally accompanied by a simple icon (e.g., popcorn, film reel).  
   - Must not compete visually with the main CTA.

---

## 3. Visual System

### 3.1 Color Tokens

Express this palette as CSS custom properties. Use them consistently.

```css
:root {
  --hf-bg-deep: #050509;          /* deep cinema black */
  --hf-bg-gradient-start: #050509;
  --hf-bg-gradient-end: #101322;

  --hf-accent-gold: #F6C453;      /* marquee lights, primary CTA */
  --hf-accent-crimson: #D72638;   /* red carpet / velvet rope */
  --hf-accent-teal: #00C6FF;      /* neon sign accent */

  --hf-text-primary: #F8F9FF;
  --hf-text-muted: #A0A4B8;
  --hf-border-soft: #2A2E3D;

  --hf-card-bg: rgba(7, 10, 20, 0.90);
  --hf-card-border: rgba(255, 255, 255, 0.08);

  --hf-field-bg: rgba(7, 10, 20, 0.95);
  --hf-field-border: rgba(255, 255, 255, 0.12);
  --hf-field-focus: #F6C453;

  --hf-cta-bg: #F6C453;
  --hf-cta-text: #050509;

  --hf-shadow-soft: 0 24px 60px rgba(0, 0, 0, 0.6);
}
```

Use this mental mapping:

- **Gold** = light from the marquee and the primary action.  
- **Crimson** = red carpet hints (sparingly, as accent).  
- **Teal** = neon signage, subtle glows and outlines.  
- Backgrounds should always be **deep and non-flat**, like being in a cinema, not a spreadsheet.

### 3.2 Typography

Use:

- **Headings**: `Cinzel` (import via Google Fonts or a local equivalent).  
- **Body & UI text**: system UI stack:

```css
font-family:
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Guidelines:

- H1/H2: Cinzel, bold or semi-bold, letter-spacing slightly increased (e.g., `0.03em`).  
- Form labels: small caps or uppercase, semi-bold, `--hf-text-muted`.  
- Body text and helper text: regular weight, comfortable line-height (`1.5`+), never cramped.

The overall impression should read as **premium but legible**, not decorative at the cost of clarity.

---

## 4. Components

### 4.1 Background & Top Bar

**Background**

- Implement a full-viewport element with a gradient:

```css
body {
  min-height: 100vh;
  background: radial-gradient(circle at top left, #141828 0, #050509 40%),
              radial-gradient(circle at top right, #141828 0, #050509 40%),
              linear-gradient(to bottom, var(--hf-bg-gradient-start), var(--hf-bg-gradient-end));
  color: var(--hf-text-primary);
}
```

- Overlay a subtle noise texture if possible (CSS or low-opacity PNG).  
- Optional extra: add a pseudo-element that renders very faint poster frames or building silhouettes at the horizon line (bottom 25% of the screen).

**Top Bar**

- Height: ~56–64px.  
- Full width, anchored to top.  
- Slight backdrop blur, translucent dark background.  
- Content container centered and width-limited (e.g., `max-width: 960px; margin: 0 auto;`).  
- Logo on the left, small links on the right.

### 4.2 Hero Strip

Place this below the top bar, above the main card.

Content:

- Logo badge (the "H" icon) on left or center.  
- To the right or below: name and logline.

Sample copy (you can adjust, but keep the tone):

- Title: `Humanifesto`  
- Subtitle/logline:  
  _“Tell us what you loved. We’ll roll out a small, hand-picked list that matches the vibe — no accounts, no watchlist scraping.”_

This section should occupy modest vertical space and visually lead into the central card, like a marquee over a theater entrance.

### 4.3 Config Card

The card itself should feel like stepping into a **private screening room**.

- Background: `--hf-card-bg`, with border using `--hf-card-border`.  
- Border radius: 16–24px (slightly luxurious).  
- Box shadow: `var(--hf-shadow-soft)`.  
- Padding: 24–32px on desktop, 16–24px on mobile.  
- On desktop, use **two columns** inside:
  - Left: form fields (primary).  
  - Right: ambience (secondary).

#### 4.3.1 Form Column (Left)

Fields in order:

1. **Primary Genre** (select)
   - Label: “Primary genre”  
   - Placeholder: “Choose your main lane”  
   - Use a curated list (not an exhaustive genre dump).

2. **Secondary Genre** (select)
   - Label: “Secondary genre (optional)”  
   - Helper text: “We’ll sprinkle this in when it makes sense.”  
   - Includes `None` as a default.

3. **Hard No** (select)
   - Label: “Hard no”  
   - Helper text: “Types of stories you don’t want in tonight’s lineup.”  
   - Options: `None`, `Comedy`, `Romance`, `Animation`, `Musical`, etc.

4. **Tone of the Night** (segmented control)
   - Label: “Tone of the night”  
   - Two inline buttons or toggles:
     - `Canon` — helper: “Critical darlings & consensus favorites.”  
     - `Oddities` — helper: “Stranger, rarer picks that still fit the vibe.”  
   - Ensure one is always selected (default: `Canon`).

5. **Seed Text** (textarea)
   - Label: “What did you love, really?”  
   - Placeholder: “Optional — describe a movie or show you loved in 1–3 sentences. Think pacing, tension, humor, setting.”  
   - Soft character limit (e.g. `300`), with a subtle counter: `120 / 300`.  
   - Do not enforce hard truncation silently; if user exceeds, gently prompt them to shorten.

**Field Styling**

- Background: `--hf-field-bg`.  
- Border: `1px solid var(--hf-field-border)`.  
- Border radius: 8px.  
- On hover/focus: border color transitions to `--hf-field-focus`; small glow or outline is acceptable.  
- Labels are above fields, not inside them.

#### 4.3.2 Actions Area

Below the fields:

- **Primary CTA** button:
  - Label: `Install in Stremio`  
  - Background: `--hf-cta-bg`, text: `--hf-cta-text`.  
  - Full width on mobile; inline with secondary actions on desktop.  
  - Hover: small scale-up (e.g. `transform: translateY(-1px) scale(1.01);`) and stronger shadow.
- **Secondary actions** (text buttons / icons):
  - `Copy manifest URL` — copies the calculated URL to clipboard.  
  - `Reset form` — returns fields to defaults.

These are secondary; visually, they must not compete with the main CTA.

#### 4.3.3 Ambience Column (Right)

This column is **pure mood**. No functional controls.

Ideas:

- A “poster wall” of 3–5 generic vertical posters (no recognizable IP), slightly tilted and overlapping.  
- A faint animated **spotlight sweep** across the posters (CSS animation on a gradient mask).  
- A small “Tonight’s sample lineup” box with 2–3 skeleton cards (title lines + genre chips) using placeholder text, not real recommendations.

Purpose: remind the user that this is about **cinema**, not just configuration.

On smaller screens, this column may be hidden or moved below the form to preserve usability.

---

## 5. Interactions & Microcopy

### 5.1 Hover & Focus

- Fields: border color and subtle glow on focus.  
- CTA: clear hover feedback; do **not** use jarring animations. Think soft spotlight, not fireworks.

### 5.2 Validation Rules

- Required: `Primary genre`.  
- Recommended defaults:
  - `Secondary genre`: `None`.  
  - `Hard no`: `None`.  
  - `Tone of the night`: `Canon`.
- Seed text:
  - Soft limit around 300 characters; show the counter and a subtle message if exceeded:
    - “Shorter is better — give us the highlights.”

No other aggressive validation is needed.

### 5.3 Error Handling

If building the manifest URL fails (e.g., JavaScript runtime error, missing host, etc.):

- Show a small, non-technical error toast or inline message:  
  - “We couldn’t build your manifest URL. Check your connection and try again.”  
- Do not expose stack traces or internal variable names.

### 5.4 Install Feedback

When the user clicks **Install in Stremio**:

- Perform the appropriate action (e.g., open Stremio’s web instance / protocol with the manifest URL).  
- Additionally show a small modal or inline panel containing the URL with copy button, plus instructions:
  - “If Stremio didn’t open automatically, copy this manifest URL and paste it into Stremio’s ‘Add-ons → Add via URL’ dialog.”

This reduces friction for power users and those in non-standard environments.

---

## 6. Responsive Behavior

### Desktop (≥ 1024px)

- Two-column layout inside the card (form + ambience).  
- Card centered with generous margins.  
- Hero strip visible above the card.  
- Top bar fixed or sticky at the top.

### Tablet (768–1023px)

- Card remains centered, with possible layout adjustment:
  - Option A: columns remain, but each at ~50% width.  
  - Option B: columns stack vertically, but card width stays generous.
- Typography scales slightly down but remains readable.

### Mobile (≤ 767px)

- Single-column layout.  
- Top bar tightens; hero strip simplified.  
- Card is full-width minus small horizontal padding (e.g. 16px).  
- Ambience column:
  - Either stacked below the form or replaced with a single background illustration within the card.  
- Primary CTA remains large and clearly tappable.

Performance note: avoid heavy image assets and expensive JS on mobile; keep page snappy.

---

## 7. Integration Details (Manifest URL & Stremio)

From Stremio’s point of view, this page is **just a way to generate a manifest URL**.

You must:

1. Maintain a **synchronized config state** derived from the form inputs.  
2. Compose a URL of the form:

   ```text
   https://humanifesto.example.com/manifest.json
     ?primaryGenre=<value>
     &secondaryGenre=<value-or-empty>
     &exclude=<value-or-empty>
     &mode=<canon|oddities>
     &seed=<url-encoded-seed-text>
   ```

3. Wire this URL into:
   - The `Install in Stremio` behavior.  
   - The `Copy manifest URL` action.

The backend implementation of `/manifest.json` and catalog handlers is described in the separate **Humanifesto v1 System Design** milestone document.

Here, your responsibility is solely to:

- Generate the correct URL, and  
- Present it in the most cinematic, reassuring way possible.

---

## 8. Implementation Notes (Guidance, Not Mandate)

You are free to choose the technical stack for this page, but the default expectation is:

- **Minimal dependencies**:
  - Vanilla HTML/TypeScript or a lightweight framework.  
  - One CSS bundle, preferably without heavy UI libraries.  
- **No dependence on Stremio’s internal styles**:
  - This page must be visually self-contained.  
- **Respect the tokens and layout described above**:
  - Colors, typography, component hierarchy.

Think of this page as the **lobby** of the Humanifesto theater:

- Warm light (accents), dark walls (background).  
- A single well-designed ticket counter (the form).  
- Posters on the wall (ambience).  
- A clear door into the main show (Install in Stremio).

Your job, Codex, is to make that lobby real.
