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

## Process and tooling
- Move to Copilot cloud agent if it becomes available, and record the switch in an ADR (brief §8).

## Deferred review findings
PR Reviewer findings that were not addressed in their PR, each with a reason.

| Date | PR | Finding | Label | Why deferred |
|---|---|---|---|---|
| 2026-09-24 | M2-06 | `tests/validator.test.mjs`: the cross-file duplicate-image-id fixture also trips the prefix rule; add a comment explaining why a fully isolated duplicate case is impossible | nit | The test is correct as it is. Add the comment the next time the validator tests are touched. |
| 2026-09-24 | M2-05 | `data/media/philadelphia-lydia.json`: `-02` is close in subject and framing to `-01`; a more distinct city or site view would add variety | nit | The lead image is fine. Revisit during the M6 media passes. |
