# M5-03 — Jesus' journeys: the well-attested segments

| | |
|---|---|
| Agents, in order | `research-lead` (research note, then data) → `fact-checker` (verification), each adding its own commits (ADR-0014) |
| Models | Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m5-jesus-journeys`, stacked on the M5 kickoff (ADR-0039). Before the data step, the PO merges M5-01's schema commit into it. |
| PR target | `main` (ADR-0039) |
| Depends on | The M5 kickoff for the research; M5-01's schema for the data step |
| Parallel with | M5-01, M5-02 and M5-05. M5-04 takes its stops from this task's research note. |
| Credit target | ~5,000 research and data, ~5,000 verification (session guard: 10,000 each; ADR-0025) |

## Goal
Find the segments of Jesus' travels that the Gospels clearly attest, under ADR-0038 item 3, and record each one with its passages, so that the Routes tab can show them without implying a harmonized itinerary.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0038 (the routes, and item 3's rule; read it first), ADR-0017 (every clause stated by a source you opened; Wikipedia never alone), ADR-0026 (English names), ADR-0033
- `docs/research/SOURCES.md`, `data/bibliography.json`, and `data/locations/*.json` (which places have a record, and the candidate sites of disputed places such as Bethsaida, Cana, Emmaus and Bethany beyond the Jordan)
- The WEB text in `data/reference/engwebp_vpl.txt` (lines start with `MAT`, `MAR`, `LUK` and `JOH`)
- From the data step: `schema/README.md` → "Routes (M5)" (M5-01)
- This card

## Scope
### Research Lead, phase 1: the research note (starts now)
Write `docs/research/M5-jesus-journeys.md`.
1. **The rule** (ADR-0038 item 3): a segment is shown only if a Gospel says that Jesus went from one named place to another, or the passage's context names both ends without doubt, and no Gospel's account conflicts with it. Apply it as written; if you think it needs refining, propose the change to the PO with examples rather than applying it.
2. **Every candidate segment,** checked against the rule: from, to, every Gospel passage that tells it, and whether it qualifies, with the reason. For example Matthew 4:13 (Nazareth to Capernaum), John 2:12 (down to Capernaum), John 4:3–5 (from Judea through Samaria to Sychar), Mark 7:31 (from the borders of Tyre and Sidon to the Sea of Galilee, through the region of Decapolis), Mark 11:1 (to Bethphage and Bethany), John 11:54 (to Ephraim) and Luke 24:13 (the walk to Emmaus, which Luke tells of two disciples before Jesus joins them; say whether it counts as Jesus' journey).
3. **What was left out and why,** for example sequences that only a harmony of the Gospels would give, journeys whose start or end the text doesn't name, and the journeys of Jesus' childhood with his family (Luke 2:4, 2:39 and 2:41–51; Matthew 2:13–23). The human decides on the list at MC9, so make the reasons short and clear.
4. **Order:** propose a neutral order for the segments, such as the order of each segment's first passage, and say why. Segments stand alone; don't join them.
5. **Stops:** for each, the record it matches (by id, and the candidate where the line should end under ADR-0038 item 4), or a stop entry: the English name (ADR-0026; for example, WEB spells "Bethsphage" in Mark 11:1, where most English Bibles have "Bethphage"), the site with coordinates from at least two sources, a confidence, today's name, the passages that name it, and candidate sites with their support where the site is disputed. Where the text names a region rather than a town (for example "the region of Decapolis", Mark 7:31), name the region.
6. **Years:** the approximate years of Jesus' ministry, from sources, with the range of scholarly views; the route's first year sets the ancient map's stop (ADR-0038 item 7). Give each view; don't resolve the debates (brief §2.6).
7. **Neutrality:** where traditions place a site differently, describe each view, as the place records do.

**Sources:** the WEB text for what the Gospels say (a `scripture:` source supports only what the passage says); open reference works, such as the International Standard Bible Encyclopedia (1915), Smith's *Dictionary of Greek and Roman Geography* (1854), the Jewish Encyclopedia (1906) and Britannica; and Pleiades, OpenBible.info or Wikidata for identifying sites.

Commit: `docs(research): Jesus' well-attested journeys`. Then reply to the PO with the list of segments and stops (M5-04 starts its lines from it), and stop until the PO says the schema is merged.

### Research Lead, phase 2: the data (after the PO merges M5-01's schema)
Encode the note in M5-01's format: the `jesus` route, its segments with their attestation, and the stop entries. Set new entries to `draft`. Run `npm run validate:data` and `npm test`. Commit: `data(routes): Jesus' well-attested journeys`.

### Fact-Checker
Open every source. Check each segment against the rule and the WEB text of every passage it cites, each excluded segment's reason, each stop entry's site against at least two sources, the names (ADR-0026), the years and the neutrality of the note (ADR-0017). Set passing entries to `verified`. Write `docs/verification/M5-jesus-journeys.md`. Run `validate:data`, `test` and `test:app`. Commit: `docs(verification): verify Jesus' well-attested journeys`.

## Out of scope
The lines (M5-04), the app (M5-05), full place records for the stops (an M6 batch), and any harmonized itinerary.

## Acceptance criteria
- [ ] The note applies the rule to every candidate segment, with the passages and a reason for each decision, and lists what was left out.
- [ ] Every stop is a record or a stop entry whose site cites at least two sources; disputed sites follow ADR-0038 item 4.
- [ ] The data validates under M5-01's schema, and the Fact-Checker has verified every entry.
- [ ] CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: Jesus' well-attested journeys`.
