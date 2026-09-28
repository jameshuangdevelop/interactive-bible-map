# Interactive Bible Map app

This app is an Expo + React Native Web shell for the Interactive Bible Map project.

- **Expo SDK:** 57 (latest stable as of 2026-09-28; SDK 58 is still in beta)
- **Runtime target:** Web-first, with native-ready React Native components
- **Routing/state:** Single-page shell with plain Expo entry; web URL state (`?place=...&candidate=...`) will be added in M3-04 using the History API and `URLSearchParams`.

## Commands

Run these from the repository root:

```bash
npm run lint
npm run typecheck
npm run test:app
npm run build:data
npm run export:web
```

To run the app locally:

```bash
npm run start --workspace interactive-bible-map-app
npm run web --workspace interactive-bible-map-app
```

## Generated data

`npm run build:data` validates `data/` first, then writes generated app data to:

- `app/public/generated/places.index.json`
- `app/public/generated/places/<location-id>.json`

These files are generated artifacts and are gitignored.
