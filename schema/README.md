# Data schema guide (M2-01)

This folder defines the JSON Schema rules and data-validation behavior for `data/locations/`, `data/media/`, and `data/bibliography.json`.

All example values below are **illustrative only** (not verified historical claims).

## Files and responsibilities
- `location.schema.json`: one location record per `data/locations/<id>.json`
- `media.schema.json`: one media record per `data/media/<location-id>.json`
- `source-id.schema.json`: allowed source-ID prefixes and patterns (including `bib:`)
- `bibliography.schema.json`: structure for `data/bibliography.json`
- `scripts/fill-scripture-text.mjs`: fills `scripture[].textWEB` from the WEB source text
- `scripts/validate-data.mjs`: schema + cross-file + scripture + checksum checks used by CI

## Core conventions

### Coordinates and WGS 84
- **WGS 84** is the standard global latitude/longitude coordinate system used by GPS and most web maps.
- Coordinates are decimal degrees in GeoJSON order **`[lon, lat]`**.
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

The schema accepts these prefixes (from `docs/research/SOURCES.md` plus `bib:` for this task):

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
| `wikipedia:` | `wikipedia:Capernaum` (pointer only, never sole support) |
| `perseus:` | `perseus:urn:cts:greekLit:tlg0526` |
| `scripture:` | `scripture:Mark 11:15-17` |
| `bib:` | `bib:pleiades-place-resource` |

### Bibliography registry
- `data/bibliography.json` holds reusable entries keyed by `id`.
- Use `bib:<id>` in any `sources[]` array when citing a book, chapter, article, web authority page, or dataset entry.
- The validator rejects any `bib:` ID that is missing from `data/bibliography.json`.

### One consistent coordinateSource rule (OSM, Wikipedia, and scripture)
- Coordinates in `data/locations/` must come from a non-OSM source.
- Coordinates must not cite `wikipedia:` as `coordinateSource`.
- Coordinates must not cite `scripture:` as `coordinateSource`.
- Each candidate stores `coordinateSource`, and that value must also appear in `candidates[].sources`.

### Sources quality floor
- A `sources[]` array cannot consist only of `wikipedia:` IDs.
- Use at least one non-Wikipedia source ID (dataset ID or `bib:`).
- Cite the passage with `scripture:` when a text clause reports what a Bible passage says; a scripture source supports only what the passage itself says.

### Scripture reference format
- `scripture[].ref` and `otConnections[].ref` use `Book Chapter:Verse` or `Book Chapter:Start-End`.
- A single `ref` covers one chapter only; cross-chapter passages must be split into one entry per chapter.
- `scripture:` source IDs use the same one-chapter reference format.

### Accepted media license strings
`media.schema.json` accepts these `images[].license` values:
- `Public domain`
- `CC0` or `CC0 1.0`
- `CC BY <version>` (for example `CC BY 4.0`)
- `CC BY-SA <version>` (for example `CC BY-SA 4.0`)
- `CC BY <version> <port>` and `CC BY-SA <version> <port>` where `<port>` is a two-letter lowercase jurisdiction code and `<version>` is 1.x, 2.x, or 3.x (for example `CC BY-SA 2.0 de` or `CC BY 3.0 nl`)
- `CC BY 3.0 IGO` and `CC BY-SA 3.0 IGO`

Jurisdiction ports and `IGO` are mutually exclusive. When either variant exists upstream, copy the license string exactly as shown on the Commons file page.

### Image IDs and storage
- Location images are hotlinked from Wikimedia Commons and keep their Commons file names. Keep `url` and `sourcePage` pointing to Commons, and do not download, rename, or commit those image files into this repository.
- `images[].id` is this project's stable image name. It uses `<location-id>-NN` in display order, where `-01` is the lead image shown first in the details panel.
- The pattern `<location-id>-ai-NN` is reserved for future AI reconstructions. Those are the only images this project will host itself, saved as `<id>.<ext>`, and prompts in `content/image-prompts/<location-id>.md` will use the same IDs. The current media schema does not accept AI IDs yet.

## Scripture text workflow (WEB only)
- Edition: **WEB `engwebp`** (ADR-0013).
- Source URL: `https://eBible.org/Scriptures/engwebp_vpl.zip`
- Read date for this snapshot: **2026-09-23**
- Committed snapshot file: `data/reference/engwebp_vpl.txt`
- Snapshot metadata + checksum: `data/reference/engwebp_snapshot_metadata.json`

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
- `ajv-formats`: standard format checks (for example, ISO date for `lastReviewed` and `accessed`).

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
      "coordinateSource": "pleiades:678231",
      "confidence": "high",
      "support": "Illustrative neutral summary only.",
      "sources": ["pleiades:678231", "openbible:capernaum"]
    }
  ],
  "summary": {
    "text": "Illustrative neutral summary only.",
    "sources": ["bib:pleiades-place-resource", "openbible:capernaum"]
  },
  "history": [
    {
      "text": "Illustrative historical note only.",
      "sources": ["bib:pleiades-place-resource"]
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
      "sources": ["openbible:capernaum"]
    }
  ],
  "politicalHistory": [
    {
      "fromYear": -4,
      "toYear": 39,
      "entity": "Tetrarchy of Herod Antipas (illustrative label).",
      "sources": ["bib:pleiades-place-resource"]
    }
  ],
  "status": "verified",
  "verifiedBy": "fact-checker",
  "lastReviewed": "2026-09-23"
}
```
