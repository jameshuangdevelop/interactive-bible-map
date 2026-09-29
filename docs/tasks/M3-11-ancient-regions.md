# M3-11 — Ancient country and region names (about AD 50)

| | |
|---|---|
| Agents, in order | `gis-engineer` (schema) → `research-lead` (data) → `fact-checker` (verification), each adding its own commit (ADR-0014) |
| Models | GPT-5.3-Codex → Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m3-ancient-regions`, stacked on `data/m3-english-names` (M3-10) |
| Depends on | M3-10 (both change the same records) |
| Parallel with | M3-03 rework (the map draws the new labels) |
| Credit target | ~300 schema, ~3,000 data, ~3,000 verification (session guard: 10,000 each; ADR-0025) |

## Goal
Show each place's ancient "country" and "region" (ADR-0027). The basemap no longer shows modern countries (ADR-0024), so our own records supply the ancient ones: the **Roman Empire**, and the **Roman provinces** as they stood in **about AD 50**, the time of Paul's journeys. For example, Athens is a city in **Achaia**, in the **Roman Empire**.

The map draws them as labels (spec §2; M3-03), and the place panel shows a line such as "City · Achaia · Roman Empire" (spec §3; M3-04). Province borders, and how they changed between 4 BC and AD 100, come with the ancient layer and timeline in M4.

## The rule (ADR-0027)
- **New record types:** `empire` (the Roman Empire) and `province` (a Roman province or a client kingdom). They are area records like the existing regions: `zoomTier: "region"`, with one label-point candidate.
- **Which records:** the Roman Empire, plus every province that contains one of our 63 places in about AD 50. The expected list, which the Research Lead confirms or corrects from sources: Italy, Sicily (for Malta), Achaia, Macedonia, Asia, Galatia, Lycia and Pamphylia, Syria (with Cilicia), Cyprus, Crete and Cyrene, and Judea. Add others only where a place needs them.
- **Existing area records:** `galatia` becomes `type: "province"`. `crete` stays the island, with the province as its parent, unless the sources support a better model. Galilee, Samaria and Judea stay as the Gospel districts, with the province as their parent.
- **Judea, which has two meanings:** the NT uses "Judea" both for the district around Jerusalem and for the Roman province, which in AD 44–66 also covered Galilee and Samaria. Choose a model that is sourced, neutral and not confusing on the map, for example one record for the district and one for the province with distinct English titles supported by the sources. Explain the choice in the commit body. The PO raises it at CP3b.
- **Names:** M3-10's rule: the title is the spelling most popular English Bibles agree on (NIV, ESV, NLT, KJV, NKJV and CSB), for example Achaia, Macedonia, Asia, Galatia, Cilicia, Syria, Pamphylia, Italy, Crete and Cyprus. Where the Bible doesn't name the area, use the standard English name in the sources. Mention in the summary where the NT uses another name for the same area, for example "Greece" in Acts 20:2.
- **Parents (about AD 50):** every place's `parentId` points to the smallest area record containing it: a district such as Galilee, otherwise a province. Districts point to their province, and provinces to the Roman Empire. Existing parents stay (for example, Jerusalem's sites keep `jerusalem`). Where AD 50 is uncertain or the place changed hands around then (for example Caesarea Philippi, Bethany beyond the Jordan, Damascus or Nicopolis), say so in the record's history with sources, and choose the assignment the sources support for AD 50.
- **Each new record is a full record** under the schema and ADR-0017: English names, a summary, history notes with sources, WEB `scripture` entries where the NT names the area, one label point from a cited gazetteer (not OSM-derived, and not Wikipedia alone), `confidence`, and no `names.modern` unless one neutral modern geographic name exists (M3-08's rule). Images are not needed yet (backlog).

## Scope
1. **GIS Engineer:**
   - Add `empire` and `province` to the `type` enum.
   - Validator: parent chains have no cycles and end at an `empire` record; an `empire` has no parent; a `province`'s parent is an `empire`; `region`, `province` and `empire` records use `zoomTier: "region"`.
   - Document the types, the parent chain and the AD 50 convention in `schema/README.md`. Add tests.
   - Commit: `feat(schema): add empire and province records`.
2. **Research Lead:** create the new records, set every record's `parentId` under the rule, and list all assignments in the commit body with notes on the uncertain ones. Keep changed records at `draft`. Commit: `data(locations): add ancient empire and provinces`.
3. **Fact-Checker:** verify every new record in full, and every parent assignment against its sources for about AD 50. Use a semantic diff to confirm that existing records changed only in `parentId` (and `type` for Galatia). Re-set `verified`. Write `docs/verification/M3-ancient-regions.md`. Commit: `docs(verification): verify ancient empire and provinces`.

## Out of scope
Borders and the timeline (M4), images for the new records, and app code (M3-03 and M3-04 draw and show them).

## Acceptance criteria
- [ ] Every place's parent chain ends at the Roman Empire, and the validator enforces it.
- [ ] Each new record meets ADR-0017, with WEB passages where the NT names the area.
- [ ] The Judea model and every uncertain assignment are explained, sourced and neutral.
- [ ] All records are `verified`. CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: ancient empire and provinces (about AD 50)`.
