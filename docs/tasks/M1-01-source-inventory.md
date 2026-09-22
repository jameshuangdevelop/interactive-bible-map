# M1-01 — Source inventory with licenses

| | |
|---|---|
| Agent | `research-lead` |
| Model | Claude Sonnet 5 (fallback Claude Sonnet 4.6) |
| Branch | `docs/m1-source-inventory` |
| Depends on | CP0 approved |
| Parallel with | M1-02 (the only shared files are your rows in `docs/PROGRESS.md` and `docs/BUDGET.md`) |
| Credit target | ~400 AI credits (session guard: 1,500) |

## Goal
Find out which open datasets and sources the project can build on, what each covers, and under which license, before any data is written.

## Inputs (read only these)
- `AGENT_TEAM_PROMPT.md` §1, §2 and §4
- `docs/PROGRESS.md`
- This card

## Scope
Evaluate every candidate in brief §2.1: OpenBible.info Bible Geocoding, Pleiades, Digital Atlas of the Roman Empire (DARE), ORBIS, AWMC geodata, Wikidata, Wikimedia Commons, Natural Earth and OpenStreetMap-based data. Add any other open source you find that is clearly useful. Group the sources by what they would supply:
1. Biblical place identification and coordinates, including candidate sites for disputed places.
2. Ancient features: Roman provinces and client kingdoms over time, roads, and ancient coastlines.
3. Modern geography data: names, coastlines and borders. Assess only the data and its license here; the choice of tiles and hosting belongs to M1-02.
4. WEB Bible text: an authoritative machine-readable edition and its public-domain statement.
5. Images: how Wikimedia Commons license and author metadata can be read reliably.
6. Historical and scholarly references for descriptions and dates: which are open access and how to cite them. Copyrighted works are cited only, never copied.

For each source, record:
- Name, URL and maintainer
- Coverage, especially of first-century New Testament places
- Format, API and access method
- License **as stated on the source's own site** (link the page and give the date read), the attribution it requires, and any share-alike, non-commercial or no-derivatives terms
- Stable ID scheme for citations
- Known quality issues
- Recommended use (primary, cross-check, or not used) and why

**Spot-check** coverage in the main candidate sources for these 10 places: Jerusalem, Capernaum, Bethsaida, Cana, Emmaus, Nazareth, Antioch (Syria), Ephesus, Corinth and Philippi. For each, note whether the source has the place, its ID there, and whether it lists more than one candidate site. Record IDs only, not coordinates; coordinates come in M2.

Also include:
- A proposed list of citation prefixes (for example `pleiades:`, `openbible:`, `wikidata:`).
- A list of licensing questions for the Fact-Checker (M1-03).

## Out of scope
Writing `data/*.json`, choosing the data license (the Fact-Checker decides), map library, tiles and hosting (M1-02), and app code.

## Expected outputs
- `docs/research/SOURCES.md`, in this order: a summary under 200 words, an overview table, one section per source, the spot-check table, the citation prefixes, and open questions for the Fact-Checker.
- Your row in `docs/PROGRESS.md` updated, and a row appended to `docs/BUDGET.md`.

## Acceptance criteria
- [ ] Every §2.1 candidate is either evaluated or excluded with a reason.
- [ ] Every license claim links to the page it was read from, with the date read.
- [ ] The overview table flags share-alike, non-commercial and no-derivatives terms.
- [ ] The spot-check table covers all 10 places.
- [ ] Nothing is guessed. Unknowns are marked "unknown" with what was tried.
- [ ] No copyrighted text is copied.
- [ ] Committed as `docs(research): add M1 source inventory`, with the push and PR commands printed but not run.

## Finish
Follow the session protocol in `.github/agents/research-lead.agent.md`. PR title: `docs(research): M1 source inventory`.
