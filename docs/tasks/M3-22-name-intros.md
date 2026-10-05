# M3-22 — Introduce names in the other About texts

| | |
|---|---|
| Agents, in order | `research-lead` (text) → `fact-checker` (verification), each adding its own commit (ADR-0014) |
| Models | Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m3-name-intros` |
| Depends on | ADR-0033 item 1 |
| Parallel with | M3-16's second half (the 31 major places), M3-20 and M3-21 |
| Credit target | ~1,500 for the Research Lead, ~2,500 for the Fact-Checker (session guard: 10,000 each) |

## Goal
The human, at mini checkpoint MC2 (2026-10-05): "in general, please don't name drop without introduction unless it's pretty obvious in the Bible. For example, most people don't know who 'Josephus' or 'Herodotus' are." M3-16 applies this to the 31 major places. This card applies it to the other 58.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0017 and ADR-0033
- `docs/design/VISUAL_SPEC.md` §8 (wording)
- `schema/README.md` (source IDs and "Status workflow")
- `data/bibliography.json`, and the records below
- This card

## Records
The 58 records with `prominence: "standard"` (or none). A search for common names found 30 that need work: `achaia`, `antioch-pisidia`, `arabia`, `bethsaida`, `bithynia`, `caesarea-philippi`, `cappadocia`, `cilicia`, `crete-cyrene`, `derbe`, `egypt`, `iconium`, `illyricum`, `italy`, `judea-province`, `libya`, `magdala`, `media`, `mesopotamia`, `miletus`, `neapolis-macedonia`, `nicopolis`, `pamphylia`, `parthian-empire`, `perga`, `pontus`, `samaria`, `sicily`, `syria` and `tarsus`. The search was only a start: read all 58 for other names (emperors, writers, scholars, books and databases).

## Scope
1. **Research Lead:**
   - Rewrite only the clauses that name a person, writer or work without introducing them. Add a few words on first mention ("the first-century Jewish historian Josephus", "the Greek geographer Strabo"), unless the Bible makes the name familiar.
   - Remove database names from the text ("per Pleiades …" becomes a plain statement). The citation stays in `sources`.
   - Each introduction is a factual clause, so a cited source must state it. Use an existing `bib:` entry where it does; otherwise add an openable source.
   - Keep every other word, and set changed records to `status: "draft"`.
   - Commit: `data(locations): introduce names in the About text`.
2. **Fact-Checker:**
   - Check that each changed clause is supported and that no fact was lost.
   - Scan all 58 records for any name left unintroduced.
   - Set the records that pass to `verified`, and add `docs/verification/M3-name-intros.md`.
   - Commit: `docs(verification): verify name introductions`.

## Out of scope
The 31 major places (M3-16), and any other change to the text.

## Acceptance criteria
- [ ] No About text among the 58 names a person, writer or work without introducing them, unless the Bible makes them familiar, and none names a database.
- [ ] Every introduction is stated by a cited source, and all changed records are `verified` again.
- [ ] `validate:data`, `npm test` and `test:app` pass.

## Finish
Each agent follows the session protocol in its agent file. PR title: `data: introduce names in the About text`.
