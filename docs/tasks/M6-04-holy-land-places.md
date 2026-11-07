# M6-04 - Batch 1A: Holy Land places (23)

| | |
|---|---|
| Agents, in order | `research-lead` (records) → `media-curator` (images) → `fact-checker` (verification) → fixes and re-check; `pr-reviewer` (independent). Each adds its own commits (ADR-0014) |
| Branch | `data/m6-04-holy-land-places`, from `main` (ADR-0051) |
| PR target | `main` |
| Depends on | #102 merged (`unmappedCandidates`); ADR-0054 (the human approved the first inventory on 2026-11-06) |
| Parallel with | M6-02 (the open map-code PR) and M6-05 (batch 1A, Acts, letters and Revelation). Both are independent |
| Credit target | About 4,000 records, about 1,500 images, about 4,000 verification (session guard: 10,000 each; ADR-0025) |
| Status | In progress |

## Goal
Add the 23 Holy Land places the human approved for M6's first batch, with the same quality as our 122 verified places. Every place, name and passage below was checked against the WEB text; none duplicates an existing record.

## Places
The ids are proposals; follow the schema's id rules.

| id | Place | Key passages (WEB) | PO notes |
|---|---|---|---|
| `jordan-river` | Jordan River | Matt 3:6; Mark 1:5, 9; John 1:28 and every other NT mention (15 verses) | `natural-feature`, `naturalFeatureKind: water`; a sourced label point |
| `tiberias` | Tiberias | John 6:23 | The city. "Sea of Tiberias" verses (John 6:1; 21:1) stay with `sea-of-galilee` |
| `gennesaret` | Land of Gennesaret | Matt 14:34; Mark 6:53 | The plain. Luke 5:1's "lake of Gennesaret" stays with `sea-of-galilee` |
| `aenon` | Enon near Salim | John 3:23 | WEB spells it "Enon"; give "Aenon" as an alternate. Salim's identification goes in the support. Usually disputed |
| `arimathea` | Arimathea | Matt 27:57; Mark 15:43; Luke 23:51; John 19:38 | Usually disputed; list each serious candidate |
| `gaza` | Gaza | Acts 8:26 | — |
| `azotus` | Azotus | Acts 8:40 | — |
| `lydda` | Lydda | Acts 9:32–38 | — |
| `plain-of-sharon` | Plain of Sharon | Acts 9:35 | `natural-feature`; a sourced label point |
| `antipatris` | Antipatris | Acts 23:31 | — |
| `zarephath` | Zarephath (Sarepta) | Luke 4:26 | OT connection: 1 Kings 17 |
| `wilderness-of-judea` | Wilderness of Judea | Matt 3:1 | `natural-feature`; a sourced label point |
| `samaria-city` | City of Samaria (Sebaste) | Acts 8:5 | The city, not the `samaria` region. Mention a manuscript difference ("the city" or "a city") only if a cited source states it |
| `jacobs-well` | Jacob's Well | John 4:6 | Near Sychar. Describe the traditional site and the archaeology neutrally |
| `mount-gerizim` | Mount Gerizim | John 4:20–21 | The passage says "this mountain" and doesn't name it. Say so, and cite the identification. Describe Samaritan worship neutrally. OT connections: Deut 11:29; 27:12 |
| `kidron-valley` | Kidron Valley | John 18:1 | `parentId: jerusalem` (a BACKLOG item) |
| `akeldama` | Akeldama (Field of Blood) | Matt 27:7–10; Acts 1:19 | `parentId: jerusalem`; the traditional site, neutrally |
| `praetorium` | The Praetorium and Gabbatha (the Pavement) | Mark 15:16; John 18:28, 33; 19:9, 13 | `parentId: jerusalem`. Disputed: list Herod's palace and the Antonia Fortress neutrally, each with support and sources |
| `antonia-fortress` | The barracks (Antonia Fortress) | Acts 21:34, 37; 22:24; 23:10, 16, 32 | `parentId: jerusalem`. WEB says "barracks"; cite the identification with the Antonia. It may share a site with `praetorium`'s Antonia candidate: keep both coordinates sourced and identical, and report to the PO if the validator objects |
| `solomons-porch` | Solomon's Porch | John 10:23; Acts 3:11; 5:12 | `parentId: jerusalem`. If no accepted coordinate exists, don't place it |
| `beautiful-gate` | The Beautiful Gate | Acts 3:2, 10 | `parentId: jerusalem`. Disputed: a proposal without an accepted coordinate (for example the Nicanor Gate) goes in `unmappedCandidates` (M6-01) |
| `sheep-gate` | The Sheep Gate | John 5:2 | `parentId: jerusalem`; near `pool-of-bethesda` |
| `valley-of-hinnom` | Valley of Hinnom (Gehenna) | The WEB passages that say "Gehenna" (12 verses, e.g. Matt 5:22; Mark 9:43) | `parentId: jerusalem`. Describe the valley, and say that the New Testament word "Gehenna" comes from its name (cite it). Say neutrally that these passages use the word for final judgment; take no theological position |

