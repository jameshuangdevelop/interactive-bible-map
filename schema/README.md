# Data schema guide (M2-01)

This folder defines the JSON Schema rules and data-validation behavior for `data/locations/`, `data/media/`, and `data/bibliography.json`.

All example values below are **illustrative only** (not verified historical claims).

## Files and responsibilities
- `location.schema.json`: one location record per `data/locations/<id>.json`
- `media.schema.json`: one media record per `data/media/<location-id>.json`
- `source-id.schema.json`: allowed source-ID prefixes and patterns (including `bib:`)
- `bibliography.schema.json`: structure for `data/bibliography.json`
- `scripts/fill-scripture-text.mjs`: fills `scripture[].textWEB` from the WEB source text
- `scripts/fill-image-sizes.mjs`: fills or corrects Commons `width`/`height` fields from the Commons API
- `scripts/validate-data.mjs`: schema + cross-file + scripture + checksum checks used by CI
- `scripts/check-images.mjs`: online image checks (Commons originals + panel thumbnail widths + recorded size match, and hosted AI files)

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
  - major places must have at least 5 images; this has been an error since every major place reached 5 (M3.5), and setting `REQUIRE_MAJOR_IMAGES=false` turns it back into a warning.

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
- `names.modernCountries` lists the present-day countries or territories a place or area lies in (ADR-0028), in the order a reader should see them: the country holding most of the place first.
- `names.modernCountries` values come from one allow-list in `schema/location.schema.json` (`$defs.modernCountry`). If a record needs a value that isn't on the list, the Research Lead adds it in the same commit as that record, and the Fact-Checker reviews the addition.
- Exempt records must omit `names.modernCountries`: records of type `empire`, the record `jerusalem`, and any record whose `parentId` chain includes `jerusalem`.
- Every other record must have at least one `names.modernCountries` value.
- Places outside any one country's undisputed territory use the territory name most English news and reference works use, such as `West Bank` or `Golan Heights`. The name describes where the place is, not who should rule it.
- Places with several candidates list the countries of all their candidates (for example Cana: `Israel`, `Lebanon`).
- Area records (`type: "province"` or `type: "region"`) must have `names.modern`: a short orienting phrase such as `Central Türkiye` or `Parts of Greece, North Macedonia and Albania`, or a plain geographic name that already orients the reader (`Crete`, `Galilee`). An area spanning many countries lists the main ones (at most 6) in `names.modernCountries`. Natural features are not areas.
- For every other record, `names.modern` is the modern place name only, with no country, state, political descriptor or editorial note; the app adds the countries itself. A name that is also a country's name (`Malta`, `Cyprus`) is fine.
- When an ancient site has no modern settlement of its own, `Near <town>` is allowed (for example `Near Denizli`).
- A disputed place is a record with at least one candidate whose confidence is `disputed`. Disputed places omit `names.modern` (candidate labels already carry the modern site names), and this takes precedence over the area rule above.
- For other places with several candidates, give `names.modern` only when one neutral name covers every candidate; otherwise leave it out.
- Candidate `label` fields stay the modern site name only, with no country, state or political descriptor.
- The validator checks the machine-checkable parts: `names.modern` never contains the word `disputed`; disputed places omit `names.modern`; non-exempt records have `names.modernCountries` and exempt records don't; area records have `names.modern`. Now that all 89 records carry these fields, the last three are errors by default (`REQUIRE_MODERN_COUNTRIES` in `scripts/lib/validator.mjs`); pass `validateData({ requireModernCountries: false })` to relax them back to warnings.
- The Research Lead and Fact-Checker review what the validator can't, such as a country inside an ordinary place's `names.modern`.

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
- Commons images must record the original file dimensions as `width` and `height` (integers, in pixels). Run `npm run fill:image-sizes` to fill or refresh them from the Commons API.
- `images[].id` is this project's stable image name. Commons images use `<location-id>-NN` in display order, where `-01` is the lead image shown first in the details panel.
- `images[].kind` is required and must be one of `modern`, `historical`, `site`, `reconstruction`, or `ai-reconstruction`.
- `historical` is for period photographs/engravings/paintings that document how a place looked when the image was created (not a present-day view and not an antiquity reconstruction).
- AI reconstructions use IDs in the `<location-id>-ai-NN` pattern and hosted URLs in `media/ai/<location-id>-ai-NN.webp`. They require `generator`, `promptRef`, and `basedOn`.
- AI image `width` and `height` are optional placeholders for now; when present, the validator checks they match the hosted WebP file dimensions.
- AI branch note (M3.5-01): `author`, `license`, `licenseUrl`, and `sourcePage` are optional placeholders for now and become required in M3.5-07 after the licensing ADR.
- `content/image-prompts/<location-id>.md` files are validated: file names must match location IDs, and each cited source ID in square brackets must resolve like location data sources.
- Hosted AI files are validated as WebP, at most 1,600 px wide and at most 400 KB.
- Validator warnings: lead images (`-01`) wider than 2.2:1 are flagged as panoramas, and Commons images narrower than 1,200 px are flagged as likely too small for crisp panel crops.

### AI reconstruction generation/publish scripts (M3.5-07)

Generate candidate images from a prompt brief heading:

```bash
npm run generate:ai -- <prompt-id> [--provider cloudflare-flux|cloudflare-lucid|openai|gemini] [--model <id>] [--variants N] [--round N] [--seed S] [--tier flex|standard] [--edit-from <candidate-file> --instruction "<text>"]
```

- Prompt text is read from `content/image-prompts/<location-id>.md` under `### AI-generated reconstruction — prompt <prompt-id>`, and stops before `Keep out / keep vague:`.
- For Gemini (`--provider gemini`), the default tier is **Flex** (`service_tier: "flex"`); use `--tier standard` to opt out. Flex retries `429`/`503` with backoff because capacity can be temporarily busy.
- Edit mode is Gemini-only: `--edit-from` sends the parent candidate image plus `--instruction` text and saves the result to the next round (`-r<N+1>-v1`).
- Required environment variables:
  - Cloudflare: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_AI_TOKEN`
  - OpenAI: `OPENAI_API_KEY`
  - Gemini: `GEMINI_API_KEY`
- Candidates are written to `media/ai-incoming/<prompt-id>-r<round>-v<k>.<ext>` plus a side-car JSON containing provider/model/date/seed/round/prompt data and prompt SHA-256. Gemini side-cars also record the actual service tier from `x-gemini-service-tier`, `usageMetadata`, estimated USD cost, and (for edits) parent candidate + instruction hash.
- `media/ai-incoming/` is Git-ignored; candidate files are working artifacts and are not committed.

Publish one candidate to a hosted AI image:

```bash
npm run publish:ai -- <candidate-file> [--id <prompt-id>] [--no-trim]
```

- Converts the candidate to `media/ai/<prompt-id>.webp` using WebP quality steps until it is at most 1,600 px wide and 400 KB.
- Before resizing, detects and removes edge-only near-black letterbox/pillarbox bars (full-row/full-column runs from the edges) so accidental cinematic bars do not require regeneration.
- Use `--no-trim` to skip bar trimming for one publish.
- Fails if the file cannot fit under 400 KB at quality 60 or above.
- Prints final width/height/bytes, trim pixels per side, and generator metadata derived from the candidate side-car for use in the media entry.

Summarize estimated Gemini spend from incoming side-cars:

```bash
npm run ai-costs
```

- Prints a per-place and total USD estimate from `media/ai-incoming/*.json` side-cars.

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
npm run fill:image-sizes
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
