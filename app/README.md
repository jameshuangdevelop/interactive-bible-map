# Interactive Bible Map app

This app is an Expo + React Native Web shell that now includes the M3 map view:

- **Map renderer:** MapLibre GL JS 6.10 (web) with a native stub component.
- **Data source:** `app/public/generated/places.index.json` from `npm run build:data`.
- **Web loading:** the shell renders first and lazy-loads the map view (`React.lazy` + dynamic import) so MapLibre code stays in a deferred chunk.
- **Hosted basemap styles:** committed copies in `app/public/styles/`:
  - `styles/liberty/style.json` (main basemap, modified OpenFreeMap Liberty)
  - `styles/versatiles-colorful/style.json` (outage-only fallback, modified VersaTiles Colorful)

## Map worker and export

MapLibre 6 runs tile work in a web worker. Before web export, the app copies:

- `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs`
- every static relative import used by that worker (currently `maplibre-gl-shared.mjs`)
  → `app/public/`

The copy runs automatically in `preexport:web` (`npm run prepare:maplibre-worker`). These worker assets are gitignored so they always match the installed MapLibre version.

## Basemap fallback

- Default basemap: hosted Liberty copy (`/styles/liberty/style.json`)
- Automatic fallback: hosted VersaTiles copy (`/styles/versatiles-colorful/style.json`)
- Trigger: **3 tile errors within 30 seconds**
- User message on switch: _"The main map service isn't responding. Showing the backup map."_
- Build-time override: `EXPO_PUBLIC_BASEMAP=fallback`

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
```

Local development:

```bash
npm run start --workspace interactive-bible-map-app
npm run web --workspace interactive-bible-map-app
```

## Generated place payloads

`npm run build:data` validates `data/` first, then writes:

- `app/public/generated/places.index.json`
- `app/public/generated/places/<location-id>.json`

These generated payloads are gitignored.
