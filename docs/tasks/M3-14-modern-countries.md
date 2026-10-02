# M3-14 — Countries in modern names

| | |
|---|---|
| Agents, in order | `gis-engineer` (schema) → `research-lead` (data) → `fact-checker` (verification), each adding its own commit (ADR-0014) |
| Models | GPT-5.3-Codex → Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m3-modern-countries` (from `main` after CP3.5) |
| Depends on | CP3.5 approved, including CP3.5 decision 1 (the defaults for disputed territory) |
| Parallel with | M3-06 (preview deploy) and M3-16 (longer "About"). M3-15 (panel header) starts from this branch's schema commit. |
| Credit target | ~500 schema, ~2,500 data, ~3,500 verification (session guard: 10,000 each; ADR-0025) |

## Goal
Tell every reader which country a place is in today. "Today: Selçuk" means little to most Bible readers, and "Today: Selçuk, Türkiye" places it at once (ADR-0028, which replaces CP3a decision 3 and M3-08's no-country rule).

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0028 (the rule and its special cases), ADR-0017 (sources), ADR-0026 (English names)
- `CHECKPOINTS.md` → CP3.5 → decision 1, as approved
- `schema/location.schema.json`, `schema/README.md` → "Modern names", `scripts/lib/validator.mjs` and its tests
- `docs/tasks/M3-08-modern-names.md` (the rule this task replaces) and `docs/verification/M3-modern-names.md`
- `data/locations/*.json` (89 records)
- This card

## The rule
- **`names.modernCountries`** is a new array of English short country names, in the order a reader should see them (the country holding most of the place first). Its values come from one allow-list in the schema. Start with the countries our 89 records need, for example "Türkiye", "Greece", "Italy", "Israel", "Jordan", "Lebanon", "Syria", "Egypt", "Cyprus", "Malta", "Iraq", "Iran", "Albania", "North Macedonia" and "Libya", plus the territory names **"West Bank"** and **"Golan Heights"**. The Research Lead may ask for more; the GIS Engineer adds them only when a record needs one.
- **Who gets it:** every record, except:
  - **Jerusalem and the places inside it** (records whose parent chain includes `jerusalem`: the Temple Mount, Golgotha, Gethsemane, the Mount of Olives, the Pool of Bethesda and the Pool of Siloam). Their modern name already says where they are, and Jerusalem's status is the most disputed of all;
  - **empires** (`type: "empire"`).
- **Disputed territory** (CP3.5 decision 1): places outside any one country's undisputed territory use the name most English news and reference works use. Examples include "West Bank" for Bethlehem, Jericho, Bethany (Al-Eizariya), Sychar (Tell Balata) and Qasr al-Yahud, and "Golan Heights" for Banias and both Bethsaida candidates (et-Tell and el-Araj). The name describes where the place is, not who should rule it. If a site's status is unclear in the sources, for example Emmaus Nicopolis in the former Latrun no-man's land, the Research Lead flags it for the PO rather than choosing.
- **Places with several candidates** list the countries of all their candidates, for example Cana: "Israel", "Lebanon"; Bethany beyond the Jordan: "Jordan", "West Bank".
- **Areas** (provinces, regions and other area records) get a short orienting phrase as `names.modern`, such as "Central Türkiye", "Western Türkiye" or "Parts of Greece, North Macedonia and Albania", plus their countries in `names.modernCountries`. This replaces M3-08's rule that left Judea, Samaria and Galatia without a modern name. An area that spans many countries lists the main ones (at most 6), and the phrase gives the rest of the picture.
- **Everything else stays as it is.** Non-area `names.modern` values stay the place name only, with no country in them, because the panel adds the country itself. Disputed places still have no `names.modern`. Candidate labels keep M3-08's form.
- **Sources:** each country must follow from the record's coordinates and a cited source (a dataset ID such as Wikidata or Pleiades, or a `bib:` entry). Add the source to the record's `summary.sources` only if no existing source supports it.

## Scope
1. **GIS Engineer:**
   - Add `names.modernCountries` (an array of unique strings from the allow-list) to `schema/location.schema.json`.
   - **Validator errors:** a non-exempt record without it; an exempt record (an empire, or a record inside Jerusalem) with it; a value outside the allow-list.
   - Change the `names.modern` word check so that area records (`province`, `region`) may name a country in their orienting phrase; other records still may not.
   - Add tests for each rule, and update `schema/README.md` → "Modern names".
   - Add the field, as optional, to the app's `PlaceNames` type (`app/src/features/map/types.ts`), and make sure `npm run build:data` carries it into the place index that search reads, so M3-15 can use it.
   - Commit: `feat(schema): add modern countries to place names`.
2. **Research Lead:** fill in `names.modernCountries` for every non-exempt record, and the orienting phrase for each area record. Change nothing else, except sources needed for the new values. Set changed records to `status: "draft"`. List every special case (disputed territory, places spanning borders, the areas' phrases) in `docs/research/M3-14-modern-countries.md`. Run `npm run validate:data` and `npm test`. Commit: `data(locations): add modern countries`.
3. **Fact-Checker:** check each country and phrase against the coordinates and the cited sources. Check that the exempt records have none, and use a semantic diff to check that nothing else changed. Set the records that pass back to `verified`. Write `docs/verification/M3-modern-countries.md`. Run `validate:data`, `test` and `test:app`. Commit: `docs(verification): verify modern countries`.

## Out of scope
Showing the field in the app (M3-15), candidate labels, any other field.

## Acceptance criteria
- [ ] Every record except the empires and the places inside Jerusalem has `names.modernCountries`, and every value is on the allow-list.
- [ ] Every area record has an orienting phrase as `names.modern`.
- [ ] The validator enforces the machine-checkable parts, and has tests for them.
- [ ] Each special case is listed in the research note, and anything left unclear is flagged for the PO.
- [ ] All 89 records are `verified` again, and CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: countries in modern names`.
