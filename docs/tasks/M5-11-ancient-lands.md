# M5-11 — The ancient lands left undrawn

| | |
|---|---|
| Agents | `research-lead`, then `fact-checker`, then `gis-engineer` (ADR-0014) |
| Models | Claude Sonnet 5; Claude Opus 5.5; GPT-5.3-Codex |
| Branch | `data/m5-ancient-lands`, from M5-09's planning commit. The PO rebases it onto M5-10 before its PR (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0044 item 8; ADR-0037 items 1 and 3 |
| Credit target | ~6,000 for the research, ~3,000 for the check and ~4,000 for the geometry (session guard: 10,000; ADR-0025) |

## Goal
Draw the lands that the ancient layer leaves out, such as Polemon's kingdom of Pontus and Armenia Minor, with their borders, wherever sources describe their extent. Then no border between two of the map's lands is missing for want of an area. The human's example is the land between Syria and Cappadocia (ADR-0044 item 8).

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0044 (read it first), ADR-0037 (items 1 to 3, and the MC7 update), ADR-0014, ADR-0026
- `docs/design/VISUAL_SPEC.md` §2 "Ancient layer" (including "Notes on the borders")
- `docs/research/` and `docs/verification/` notes from M4-02 and M4-03: the timeline and the shapes
- `data/timeline/` and `data/geo/` (the holders, areas and shapes), `SOURCES.md`, and `scripts/build-ancient-geo.mjs`, `scripts/check-ancient-geo.mjs` and `scripts/lib/ancient-app-data-builder.mjs`
- This card

## Scope
1. **Phase 1: research (research-lead).** No data changes.
   - **Audit:** for each timeline stop, list the lands within or along the empire's edge, in the map's reach, that have no drawn area. Include:
     - the timeline's holders without a shape;
     - lands that hold any of our places;
     - stretches where an area's border meets no neighbour.

     Start with Polemon's kingdom of Pontus, Armenia Minor, Abilene, Chalcis, Emesa and Iturea, then the client kingdoms on the empire's eastern edge (Sophene, Osroene, the Bosporan kingdom) and Mauretania (a province from AD 42). Check the land between Syria, Cappadocia and Commagene first.
   - **For each land:**
     - Can it be drawn from a source? That means a dataset (AWMC and the Barrington Atlas behind it, DARE, Pleiades) or a cited description: the rivers, ridges or towns at its edges.
     - What were its years, and who held it at each stop? The timeline data may already say.
     - How confident is the evidence?
   - **Write `docs/research/M5-ancient-lands.md`.** For each land, give:
     - its sources, with links and licences;
     - the rule for its shape (which dataset, or which cited features bound it);
     - its years and holders.

     List the lands that can't be drawn, and why. Answer the human's example directly: what lies between Syria and Cappadocia at each stop, and which borders are missing there.
2. **Phase 2: check (fact-checker).** Verify each land's sources, years, holders and proposed shape against the sources themselves. Write `docs/verification/M5-ancient-lands.md`.
3. **Phase 3: geometry (gis-engineer).**
   - Add the verified lands' shapes and timeline links. Every change to AWMC's lines is cited (ADR-0037 item 3), and the provenance and `SOURCES.md` are updated.
   - Update the Sources popover's note on undrawn lands so that it names only those still undrawn.
   - Run the checks below, and put screenshots at zooms 5 to 7 in the PR.

## Out of scope
- Border styles and zooms (M5-10).
- Lands far outside the map's reach, such as Britain.
- New place records.

## Acceptance criteria
- [ ] Every land in the audit is either drawn from a verified source, or listed in the note and in the popover's note as undrawn, with the reason.
- [ ] Wherever sources describe a border at a stop, it isn't missing at zooms 5 to 7, around Syria, Cappadocia, Commagene, Galatia and Pontus.
- [ ] `npm run validate:data`, `check:ancient-geo`, `test`, `build:data` (within its 300,000-byte budget), `test:app`, `export:web` and `verify:web:playwright` pass.

## Finish
Follow the session protocol in your agent file. PR title: `data(ancient): the lands left undrawn`.
