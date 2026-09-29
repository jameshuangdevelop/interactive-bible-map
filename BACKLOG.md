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
- **Next data task, after the smoothness work (M3-12):** add "Judah" as a searchable name for Judea (the human asked for it on 2026-09-29), and add well-known areas the NT names that aren't on the map yet, such as Egypt, Arabia, Cappadocia, Pontus, Bithynia, Cilicia, Pamphylia, Phrygia, Illyricum, Libya and Mesopotamia. Also make "Greece" another name for Achaia, as in Acts 20:2. The human asked for well-known places with good information ("like Roman Empire, Greece, Egypt").
- **Province histories for M4's timeline.** M3-11's Fact-Checker removed the `politicalHistory` entries of four provinces because their end years rested on Wikipedia alone. M4 rebuilds them from non-Wikipedia sources, since the timeline needs them.

## Process and tooling
- Move to Copilot cloud agent if it becomes available, and record the switch in an ADR (brief §8).

## Map
- **Self-hosted Protomaps fallback** (M3-07's recommended option). M3 uses the VersaTiles public server as the outage-only fallback instead, because a regional Protomaps extract won't fit Cloudflare Pages' 25 MiB file limit. Hosting it on Cloudflare R2 (free up to 10 GB-month) needs an R2 bucket and a token with R2 permissions. Revisit if VersaTiles' terms change or if outages become frequent.

## Deferred review findings
PR Reviewer findings that were not addressed in their PR, each with a reason.

| Date | PR | Finding | Label | Why deferred |
|---|---|---|---|---|
| 2026-09-24 | M2-06 | `tests/validator.test.mjs`: the cross-file duplicate-image-id fixture also trips the prefix rule; add a comment explaining why a fully isolated duplicate case is impossible | nit | The test is correct as it is. Add the comment the next time the validator tests are touched. |
| 2026-09-24 | M2-05 | `data/media/philadelphia-lydia.json`: `-02` is close in subject and framing to `-01`; a more distinct city or site view would add variety | nit | The lead image is fine. Revisit during the M6 media passes. |
