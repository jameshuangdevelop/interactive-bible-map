# M2-06 — Stable image IDs and lead images

| | |
|---|---|
| Agents, in order | `gis-engineer` (schema, validator, migration) → `media-curator` (lead-image review) → `fact-checker` (checks the media changes) |
| Models | GPT-5.3-Codex → Claude Haiku 4.5 (ADR-0016) → Claude Sonnet 5 |
| Branch | `feat/m2-image-ids`, stacked on `data/m2-batch-2` (#11) |
| Depends on | M2-03 |
| Parallel with | M2-05 Phase A (batch 3 rebases onto this branch before its media phase) |
| Credit target | ~300 schema, ~100 media, ~150 fact-check |

## Goal
Give every image a stable, predictable name of our own. The human asked (in a comment on #11) whether images could follow a naming convention. We hotlink images from Wikimedia Commons (brief §2.5), so their file names belong to Commons and vary widely, for example `20090731_korinthos05.jpg` or `Fall_of_Antioch_in_969.png`. We cannot rename those files, but we can name the images ourselves.

## Convention
- Each entry in `data/media/<location-id>.json` → `images[]` gets an `id` of the form `<location-id>-NN`. `NN` is two digits, numbered from `01` in display order. **`-01` is the lead image**, the first photo in the details panel.
- Image files stay on Commons under their Commons names. `url` and `sourcePage` keep pointing there, and attribution is unchanged. We never download, rename or commit Commons images.
- **Reserved for later:** AI reconstructions (brief §2.5) will use `<location-id>-ai-NN`. They are the only images the project will host itself, as `<id>.<ext>`, and their prompts in `content/image-prompts/<location-id>.md` will use the same IDs. For now, the schema only allows `aiGenerated: false` and photo IDs.

## Scope
1. **GIS Engineer:**
   - Add `images[].id` to `schema/media.schema.json` as required, with a pattern.
   - Validator rules: the id prefix equals `locationId`; the numbering runs 01, 02, … in array order with no gaps; ids are unique across the repository.
   - Tests: a passing case, plus failing cases for a wrong prefix, a gap, a wrong order and a duplicate.
   - Add an "Image IDs and storage" section to `schema/README.md` covering the convention above.
   - Assign ids to all existing media files, keeping their current order. Use a throwaway script outside the repository.
   - Commit: `feat(schema): add stable image IDs`.
2. **Media Curator:**
   - For all 43 media files, make sure `-01` is the clearest photo of the place itself, such as the site, its ruins or the city, and reorder where needed, renumbering the ids.
   - Remove any image that does not show the place. For example, `antioch-syria`'s `Fall_of_Antioch_in_969.png` is a medieval manuscript scene of a 10th-century siege.
   - List every change in the PR body.
   - Commit: `data(media): review lead images`.
3. **Fact-Checker:**
   - Check each changed media file: that the image shows the place, that the lead choice is sensible, that nothing else changed, and that the ids validate.
   - Add a short section to `docs/verification/M2-batch-2.md` headed "Image IDs and lead images (M2-06)". It covers the media files of both batches.
   - Commit: `docs(verification): check image IDs and lead images`.

## Out of scope
Rehosting images, adding new images (except to replace a removed lead image where a location would otherwise be left with none), AI images, and app code.

## Acceptance criteria
- [ ] All 82 images have valid ids, and CI passes: `npm ci`, `npm test` and `npm run validate:data`.
- [ ] Every `-01` shows the place itself.
- [ ] `schema/README.md` documents the convention and the reserved AI pattern.
- [ ] Each agent updated its own `docs/PROGRESS.md` row and appended a `docs/BUDGET.md` row.

## Finish
PR title: `feat(data): stable image IDs and lead-image review`.
