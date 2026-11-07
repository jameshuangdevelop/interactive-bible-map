# M6-05 - Batch 1A: Acts, the letters and Revelation (15)

| | |
|---|---|
| Agents, in order | `research-lead` (records) → `media-curator` (images) → `fact-checker` (verification) → fixes and re-check; `pr-reviewer` (independent). Each adds its own commits (ADR-0014) |
| Branch | `data/m6-05-acts-letters-places`, from `main` (ADR-0051) |
| PR target | `main` |
| Depends on | #102 merged (`unmappedCandidates`); ADR-0054 (the human approved the first inventory on 2026-11-06) |
| Parallel with | M6-02 (the open map-code PR) and M6-04 (batch 1A, Holy Land). Both are independent |
| Credit target | About 3,000 records, about 1,000 images, about 3,000 verification (session guard: 10,000 each; ADR-0025) |
| Status | In progress |

## Goal
Add the 15 Acts, letters and Revelation places the human approved for M6's first batch, with the same quality as our 122 verified places. Every place, name and passage below was checked against the WEB text; none duplicates an existing record.

## Places
The ids are proposals; follow the schema's id rules.

| id | Place | Key passages (WEB) | PO notes |
|---|---|---|---|
| `cyrene` | Cyrene | Matt 27:32; Mark 15:21; Luke 23:26; Acts 2:10; 6:9; 11:20; 13:1 | The city, under the existing `crete-cyrene` province and `libya` region as conventions require |
| `euphrates` | Euphrates River | Rev 9:14; 16:12 | `natural-feature`, `naturalFeatureKind: water`; a sourced label point |
| `sea-of-adria` | Sea of Adria | Acts 27:27 | `natural-feature`, water. Say what "Adria" covered in the first century only as cited sources state it; a sourced label point |
| `babylon` | Babylon | 1 Pet 5:13; Matt 1:11-17; Acts 7:43; Rev 14:8; 16:19; 17:5; 18:2, 10, 21 | Disputed for 1 Peter 5:13. Map the Mesopotamian city, and the fortress Babylon in Egypt if cited scholarship proposes it. The figurative reading (a name for Rome) goes in `unmappedCandidates`, with a reason saying it is a figurative reading of a place that has its own record. Say neutrally, with a source, that Revelation's Babylon is widely read as symbolic |
| `mount-sinai` | Mount Sinai | Acts 7:30, 38; Gal 4:24-25 | Disputed: list each serious candidate neutrally, including the traditional Jebel Musa. Proposals without an accepted coordinate go in `unmappedCandidates` |
| `armageddon` | Armageddon (Har-Magedon) | Rev 16:16 | Disputed or symbolic. Map the commonly proposed link to Megiddo (Tel Megiddo) with its confidence, and record other serious readings neutrally, unmapped where they have no coordinate. Take no eschatological position |
| `areopagus` | The Areopagus | Acts 17:19, 22 | `parentId: athens` |
| `athens-agora` | The marketplace (Agora) of Athens | Acts 17:17 | `parentId: athens`; cite the identification with the Agora |
| `straight-street` | The street called Straight | Acts 9:11 | `parentId: damascus`; describe the traditional identification neutrally |
| `ephesus-theater` | The theater at Ephesus | Acts 19:29, 31 | `parentId: ephesus` |
| `temple-of-artemis` | The Temple of Artemis | Acts 19:24-35 | `parentId: ephesus` |
| `philippi-place-of-prayer` | The place of prayer by the river, Philippi | Acts 16:13 | `parentId: philippi`. Disputed: list each serious candidate (for example the Gangites or the Krenides stream) neutrally |
| `philippi-forum` | The marketplace (forum) of Philippi | Acts 16:19 | `parentId: philippi` |
| `corinth-bema` | The judgment seat (bema) at Corinth | Acts 18:12, 16-17 | `parentId: corinth`; cite the identification with the excavated bema |
| `herods-palace-caesarea` | Herod's palace at Caesarea | Acts 23:35 | `parentId: caesarea-maritima`; cite the identification with the excavated palace |

If a place can't be sourced to the standard, or has no mappable candidate at all, stop on that place and report it to the PO. Don't guess, and don't drop it silently. A record needs at least one mapped candidate. Where the timeline has no holder for a place (for example Babylon, in Parthian lands), follow what `npm run fill:political-history` and the schema allow, and report it.

## Rules (as for our existing places; models: `pool-of-bethesda.json`, `temple-mount.json`, `derbe.json`, `sea-of-galilee.json`, `sychar.json`, `country-of-the-gadarenes.json`)
- **Schema and house style:** follow `schema/location.schema.json` and `schema/README.md`.
  - English names (ADR-0026) with today's name and `modernCountries`. Jerusalem and its descendants omit `modernCountries`. A city site uses its city as `parentId`.
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
- **Bibliography:** insert new `bib:` entries in **alphabetical order by id**, so the parallel M6-04 PR doesn't conflict. List any new upstream source in `ATTRIBUTION.md`.
- **Images (media-curator):** 1–3 per place, following `.github/agents/media-curator.agent.md` and ADR-0029.
  - Start from Wikidata's P18 and P373, confirm through Commons categories that the image shows this place, and record `LicenseShortName` exactly.
  - Hotlink the files; never commit images.
  - `npm run check:images` must pass. A place with no suitable free image gets none, with a note in the report.
- **Verification:** `docs/verification/M6-05-acts-letters-places.md`, covering coordinates against at least 2 sources, every clause, the WEB text, images and licenses, and neutrality.
- **No app code.** If a browser test fails because of the new data (for example, names that overlap), stop and report to the PO. Map changes belong to a separate map-code PR.
- Don't edit `docs/PROGRESS.md` or `docs/BUDGET.md` (ADR-0051).

## Acceptance criteria
- [ ] All 15 records exist and validate, or each missing place is reported with its reason. The Fact-Checker signs every record off (`status: "verified"`).
- [ ] `npm run validate:data` adds no errors, and new warnings are explained. `npm test`, `npm run build:data`, `npm run test:generated` and `npm run check:images` pass, along with `npx playwright test --grep "@names|@panel|@data"`.
- [ ] The PR reports the `places.index.json` gzip size before and after, and confirms the ancient startup layer didn't grow.
- [ ] The PR uses the template, with sign-off, attribution and a budget row for each session.

## Finish
PR title: `data(places): M6 batch 1A, Acts, letters and Revelation (15)`.
