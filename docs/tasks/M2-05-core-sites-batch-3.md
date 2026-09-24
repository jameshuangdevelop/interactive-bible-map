# M2-05 — Core sites, batch 3: Paul's letters, Revelation's churches and Acts (18 sites + 2 regions)

| | |
|---|---|
| Agents, in order | `research-lead` → `media-curator` → `fact-checker` (each adds its own commit; ADR-0014) |
| Models | Claude Sonnet 5 → Claude Haiku 4.5 (ADR-0016) → Claude Opus 5.5 (CP2 decision 4, applied early) |
| Branch | `data/m2-batch-3`, stacked on `data/m2-batch-2` |
| Depends on | M2-03 |
| Parallel with | none |
| Credit target | ~1,000 research, ~150 media, ~800 fact-check (session guard: 1,500 each) |

## Goal
Rebalance the core set toward Acts and the Epistles, at the human's request ("more Acts and Epistles focused … at least have all the Paul's letters"; recorded as ADR-0018 in the CP2 summary). After this batch, every Pauline letter destination is on the map, together with the other places the letters name, the seven churches of Revelation, and key stops in Acts. Region records support the zoom hierarchy and do not count as sites.

## Inputs (read only these)
- `AGENT_TEAM_PROMPT.md` §1, §2 and §4
- `docs/PROGRESS.md`
- `schema/README.md`, which holds the data conventions, including the `bib:` and `scripture:` source IDs
- `docs/research/SOURCES.md` and `docs/LICENSES.md`
- `docs/tasks/M2-02-core-sites-batch-1.md`: its **Phase A, B and C rules** apply to this batch, **with the differences listed below**
- This card

## Locations
The ids are proposals; follow the schema's id rules. If a location cannot be sourced to the standard, stop and report it under "Open questions" in `docs/PROGRESS.md` rather than guess.

| Group | ids | Notes |
|---|---|---|
| Regions (support records, not counted as sites) | `galatia`, `crete` | `zoomTier: region`, each with a sourced label point. Their province polygons come in M4. For `galatia`, describe the North and South Galatian views of who received the letter neutrally, and take neither side. `crete` is where Titus was left (Titus 1:5). |
| Places Paul's letters name | `laodicea`, `hierapolis`, `cenchreae`, `nicopolis`, `troas`, `miletus` | Laodicea and Hierapolis appear in Colossians 4:13–16, Cenchreae in Romans 16:1 and Nicopolis in Titus 3:12. Troas and Miletus appear in the letters and in Acts. |
| Churches of Revelation 2–3 | `smyrna`, `pergamum`, `thyatira`, `sardis`, `philadelphia`, `patmos` | Ephesus is already in batch 2, and Laodicea is listed above. |
| Acts | `salamis`, `perga`, `neapolis`, `tyre`, `malta`, `puteoli` | `neapolis` is the port of Philippi (Acts 16:11). `malta` is Melita (Acts 28:1). |

The regions of 1 Peter 1:1 (Pontus, Cappadocia, Asia and Bithynia, as well as Galatia) arrive as province polygons in M4 and are not location records here.

## Differences from the M2-02 rules
- **Commit messages:** `data(locations): add M2 batch 3 drafts`, `data(media): add images for M2 batch 3` and `docs(verification): add M2 batch 3 report`.
- **Verification report:** `docs/verification/M2-batch-3.md`. Do not edit the reports for batches 1 or 2.
- **ADR-0017 applies from the first draft:**
  - Every factual clause must be stated by a cited source that the author has opened. Dataset IDs support identification and coordinates; `bib:` entries support historical claims; `scripture:` supports only what its passage says. Wikipedia is never the only source.
  - Every image must show this place, confirmed through its Commons categories and description, and must record Commons' `LicenseShortName` exactly.
- **Identification checks:**
  - `nicopolis`: which Nicopolis Titus 3:12 means.
  - `malta`: Malta, and any serious minority proposal for Melita.
  - `troas`: Alexandria Troas.
  - `philadelphia`: Philadelphia in Lydia (Alaşehir), not other cities of that name.
  - Any site found to be disputed lists every serious candidate, with support and sources, in neutral wording.
- **Keep separate from other places with the same name:** Antioch, Caesarea, Philadelphia, Neapolis (not Nablus) and Salamis (Cyprus, not the Saronic island).
- **AI-reconstruction prompts (optional):** at most 3 sites from this batch.
- **Acceptance criteria:** the same as M2-02, applied to the 20 records above, with this batch's identification checks and report path.

## Finish
Each agent follows the session protocol in its agent file, but only the Fact-Checker's phase ends the task. PR title: `data: M2 batch 3 — Paul's letters, Revelation's churches and Acts (18 core sites)`.
