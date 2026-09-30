# Interactive Bible Map app

This Expo + React Native Web app now renders the M3 map view with MapLibre GL JS 6.10.

## Map architecture (web)

- **Renderer:** MapLibre GL JS (lazy-loaded with `React.lazy` so shell UI paints before map code parses).
- **Basemap styles (hosted + committed):**
  - `app/public/styles/liberty/style.json` (main)
  - `app/public/styles/versatiles-colorful/style.json` (outage-only fallback)
- **Basemap treatment:** physical-only (relief, natural landcover, water, rivers/streams), max zoom 14.
- **Places rendering:** MapLibre sources/layers (clustered city-tier source, circle/symbol layers, canvas images via `map.addImage` for dashed candidate pins and `?` badge).
- **Keyboard/screen reader path:** hidden DOM list of currently visible places (`button[data-place-entry-id]`), updated on `moveend`/`idle`.
- **Selection state:** URL-backed (`?place=` + `&candidate=`), restored on load.
- **Search:** ARIA 1.2 combobox over `generated/places.index.json` (`names.ancient` + `names.alternate` only), with case/diacritic-insensitive prefix and word-start matching plus one-typo tolerance for names of 5+ letters.
- **Menu drawer:** About, Sources & credits, Report an issue, and View on GitHub.

## Map worker and export

MapLibre 6 runs tile/layout work in a web worker. Before web export, the app copies:

- `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs`
- every static relative import used by that worker (currently `maplibre-gl-shared.mjs`)
  → `app/public/`

The copy runs automatically in `preexport:web` (`npm run prepare:maplibre-worker`). These files stay untracked so they always match the installed MapLibre version.

## Basemap fallback

- Default basemap: hosted Liberty copy (`/styles/liberty/style.json`)
- Automatic fallback: hosted VersaTiles copy (`/styles/versatiles-colorful/style.json`)
- Trigger: **3 main-vector tile errors (`openmaptiles`) within 30 seconds**
- User message on switch: _"The main map service isn't responding. Showing the backup map."_
- Build-time override: `EXPO_PUBLIC_BASEMAP=fallback`

## Runtime map-tuning variants (URL params)

These harmless query params stay enabled in production so the human can compare map feel and tile behavior:

- `?relief=0` — force relief shading off (`natural_earth`)
- `?relief=1` — force relief shading on
- `?landcover=0` — hide natural-land layers (plain land + water)
- `?fade=0` — disable symbol fade transitions
- `?dpr=1` — cap map pixel ratio to 1
- `?dpr=2` — force map pixel ratio cap back to 2
- `?zoomrate=fast` — faster wheel/trackpad/pinch zoom rates
- `?lite=1` — shortcut for all of the above

By default, the app now auto-caps map pixel ratio to 1 when it detects a software WebGL renderer
(for example SwiftShader on remote desktop / CI runners), and also defaults relief shading off there.
GPU-backed devices keep the original defaults (pixel-ratio cap 2, relief on). Use `?dpr=2` and
`?relief=1` to compare against the original look.

You can combine them with normal location selection, for example:

- `/?place=galilee&dpr=1`
- `/?place=jerusalem&lite=1`

## Regenerating hosted style files

Run from repository root:

```bash
npm run build:basemap-styles
```

This refetches upstream style JSON and rewrites:

- `app/public/styles/liberty/style.json`
- `app/public/styles/liberty/LICENSE.txt`
- `app/public/styles/versatiles-colorful/style.json`
- `app/public/styles/versatiles-colorful/NOTICE.txt`

## Commands

Run from repository root:

```bash
npm run lint
npm run typecheck
npm run test:app
npm run build:data
npm run export:web
npm run verify:web:playwright
```

`npm run verify:web:playwright` now also validates the place panel (section order/content, lead-image load, image-credit persistence, and disputed/single-site layouts), checks candidate-pin rendered colors and overview label-overlap regressions, and runs an axe accessibility scan on the open panel (fails on any serious or critical issues).

Local development:

```bash
npm run start --workspace interactive-bible-map-app
npm run web --workspace interactive-bible-map-app
```

## Generated place payloads

`npm run build:data` validates `data/` and writes:

- `app/public/generated/places.index.json`
- `app/public/generated/places/<location-id>.json`

These generated payloads are gitignored.