If a place can't be sourced to the standard, or has no mappable candidate at all, stop on that place and report it to the PO. Don't guess, and don't drop it silently. A record needs at least one mapped candidate.

## Rules (as for our existing places; models: `pool-of-bethesda.json`, `derbe.json`, `lystra.json`, `sea-of-galilee.json`, `sychar.json`)
- **Schema and house style:** follow `schema/location.schema.json` and `schema/README.md`.
  - English names (ADR-0026) with today's name and `modernCountries`. Jerusalem and its descendants omit `modernCountries`.
  - Set `type` and `zoomTier`, with `prominence: "standard"` (no AI reconstructions in this batch).
  - Set `parentId` and `politicalAreaId`, and `naturalFeatureKind` where required.
  - `status: "draft"` until the Fact-Checker signs off.
- **Coordinates:**
  - Take them from accepted dataset sources, following "One consistent coordinateSource rule", and check them against at least 2 sources.
  - Follow the OSM rule in `docs/LICENSES.md`.
  - Never guess. A disputed site lists every serious candidate, with support and sources, in neutral wording.
  - A serious proposal without an accepted coordinate goes in `unmappedCandidates`.
- **Text:**
  - Every factual clause is stated by a cited source you have opened (ADR-0017), and Wikipedia is never the only source.
  - Write the summary in the style of ADR-0033: introduce people and works, and don't name databases in the text. Caveats come last (ADR-0041 item 1).
  - Include `history`.
  - Describe church tradition and archaeology neutrally, and take no side.
- **Scripture:** every New Testament WEB passage that names the place (use `npm run fill:scripture`), with OT connections where they exist. WEB only.
- **Political history:** `npm run fill:political-history` over the timeline's years.
- **Bibliography:** insert new `bib:` entries in **alphabetical order by id**, so the parallel M6-05 PR doesn't conflict. List any new upstream source in `ATTRIBUTION.md`.
- **Images (media-curator):** 1–3 per place, following `.github/agents/media-curator.agent.md` and ADR-0029.
  - Start from Wikidata's P18 and P373, confirm through Commons categories that the image shows this place, and record `LicenseShortName` exactly.
  - Hotlink the files; never commit images.
  - `npm run check:images` must pass. A place with no suitable free image gets none, with a note in the report.
- **Verification:** `docs/verification/M6-04-holy-land-places.md`, covering coordinates against at least 2 sources, every clause, the WEB text, images and licenses, and neutrality.
- **No app code.** If a browser test fails because of the new data (for example, names that overlap), stop and report to the PO. Map changes belong to a separate map-code PR.
- Don't edit `docs/PROGRESS.md` or `docs/BUDGET.md` (ADR-0051).

## Acceptance criteria
- [ ] All 23 records exist and validate, or each missing place is reported with its reason. The Fact-Checker signs every record off (`status: "verified"`).
- [ ] `npm run validate:data` adds no errors, and new warnings are explained. `npm test`, `npm run build:data`, `npm run test:generated` and `npm run check:images` pass, along with `npx playwright test --grep "@names|@panel|@data"`.
- [ ] The PR reports the `places.index.json` gzip size before and after, and confirms the ancient startup layer didn't grow.
- [ ] The PR uses the template, with sign-off, attribution and a budget row for each session.

## Finish
PR title: `data(places): M6 batch 1A, Holy Land places (23)`.
