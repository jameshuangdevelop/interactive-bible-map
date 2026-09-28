# M3-10 — English-only names

| | |
|---|---|
| Agents, in order | `gis-engineer` (schema) → `research-lead` (data) → `fact-checker` (verification), each adding its own commit (ADR-0014) |
| Models | GPT-5.3-Codex → Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m3-english-names` |
| Depends on | M3-08 (merged, #20) |
| Parallel with | M3-03 (map view) |
| Credit target | ~300 schema, ~600 data, ~600 verification (session guard: 10,000 each; ADR-0025) |

## Goal
Make every name the app shows English, for English-speaking readers (ADR-0026). Names in other languages stay in the data only so that search can still find them.

Today, `names.ancient` and `names.alternate` mix English Bible names ("Olivet", "Calvary") with Hebrew, Greek, Latin, Arabic and Turkish forms ("Kfar Nahum", "Hierosolyma", "Al-Quds", "Korinthos"). The place panel shows these as "Also known as …". Malta's title is "Melita", the Latin form in older English Bibles, but the WEB says "Malta".

## The rule (ADR-0026)
- **The title** (`names.ancient[0]`) is the place's name **as the WEB spells it**, where the WEB names the place in one of the record's `scripture` entries. For example "Malta", not "Melita", and "Beroea", not "Berea". Where the WEB doesn't name it, use the standard English name that the record's sources use.
- **`names.ancient` and `names.alternate` hold English names only:** names used in English Bibles or standard English reference works, such as "Calvary", "Olivet", "Sea of Tiberias", "Lake of Gennesaret", "Place of a Skull", "Strato's Tower", "Bethlehem Ephrathah", "Cana of Galilee", "Alexandria Troas" and "Berea". A spelling that English Bibles commonly use counts as English even if it came from another language.
- **`names.searchOnly`** (new) holds names in other languages, and ancient-language forms that English doesn't use: Hebrew, Aramaic, Greek, Latin, Arabic and Turkish forms and transliterations, such as "Kfar Nahum", "Yerushalayim", "Al-Quds", "Hierosolyma", "Korinthos", "Athenae" and "Julias". The app never displays them, but search matches them.
- **Unchanged:** `names.modern` and candidate `label` fields. The modern name is the name of a real place today, and the panel shows it as "Today: …". Candidate labels name real sites, such as "Khirbet Qana", which have no English name.
- The wording stays sourced: every name in `ancient`, `alternate` and `searchOnly` must be supported by the record's own sources (ADR-0017). A title change must be supported by a WEB passage in the record.

## Scope
1. **GIS Engineer:**
   - Add an optional `names.searchOnly` (array of unique, non-empty strings) to `schema/location.schema.json`.
   - Add a validator error when a name appears twice across `ancient`, `alternate`, `modern` and `searchOnly` (case-insensitive).
   - Add a validator **warning** when `names.ancient[0]` appears in none of the record's WEB texts, but another name in the record does. This flags titles that may not match the WEB.
   - Include `searchOnly` in `places.index.json` (M3-02's data build) so search can use it, and report the new minified size (about 18 KB today).
   - Include `searchOnly` in the scripture-linkage check's list of names.
   - Document the rule in `schema/README.md` and add tests.
   - Commit: `feat(schema): add search-only names`.
2. **Research Lead:** apply the rule to all 63 records. Change only `names.ancient` (its order and entries), `names.alternate` and `names.searchOnly`. List every title change and every borderline call (for example "Judaea" or "Pergamon") in the commit body with its reason. Keep changed records at `status: "draft"`. Commit: `data(locations): make displayed names English`.
3. **Fact-Checker:** check each title against the record's WEB text, and each moved name against the rule and the sources. Use a semantic diff to confirm nothing else changed. Re-set `verified` on the records that pass. Write `docs/verification/M3-english-names.md`. Commit: `docs(verification): verify English-only names`.

## Out of scope
`names.modern`, candidate labels, every other field, and app code. M3-04 and M3-05 use the new field.

## Acceptance criteria
- [ ] Every title matches the WEB's spelling where the WEB names the place.
- [ ] `names.ancient` and `names.alternate` hold English names only; the other names are in `names.searchOnly`.
- [ ] The validator enforces the machine-checkable parts, and has tests for them.
- [ ] All 63 records are `verified` again. CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: English-only names`.
