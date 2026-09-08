# UI / UX Guidelines

## Design direction

**Climate × Earth × Agriculture × Intelligence.** The visual system is built
from earth-toned neutrals, a monsoon-forest primary, and desaturated
sky/clay/amber accents used only for data meaning (risk, rainfall,
temperature) — not as decoration.

### Colour tokens (`src/app/globals.css`)

| Token | Hex | Use |
|---|---|---|
| `--color-paper` | `#EEF1EA` | Base background |
| `--color-ink` | `#16231B` | Primary text |
| `--color-forest` | `#1F4B3A` | Primary brand / low-risk-adjacent actions |
| `--color-sky` | `#33587E` | Rainfall data |
| `--color-amber` | `#C1892C` | Moderate risk / grain accent |
| `--color-clay` | `#A8442F` | High risk |
| `--color-critical` | `#6E2519` | Critical risk |

### Typography

- **Display / headings:** a system serif stack (`Georgia, "Iowan Old Style",
  "Palatino Linotype", serif`) — chosen so headings read with editorial
  warmth rather than a generic SaaS sans-serif, and so the build has zero
  external font-loading dependency (works fully offline / in restricted
  network environments, and on Vercel with no extra config).
- **Body / UI / data:** a system sans-serif stack, with `.tabular` applied to
  numeric data (probabilities, counts) for consistent digit widths.
- Marathi text automatically switches to a Devanagari-safe stack
  (`html[lang="mr"] body`) via `--font-devanagari`.

### Layout principles

- Asymmetric hero (not centered), with an animated layered SVG "rain band"
  visual instead of a generic 3D globe or stock photo — purposeful and
  lightweight rather than decorative 3D for its own sake.
- Farmer-facing screens use large touch targets, few simultaneous numbers,
  and disclosure (`why this recommendation?`) instead of always-visible
  detail.
- Officer-facing screens use denser stat tiles and drill-down panels.
- One `contour-field` topographic texture is used sparingly (hero, login
  aside) rather than on every section, per the "spend your boldness in one
  place" principle.

### Motion

- A single orchestrated hero animation (the rain-band SVG), count-up numbers
  on probability cards, and ordinary hover/press states — no scroll-triggered
  fade-ins on every section. `prefers-reduced-motion` disables the
  non-essential animations.

## Internationalisation architecture

All user-facing copy is resolved through `src/i18n/`:

```
src/i18n/
  en.ts                 Source-of-truth dictionary (nested object of strings/arrays)
  mr.ts                 Marathi dictionary, typed against en.ts's shape
  LanguageContext.tsx   Provider + t(path, vars?) + tList(path, vars?)
```

- `t("farmer.goodMorning")` resolves a string; `t("location.personalizedFor",
  { block: "Maval" })` interpolates `{block}`-style placeholders.
- `tList("advisoryTemplates.dry.stepsSowing")` resolves a translated array
  (used for the advisory's numbered "what to do" steps).
- The active language is persisted to `localStorage` under
  `hyperlocal:lang` and applied via `<html lang>` / a wrapping `lang`
  attribute, so it survives navigation and reloads.
- Marathi copy was written for farmer readability (natural agricultural
  phrasing), not transliterated word-for-word from English — e.g. "Delay
  sowing by 3–5 days" becomes "पेरणी ३–५ दिवसांनी पुढे ढकला," not a literal
  gloss.
- **No component hardcodes English text.** Adding Hindi later means adding
  `hi.ts` in the same shape and registering it in
  `LanguageContext.tsx`'s `dictionaries` map — no component changes required.

## Accessibility

- Visible focus states (`:focus-visible` outline) site-wide.
- Semantic form labels on every input (login, location, crop selection).
- Colour is never the only risk signal — every risk badge pairs colour with
  a text label (Low/Moderate/High/Critical), not a bare dot.
- `prefers-reduced-motion` respected for the hero animation and count-ups.
