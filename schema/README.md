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
- `scripts/check-images.mjs`: online image checks (Commons originals + panel thumbnail widths, and hosted AI files)

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

### Prominence
- `prominence: "major"` marks one of the ADR-0029 major places, which target 5 to 10 images.
- `prominence: "standard"` marks every other place, which target 1 to 3 images.
- The validator enforces the machine-checkable limits:
  - standard places must have at most 3 images;
  - major places with fewer than 5 images raise a warning by default;
  - setting `REQUIRE_MAJOR_IMAGES=true` turns that warning into an error.

### Ancient area hierarchy (AD 50 convention until M4 timeline)
- `type: "empire"` is an empire-level area record (for M3, the Roman Empire).
- `type: "province"` is a province-level area record: a Roman province, a client kingdom in the same hierarchy, or an equivalent top-level division that wasn't formally a province (Italy, which was governed directly from Rome).
- `type: "region"` remains for sub-province district/region records such as Galilee.
- `empire`, `province`, and `region` records must all use `zoomTier: "region"`.
- Parent chains are recorded with `parentId`: a place points to the smallest containing area, that area points to its province, and the province points to the empire.
- Enforced invariants:
  - an `empire` record has no `parentId`;
  - a `province` record must have `parentId`, and that parent must be an `empire` record;
  - parent chains must not contain cycles;
  - `empire`, `province`, and `region` records must use `zoomTier: "region"`;
  - with `REQUIRE_EMPIRE_ROOT` enabled (default `true`), every parent chain must end at an `empire` record.
- In M3, parent assignments use the **about AD 50** convention for all records; M4 adds timeline-aware changes.
- The panel uses this chain to show context in the format `Type · Province · Empire` (for example, `City · Achaia · Roman Empire`).
- Validator switch: `scripts/lib/validator.mjs` exports `REQUIRE_EMPIRE_ROOT` (default `true`, enabled once every place's parentId chain reaches the Roman Empire) and accepts `validateData({ requireEmpireRoot: false })` to relax this for callers that intentionally work with partial data (for example, tests that predate this hierarchy).

### Confidence meanings
- `high`: broad scholarly agreement.
- `medium`: good support with some uncertainty.
- `low`: limited support or major uncertainty.
- `disputed`: multiple competing proposals in current scholarship.

If any candidate has confidence `disputed`, the record must include at least **two** candidates.

### Names
- `names.ancient[0]` is the record title and should use the spelling most of these English Bible translations agree on: NIV, ESV, NLT, KJV, NKJV, and CSB.
- `names.ancient` and `names.alternate` are display names and should be English-only in this phase: names used in English Bible translations (for example KJV `Melita` or NIV `Berea`) or in standard English reference works.
- Other English Bible spellings, including the WEB's spelling, should also stay in `names.ancient` or `names.alternate` so search can still find them.
- `names.otherLanguages` is optional and stores names in other languages and non-English ancient-language forms.
- The app ignores `names.otherLanguages`: it does not display them and does not search them.
- `names.otherLanguages` values must be unique, non-empty, and trimmed (no leading or trailing whitespace).
- When `names.otherLanguages` is present, the validator raises an error if any name appears more than once across `names.ancient`, `names.alternate`, and `names.otherLanguages`, compared case-insensitively after Unicode normalization. `names.modern` is intentionally excluded from this check: many places (Rome, Jerusalem, Capernaum's "Kfar Nahum") are still known today by the same name they carried in antiquity or in another language, so `names.modern` legitimately repeating one of those names is expected, not a data error.
- Scripture-linkage name matching still uses all configured names (`ancient`, `alternate`, `modern`, and `otherLanguages`).

### Modern names
- `names.modern` is optional and, when present, must be the modern place name only.
- Do not include country, state, province, political descriptors, or editorial notes in `names.modern`.
- A disputed place is a record with at least one candidate whose confidence is `disputed`.
- For disputed places, leave out `names.modern`; candidate labels already carry the modern site names.
- For other places with several candidates, give `names.modern` only when one neutral name covers every candidate; otherwise leave it out.
- Region and island records should use a neutral geographic name when one exists; otherwise leave `names.modern` out. This takes precedence over the several-candidates rule above (for example, Malta keeps `Malta` although a low-confidence candidate is Mljet). Leave it out where every modern name in use carries a political meaning (Judea, Samaria) or no modern region matches (Galatia).
- When an ancient site has no modern settlement of its own, `Near <town>` is allowed (for example `Near Denizli`).
- Candidate `label` fields follow the same neutrality rule: no country, state or political descriptor.
- The validator enforces the machine-checkable parts: `names.modern` must not contain the word `disputed`, and disputed places must omit `names.modern`.
- Country/descriptor neutrality is reviewed by the Research Lead and Fact-Checker.

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
- Commons `url` values must be plain original-file URLs in the exact form `https://upload.wikimedia.org/wikipedia/commons/<a>/<ab>/<file>` (no query string), and `<a>/<ab>` must match the MD5 hash folders for `<file>`.
- For Commons images, `url` and `sourcePage` must point to the same file name.
- `images[].id` is this project's stable image name. Commons images use `<location-id>-NN` in display order, where `-01` is the lead image shown first in the details panel.
- `images[].kind` is required and must be one of `modern`, `site`, `reconstruction`, or `ai-reconstruction`.
- AI reconstructions use IDs in the `<location-id>-ai-NN` pattern and hosted URLs in `media/ai/<location-id>-ai-NN.webp`. They require `generator`, `promptRef`, and `basedOn`.
- AI branch note (M3.5-01): `author`, `license`, `licenseUrl`, and `sourcePage` are optional placeholders for now and become required in M3.5-07 after the licensing ADR.
- `content/image-prompts/<location-id>.md` files are validated: file names must match location IDs, and each cited source ID in square brackets must resolve like location data sources.
- Hosted AI files are validated as WebP, at most 1,600 px wide and at most 400 KB.

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
npm run check:images
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
    "ancient": ["Capernaum"],
    "modern": "Tell Hum",
    "alternate": [],
    "otherLanguages": ["Kfar Nahum"]
  },
  "type": "city",
  "zoomTier": "city",
  "prominence": "major",
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
