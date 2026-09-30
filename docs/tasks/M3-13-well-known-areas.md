# M3-13 — Well-known areas and more English names

| | |
|---|---|
| Agents, in order | `research-lead` (data) → `fact-checker` (verification), each adding its own commit (ADR-0014) |
| Models | Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m3-well-known-areas` |
| Depends on | M3-11 (merged) |
| Parallel with | M3-04 (panel) and M3-05 (search) |
| Credit target | ~5,000 data, ~5,000 verification (session guard: 10,000 each; ADR-0025) |

## Goal
Add the well-known areas the New Testament names that aren't on the map yet, and two more English names readers look up. The human asked for this on 2026-09-29: "for places that people generally know and can provide good information, we should have them (like Roman Empire, Greece, Egypt, etc.)", and "yes" to "Judah" finding Judea.

## The rule
Follow ADR-0017 (sources), ADR-0026 (English names) and ADR-0027 (about AD 50; parent chains), exactly as M3-11 did:
- **Area records** use `zoomTier: "region"` and one label-point candidate from Pleiades, or Wikidata cross-checked with Pleiades. The point must be inside the area, on land, and away from our city pins where possible.
- Each has English names, a short neutral summary, history notes with sources (never Wikipedia alone), and WEB `scripture` entries where the NT names the area.
- **Types:**
  - `province` for Roman provinces and client kingdoms as of about AD 50;
  - `region` for districts and peoples' lands inside or across provinces (Phrygia, Lycaonia, Pisidia, Mysia);
  - `empire` for the Parthian Empire.
- **Parents:** the smallest area record that contains the whole area. A region split between two provinces (for example Phrygia, split between Asia and Galatia) points to the Roman Empire. The history note says which provinces held it.

## Scope (Research Lead)
1. **New area records** (confirm or correct each from the sources, and explain any change in the commit body):
   - **Egypt** (the Roman province; Matthew 2:13; Acts 2:10).
   - **Arabia** (the Nabataean kingdom, a client kingdom; Galatians 1:17).
   - **Cappadocia, Pontus and Bithynia** (1 Peter 1:1; Acts 2:9; 16:7). Say how Pontus was divided around AD 50.
   - **Cilicia** (a `region` under Syria; Acts 15:41; Galatians 1:21).
   - **Pamphylia** (Acts 13:13; 27:5). Its province is disputed; follow the Perga note from M3-11.
   - **Phrygia, Lycaonia, Pisidia and Mysia** (Acts 16:6–8; 14:6; 13:14).
   - **Illyricum** (Romans 15:19), with Dalmatia (2 Timothy 4:10) as a name or a separate record, whichever the sources support.
   - **Libya** ("the parts of Libya about Cyrene", Acts 2:10): a region under Crete and Cyrene.
   - **Mesopotamia** (Acts 2:9; 7:2) and the **Parthian Empire**, its empire ("Parthians", Acts 2:9). Add Media and Elam only if the sources give good information for about AD 50.
2. **Names:**
   - "Judah" as an alternate name of the district `judea`, if the sources and English Bibles support it (for example Matthew 2:6).
   - "Greece" as an alternate name of `achaia` (Acts 20:2), if the sources support that Acts 20:2's "Greece" means Achaia. Otherwise add it where they place it, and explain.
3. **Parents:** set `parentId` on any existing place now inside a new area record, for example a city in Pamphylia or Lycaonia. List every change.
4. **Spellings:** record the six-version spellings for every new name in `docs/research/M3-13-bible-spellings.md`. Spellings only, never verse text.
5. Keep new and changed records at `draft`. Run `npm run validate:data` (0 errors), `npm test` and `npm run build:data`, and a semantic diff of existing records (only `parentId` and the alternate names may change). Commit: `data(locations): add well-known New Testament areas`.

## Scope (Fact-Checker)
Verify every new record in full, and every changed parent and name, as in M3-11. Write `docs/verification/M3-well-known-areas.md`, re-set `verified`, and commit `docs(verification): verify well-known New Testament areas`.

## Out of scope
Borders and the timeline (M4), images, and app code (the map and panel already show area records).

## Acceptance criteria
- [ ] Every new record meets ADR-0017, ADR-0026 and ADR-0027, and the validator passes, with every chain ending at an empire.
- [ ] "Judah" finds Judea, and "Greece" finds Achaia, or a sourced alternative.
- [ ] All records are `verified`. CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: well-known New Testament areas`.
