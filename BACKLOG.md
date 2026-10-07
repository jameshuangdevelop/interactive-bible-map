# Backlog

Ideas that are deferred and not scheduled. The PO moves an item into a milestone only with the human's approval.

## Out of scope for now (brief §1)
- 3D terrain
- Offline use
- Languages other than English
- Quizzes
- Audio
- Search by verse or by person
- Any period other than the first century (the timeline is designed to extend later)
- Native iOS/Android app build (React Native Web keeps this path open)

## Data
- **Elam ("Elamites", Acts 2:9).** M3-13 removed the Elam record because no source gave its status in about AD 50. Strabo 16.1.18 even says the Elymaean king refused to be subject to the Parthian king. Add it back when a first-century source gives the status of Susiana and Elymais, and decide whether its parent is the Parthian Empire or whether it was a semi-independent kingdom (`docs/verification/M3-well-known-areas.md`).
- **Records for the areas the timeline draws that the New Testament names,** such as the Decapolis, Idumea, Iturea, Trachonitis, Abilene, Phoenicia and Lycia. In M4 they are areas on the map without a record; M4-02's research note lists them for an M6 batch (ADR-0037).

- **Images for area records** (provinces and regions such as Egypt or Cappadocia). M3.5 covers places, and Galatia and Crete as major areas; other areas have no images yet.
- **Countries in candidate labels.** ADR-0028 keeps M3-08's country-free candidate labels for now; the record's "Today" line says where the proposed sites are.
- **Hosting AI images on Cloudflare R2** if `media/ai/` grows past about 50 MB. Until then they live in the repository and deploy with the site (ADR-0029).
- **Places within Jerusalem that aren't on the map yet,** such as the Kidron Valley, which Jerusalem's About mentions. The human asked for places in the About to be links (ADR-0033); only places on the map can be. Add them, with sources, in an M6 batch.
- **Unsupported clauses in candidate support text.** M3-16's Fact-Checker found clauses in the untouched `candidates[].support` text of Bethany beyond the Jordan and Cana that no cited source states (`docs/verification/M3-longer-about.md`). A small sourced data task should fix them.
- **Older verified text cites books no one on the team could open,** such as Murphy-O'Connor's guide and Rainey and Notley's atlas (found by M3-16's Fact-Checker). Decide whether to re-source those clauses from openable sources (a question for CP3b).
- **Thin "today" paragraphs.** In some major places, the About paragraph on what a visitor sees today is short, or rests on a 1915 encyclopedia (M3-16's Fact-Checker). Refresh them from current site and museum pages in a later data pass.

## Process and tooling
- Move to Copilot cloud agent if it becomes available, and record the switch in an ADR (brief §8).
- **A time limit for CI's build job.** `.github/workflows/app.yml`'s `build` job has no `timeout-minutes`, so a stuck run waits for GitHub's 6-hour default. On 2026-10-07, three runs on `main` hung at the Playwright install, a step lean CI (ADR-0036) has since removed from the build. Add a 20-minute limit the next time the workflow changes.

## Map
- **A place line that follows the timeline.** In M4 the panel's line, such as "City · Galilee · Roman Empire", keeps the "about AD 50" convention (ADR-0037 item 2). It could follow the timeline's year instead, for example naming Herod Antipas's tetrarchy in AD 30.
- **Egypt's label point** sits in the Eastern Desert rather than the Nile valley most readers associate with Roman Egypt (M3-13 review nit). Revisit in a sourced label-point pass.
- **Self-hosted Protomaps fallback** (M3-07's recommended option). M3 uses the VersaTiles public server as the outage-only fallback instead, because a regional Protomaps extract won't fit Cloudflare Pages' 25 MiB file limit. Hosting it on Cloudflare R2 (free up to 10 GB-month) needs an R2 bucket and a token with R2 permissions. Revisit if VersaTiles' terms change or if outages become frequent.
- **Colossae is no longer unexcavated.** Its location record still says it has never been excavated, but excavation has begun (Biblical Archaeology Society interview, July 2026; found by the M3.5-03 Fact-Checker). After CP3.5, a small sourced data task updates the record.
- **Flickr Commons "No restrictions" images.** Many Internet Archive book scans on Commons carry only this license, which `docs/LICENSES.md` doesn't list, so higher-resolution scans of public-domain plates can't be used (for example a 2,256 px scan of Allom's 1836 Philadelphia plate; M3.5-04). The Fact-Checker decides whether to accept it for works that are public domain by age, and if so how to record the license.

## Deferred review findings
PR Reviewer findings that were not addressed in their PR, each with a reason.

| Date | PR | Finding | Label | Why deferred |
|---|---|---|---|---|
| 2026-09-24 | M2-06 | `tests/validator.test.mjs`: the cross-file duplicate-image-id fixture also trips the prefix rule; add a comment explaining why a fully isolated duplicate case is impossible | nit | The test is correct as it is. Add the comment the next time the validator tests are touched. |
| 2026-09-24 | M2-05 | `data/media/philadelphia-lydia.json`: `-02` is close in subject and framing to `-01`; a more distinct city or site view would add variety | nit | The lead image is fine. Revisit during the M6 media passes. |
| 2026-10-01 | M3.5-06 | AI thumbnails currently reuse the full repo-hosted AI file instead of a resized derivative | nit | Fixture-only for now; revisit in M3.5-07 when real AI images land. |
| 2026-10-01 | M3.5-06 | `export:web` copies any `.webp` in `media/ai/` without checking whether a place payload references it | nit | Fixture-only for now; revisit in M3.5-07 when real AI images land. |
