# M3-18 — Galleries of 4 to 7 images for major places

| | |
|---|---|
| Agent(s) | `media-curator` (choose and remove) → `gis-engineer` (the rule) → `media-curator` (credit names), each adding its own commit |
| Model | Claude Sonnet 5 for the Media Curator, which must view every image; GPT-5.3-Codex for the GIS Engineer (fallback GPT-5.5) |
| Branch | `data/m3-gallery-size` |
| Depends on | ADR-0029's update of 2026-10-05 |
| Parallel with | M3-06, M3-14, M3-15 and M3-16 |
| Credit target | ~1,500 AI credits (session guard: 10,000) |

## Goal
The human, on 2026-10-05: "for the more important places, we should have 4-7 images (including the AI generated ones)". Major places now get 4 to 7 images, counting the AI reconstruction (ADR-0029 item 3, as updated). Of the 31 major places, 24 already have 6 or 7 images. The other 7 have 8: Corinth, Damascus, Galatia, Laodicea, Pergamum, Philippi and Rome. Each drops one, and the validator enforces the new range.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0029, items 3 to 5 and the 2026-10-05 update
- `.github/agents/media-curator.agent.md`
- `data/media/<id>.json` for the seven places, and their `data/locations/<id>.json` for context
- `schema/README.md` (the images rules), `schema/location.schema.json` (the `prominence` description), `scripts/lib/validator.mjs` (`MAJOR_PLACE_MIN_IMAGE_COUNT` and `STANDARD_PLACE_MAX_IMAGE_COUNT`) and `tests/validator.test.mjs`
- This card

## Scope
1. **Media Curator: remove one image from each of the seven.**
   - View every image in each of the seven galleries (a thumbnail is enough) before choosing.
   - Remove the image that adds least: a near-duplicate of another view, a close-up that breaks the overall-feel rule (ADR-0029 item 5), or the weakest of several images of the same kind.
   - Keep the AI reconstruction first. Keep at least one `modern` and one `site` view. Keep a `reconstruction` or `historical` image when it is the only one of its kind.
   - Image ids follow display order (the validator checks this), so renumber the images after the removed one. Then search the repository for every removed or renumbered id (for example in `ATTRIBUTION.md`, `docs/`, `tests/`, `scripts/` and the app's fixtures) and update each reference. Don't edit old verification reports, which record what was true when they were written.
   - Write `docs/research/M3-18-gallery-size.md`: for each place, the image removed and a one-line reason, and its gallery's kinds before and after.
   - Commit: `data(media): trim seven major galleries to 7 images`.
2. **GIS Engineer: enforce 4 to 7.**
   - Set `MAJOR_PLACE_MIN_IMAGE_COUNT` to 4, and add `MAJOR_PLACE_MAX_IMAGE_COUNT = 7`. More than 7 images on a major place is an error, as more than 3 is for a standard place. The minimum keeps its `REQUIRE_MAJOR_IMAGES` switch.
   - Test both limits, with the switch on and off for the minimum.
   - Update `schema/README.md` and the `prominence` description in `schema/location.schema.json` to say 4–7, counting the AI reconstruction.
   - Commit: `feat(validator): major places have 4 to 7 images`.
3. **Media Curator: credit names as their Commons pages ask** (added 2026-10-05 from M3-19's licensing check, `docs/LICENSES.md`). Twelve credits don't use the attribution form their Commons file page requests: Rome's David Iliff photo, `mount-of-olives-02`, `temple-mount-02` and `joppa-01` ("Andrew Shiva / Wikipedia"), `ephesus-06` ("José Luiz Bernardes Ribeiro"), `tyre-02` (add "www.vascoplanet.com"), and six Pikiwiki Israel files (`bethany-beyond-the-jordan-02` and `-07`, `caesarea-maritima-04` and `-06`, `nazareth-05` and `-06`). Open each file page, copy its requested attribution exactly into the image's `author`, and change nothing else. Ids may have moved in step 1, so find each image by its file. Commit: `data(media): credit photos as their Commons pages ask`.

## Out of scope
Adding or replacing images, captions, credits other than the twelve in scope item 3, standard places other than `joppa` and `tyre`, and the gallery's design.

## Expected outputs
Seven changed files in `data/media/`, any references to renumbered ids, the research note, and the validator, test and schema changes.

## Acceptance criteria
- [ ] Every major place has 4 to 7 images. The AI reconstruction comes first, and each gallery keeps at least one `modern` and one `site` view.
- [ ] Each removal has a reason in the research note, and no reference to a removed or renumbered id is left.
- [ ] The validator rejects a major place with 8 images and, with the switch on, one with 3. Tests cover both.
- [ ] `npm run validate:data` (0 errors), `npm test`, `npm run test:app` and `npm run build:data` pass. `check:images` isn't needed, since no link is added.

## Finish
Follow the session protocol in your agent file. PR title: `data: galleries of 4 to 7 images for major places`.
