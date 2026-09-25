# M3-04 — Place panel

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-place-panel` |
| Depends on | M3-03 (map and selection). Modern names are cleaned up in M3-08; display them as stored. |
| Parallel with | M3-05 (search) |
| Credit target | ~900 AI credits (session guard: 1,500) |

## Goal
Build the Google-Maps-style place panel exactly as `docs/design/VISUAL_SPEC.md` §3 describes, in its order: photos with credits, names, confidence, candidates, actions, About, In the Bible, OT connections, Places in, Sources, and the footer.

## Inputs (read only these)
- `docs/design/VISUAL_SPEC.md` §3, §5, §6, §7 and §8, and wireframes 02, 03 and 05
- `schema/README.md`, for the record, media and bibliography formats and the source-ID prefixes
- `docs/LICENSES.md`, for the WEB notice and the image-credit rules
- The M3-02 and M3-03 code
- This card

## Scope
1. **Loading:** load `places/<id>.json` when a place is selected, showing the skeleton state from spec §5.
2. **Photos:**
   - Show a carousel for 2–3 images, loading Commons **thumbnail** URLs at panel width rather than the full files.
   - Put the credit line under every image: "Photo: author · license (linked to `licenseUrl`) · Wikimedia Commons (linked to `sourcePage`)". The caption is the alt text and appears below the credit.
   - Show a placeholder when an image fails to load, keeping the credit.
3. **Names and confidence:**
   - The title is the first ancient name. Below it come the modern name (hidden for disputed places), "Also known as …", and the type and parent link.
   - Show a confidence chip in words for single-candidate places, and the disputed banner for places with several candidates.
4. **Candidates** (disputed places): a lettered list with a chip, support text (two lines, expandable) and sources for each. Selecting one centres the map on it and updates `&candidate=`.
5. **Actions:** Zoom to (Fit all sites for disputed places), Copy link, and Sources, which scrolls to the list.
6. **About:** the summary, then the history notes, each followed by numbered source markers that link to Sources.
7. **In the Bible:**
   - Group the passages by book in canonical order, using the book order the validator already uses.
   - Show the reference in bold and the WEB text in the serif face. Show the first 5, then "Show all *n* passages".
   - Jerusalem, with 174 passages, must stay responsive.
8. **OT connections:** the reference, the note and source markers.
9. **Places in *name*:** chips for records whose `parentId` is this place.
10. **Sources:** a numbered list of readable citations with links.
    - Dataset IDs become labels such as "Pleiades place 678231", "Wikidata Q59174" or "DARE 21094", linked to their canonical URLs; follow `docs/research/SOURCES.md`.
    - `bib:` entries show as author, title and year, with a link where one exists.
    - `scripture:` entries show the passage.
11. **Footer:** "Checked by the project's Fact-Checker · last reviewed *date*", and a Report an issue link that opens a new GitHub issue in this repository, with the title "Place: *id*".
12. **Small screens** (spec §1): a basic bottom sheet with the same content, opening at about 40% height.
13. **Tests:**
    - the section order;
    - the disputed-place layout;
    - "Show all";
    - source formatting for each prefix;
    - that credits always render;
    - keyboard use: Esc closes the panel and focus returns to the pin.

## Out of scope
Search (M3-05), the timeline and political history display (M4), and routes (M5).

## Acceptance criteria
- [ ] Wireframes 02 and 03 are reproduced with real data for Capernaum and Emmaus, and the PR includes screenshots of both.
- [ ] Every image shows its author, license and source; no image appears without a credit.
- [ ] Every source marker resolves to a numbered source with a working link where a URL exists.
- [ ] The panel is a labelled region with the place name as its level-1 heading, and passes an automated accessibility check (for example axe) with no serious issues.
- [ ] CI passes. Committed as `feat(panel): add place panel`.

## Finish
Follow the session protocol in `.github/agents/frontend-engineer.agent.md`. PR title: `feat(panel): Google-Maps-style place panel`.
