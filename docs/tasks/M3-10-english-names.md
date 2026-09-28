# M3-10 — English-only names

| | |
|---|---|
| Agents, in order | `gis-engineer` (schema) → `research-lead` (data) → `fact-checker` (verification), each adding its own commit (ADR-0014) |
| Models | GPT-5.3-Codex → Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m3-english-names` |
| Depends on | M3-08 (merged, #20) |
| Parallel with | M3-03 (map view) |
| Credit target | ~300 schema, ~1,500 data, ~1,500 verification (session guard: 10,000 each; ADR-0025) |

## Goal
The map is for English-speaking Bible readers, for now (ADR-0026). As they read, they should be able to look up any place by the English name their Bible uses. So every name the app shows or searches is English. Names in other languages stay in the data, unused, so the research isn't lost if other languages come later.

Today, `names.ancient` and `names.alternate` mix English Bible names ("Olivet", "Calvary") with Hebrew, Greek, Latin, Arabic and Turkish forms ("Kfar Nahum", "Hierosolyma", "Al-Quds", "Korinthos"). Malta's title is "Melita", the KJV's spelling, while most modern versions say "Malta".

## The rule (ADR-0026)
- **The title** (`names.ancient[0]`) is the spelling **most popular English Bibles agree on**: compare the NIV, ESV, NLT, KJV, NKJV and CSB in a verse that names the place. For example, the title is "Malta" (NIV, ESV, NLT, NKJV and CSB; the KJV has "Melita"), and it stays "Berea" (all six; the WEB has "Beroea"). If the six are evenly split, use the WEB's spelling. Where the Bible doesn't name the place (for example the Temple Mount's sites), use the standard English name in the record's sources.
- **Other English spellings stay searchable:** every other spelling any of these versions uses, **including the WEB's**, goes in `names.ancient` or `names.alternate`. So a KJV reader who types "Melita" finds Malta, and the WEB passages still match the record's names.
- **`names.ancient` and `names.alternate` hold English names only:** names used in English Bibles or in standard English reference works, such as "Calvary", "Olivet", "Sea of Tiberias", "Lake of Gennesaret", "Place of a Skull", "Strato's Tower", "Bethlehem Ephrathah" and "Alexandria Troas".
- **`names.otherLanguages`** (new; M3-10 schema step) holds names in other languages, and ancient-language forms that English doesn't use: Hebrew, Aramaic, Greek, Latin, Arabic and Turkish forms and transliterations, such as "Kfar Nahum", "Yerushalayim", "Al-Quds", "Hierosolyma", "Korinthos", "Athenae" and "Julias". **The app never shows or searches them.**
- **Unchanged:** `names.modern` and candidate `label` fields. The panel shows the modern name as "Today: …" (M3-04), and candidate labels name real sites. Neither is searched (M3-05).
- **Sources:** every name must be supported by the record's own sources (ADR-0017). Record the spelling comparison in `docs/research/M3-10-bible-spellings.md`: a table with each place, the verse checked, each version's spelling, and the chosen title. Add each version to `data/bibliography` as a cite-only `bib:` entry, and cite those entries for the spellings. **Never copy verse text from these versions:** they are copyrighted, and only the spelling of a name is recorded.

## Scope
1. **GIS Engineer (done, `c0b1718`):** an optional `names.otherLanguages` field, left out of the app's data outputs; a validator error for a name repeated across `ancient`, `alternate`, `modern` and `otherLanguages`; `otherLanguages` included in the scripture-linkage check; `schema/README.md` updated; tests.
2. **Research Lead:**
   - Look up every place's spelling in the six versions, using a reliable online source for each version (the publisher's site, or a site that shows the licensed text), and write the table.
   - Apply the rule to all 63 records, changing only `names.ancient` (its order and entries), `names.alternate` and `names.otherLanguages`, plus `sources` for the new `bib:` entries.
   - List every title change and every borderline call (for example "Judaea" or "Pergamon") in the commit body with its reason.
   - Keep changed records at `status: "draft"`.
   - Commit: `data(locations): make displayed names English`.
3. **Fact-Checker:**
   - Spot-check the spelling table against the versions: at least every title change, and a sample of 15 unchanged titles.
   - Check each moved name against the rule and the sources.
   - Use a semantic diff to confirm nothing else changed.
   - Re-set `verified` on the records that pass, and write `docs/verification/M3-english-names.md`.
   - Commit: `docs(verification): verify English-only names`.

## Out of scope
`names.modern`, candidate labels, every other field, and app code. M3-04 and M3-05 use the rule.

## Acceptance criteria
- [ ] Every title is the spelling most of the six versions agree on, and the table shows it.
- [ ] `names.ancient` and `names.alternate` hold English names only, including every version's spelling; the other names are in `names.otherLanguages`.
- [ ] No verse text from the NIV, ESV, NLT, KJV, NKJV or CSB is copied into the repository.
- [ ] All 63 records are `verified` again. CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: English-only names`.
