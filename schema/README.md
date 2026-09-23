# Data schema guide (M2-01)

This folder defines the JSON Schema rules and data-validation behavior for `data/locations/` and `data/media/`.

All example values below are **illustrative only** (not verified historical claims).

## Files and responsibilities
- `location.schema.json`: one location record per `data/locations/<id>.json`
- `media.schema.json`: one media record per `data/media/<location-id>.json`
- `source-id.schema.json`: allowed source-ID prefixes and patterns
- `scripts/fill-scripture-text.mjs`: fills `scripture[].textWEB` from the WEB source text
- `scripts/validate-data.mjs`: schema + cross-file + scripture checks used by CI

## Core conventions

### Coordinates and WGS 84
- Coordinates are decimal degrees in **WGS 84** and use GeoJSON order **`[lon, lat]`**.
- `location.schema.json` enforces global coordinate ranges (`lon` between `-180` and `180`, `lat` between `-90` and `90`).
- The validator additionally enforces a project bounding box for the Mediterranean/Near East:
  - longitude `-20` to `60`
  - latitude `-5` to `50`

### Years
- Years are integers.
- BC years are negative.
- **Year 0 is not allowed.**

### Zoom tiers
- `mediterranean`: broad world context.
- `region`: province/region-level context.
- `city`: city-level context.
- `site`: local site/feature context.

### Confidence meanings
- `high`: broad scholarly agreement.
- `medium`: good support with some uncertainty.
- `low`: limited support or major uncertainty.
- `disputed`: multiple competing proposals in current scholarship.

If any candidate has confidence `disputed`, the record must include at least **two** candidates.

### Status workflow
- `status: "draft"`: in-progress research; `verifiedBy` and `lastReviewed` are optional.
- `status: "verified"`: reviewed and accepted; `verifiedBy` and `lastReviewed` are required.

### Source-ID prefixes

The schema accepts these prefixes (from `docs/research/SOURCES.md`):

| Prefix | Pattern example |
|---|---|
| `openbible:` | `openbible:capernaum` |
| `pleiades:` | `pleiades:678231` |
| `dare:` | `dare:21094` |
| `wikidata:` | `wikidata:Q1218` |
| `osm:` | `osm:way/123456789` |
| `naturalearth:` | `naturalearth:1159152091` |
| `commons:` | `commons:File:Example.jpg` |
| `orbis:` | `orbis:1234` |
| `awmc:` | `awmc:feature-1` |
| `wikipedia:` | `wikipedia:Capernaum` |
| `perseus:` | `perseus:urn:cts:greekLit:tlg0526` |

### One consistent OSM coordinate rule
- Coordinates in `data/locations/` must come from a non-OSM source.
- Each candidate stores `coordinateSource` so this is auditable.
- The validator rejects any `coordinateSource` beginning with `osm:`.

## Scripture text workflow (WEB only)
- Edition: **WEB `engwebp`** (ADR-0013).
- Source URL: `https://eBible.org/Scriptures/engwebp_vpl.zip`
- Read date for this snapshot: **2026-09-23**
- Committed snapshot file: `data/reference/engwebp_vpl.txt` (parsed locally, no network needed for validation/tests).

Fill scripture text for all location files:

```bash
npm run fill:scripture -- --all
```

Fill a single file:

```bash
npm run fill:scripture -- --file data/locations/<id>.json
```

The script auto-builds `scripture[].textWEB` from `scripture[].ref`. Verse ranges (for example `Mark 1:21-22`) are joined in verse order with a single space.

## Validation commands

```bash
npm run validate:data
npm test
```

CI runs:
1. `npm ci`
2. `npm test`
3. `npm run validate:data`

## Dependencies (kept minimal)
- `ajv`: JSON Schema draft 2020-12 validation.
- `ajv-formats`: standard format checks (for example, ISO date for `lastReviewed`).

## Complete example record (illustrative only)

```json
{
  "id": "capernaum",
  "names": {
    "ancient": ["Capernaum", "Kfar Nahum"],
    "modern": "Kfar Nahum / Tell Hum",
    "alternate": []
  },
  "type": "city",
  "zoomTier": "city",
  "parentId": "galilee",
  "candidates": [
    {
      "label": "Tell Hum",
      "coordinates": [35.575, 32.88],
      "coordinateSource": "pleiades:678180",
      "confidence": "high",
      "support": "Illustrative neutral summary only.",
      "sources": ["pleiades:678180", "openbible:capernaum"]
    }
  ],
  "summary": {
    "text": "Illustrative neutral summary only.",
    "sources": ["wikipedia:Capernaum"]
  },
  "history": [
    {
      "text": "Illustrative historical note only.",
      "sources": ["wikipedia:Capernaum"]
    }
  ],
  "scripture": [
    {
      "ref": "Mark 1:21",
      "book": "Mark",
      "textWEB": "They went into Capernaum, and immediately on the Sabbath day he entered into the synagogue and taught."
    }
  ],
  "otConnections": [
    {
      "ref": "Isaiah 9:1",
      "note": "Illustrative Old Testament linkage only.",
      "sources": ["wikipedia:Capernaum"]
    }
  ],
  "politicalHistory": [
    {
      "fromYear": -4,
      "toYear": 39,
      "entity": "Tetrarchy of Herod Antipas (illustrative label).",
      "sources": ["wikipedia:Capernaum"]
    }
  ],
  "status": "verified",
  "verifiedBy": "fact-checker",
  "lastReviewed": "2026-09-23"
}
```
