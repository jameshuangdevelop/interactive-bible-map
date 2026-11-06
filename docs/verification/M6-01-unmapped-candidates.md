# M6-01 verification: Sychar's unmapped candidate (Askar) and the panel's wording

- **Card:** `docs/tasks/M6-01-unmapped-candidates.md`, step 4 · **Branch:** `feat/m6-01-unmapped-candidates`, checked at `be05625` (diff against `6924180`)
- **Checked:** `data/locations/sychar.json` (the new `unmappedCandidates[0]` "Askar", the edited Tell Balata `support`, the edited `summary`, the removed `history` entry); the new `bib:isbe-sychar` in `data/bibliography.json`; the panel's new strings in `app/src/features/place-panel/place-panel.web.tsx` and `panel-model.ts`; the build output after `npm run build:data`. Against ADR-0017, `schema/README.md` ("Confidence meanings", "Unmapped candidates", "Modern names", "Sources quality floor", "Status workflow"), `docs/LICENSES.md`, `ATTRIBUTION.md` and the precedent in `docs/verification/M2-batch-2.md`.
- **Verifier:** fact-checker (Claude, Copilot CLI) · **Date:** 2026-11-05

**Result: fix required. Sychar stays `status: "draft"`.** Seven fixes: five in the record's wording or citations (F1–F5), one in `names.modern` (F6) and one in the panel (F7). No coordinate was invented, the sources and licenses pass, and the new strings "Not on the map: no verified coordinate.", "Reason:" and "2 proposed sites · 1 on the map" pass.

## 1. Sources opened (all read 2026-11-05)

| Source | Where | License, read at the source |
|---|---|---|
| OpenBible.info, Sychar | <https://www.openbible.info/geo/ancient/a27b472/sychar>, its GeoJSON <https://a.openbible.info/geo/data/a27b472.geojson>, and the Sychar line of `ancient.jsonl` in the OpenBible Bible-Geocoding-Data repository | "all content is licensed under a Creative Commons Attribution License" (CC BY 4.0) |
| OpenBible.info, Askar (modern) | <https://www.openbible.info/geo/modern/mb04b16/askar> | Same. Its point comes from the Digital Archaeological Atlas of the Holy Land (DAAHL), which stays rejected (M2-batch-2) |
| ISBE (1915), "Sychar", W. Ewing | <https://www.internationalstandardbible.com/S/sychar.html> (HTTP 200) | Public domain (published before 1929; `docs/LICENSES.md`, `ATTRIBUTION.md`) |
| Wikidata Q4302319, Q7951237, Q7697383, Q1651088 | `Special:EntityData/<Q>.json`; a SPARQL search within 1.2 km of OpenBible's Askar point; a label search for "Askar" | CC0 |
| Pleiades | Search for "Sychar" and "Askar" | No place for either |
| McClintock and Strong, *Cyclopaedia*, "Sychar" (not cited; read for context) | <https://www.biblicalcyclopedia.com/S/sychar.html> | — |
| WEB | `data/reference/engwebp_vpl.txt` | Public domain |

## 2. Findings

### Askar `support`, clause by clause
| Clause | Verdict | Evidence |
|---|---|---|
| "The modern village of Askar" | Pass | ISBE: "the village of \`Askar"; OpenBible: "Askar (modern)" |
| "near Jacob's well" | Pass (Note N3) | ISBE: "Fully half a mile off, on the edge of the plain, is the village of \`Askar" |
| "on the lower slope of Mount Ebal" | Pass | ISBE: "the village of \`Askar, on the lower slope of Ebal" |
| "is proposed in Bible-geography scholarship as Sychar's modern equivalent" | Pass | ISBE: "Many have sought to find Sychar in the modern \`Askar"; OpenBible lists "Askar (modern)" among "2 Possible Identifications", from 27 Bible dictionaries and atlases |
| "on the strength of the similarity between the two names" | **Fix F1** | Stated by none of the three sources (section 3) |
| OpenBible "records this identification with a higher aggregate confidence (65%) than the Shechem/Tell Balata alternative (25%)" | Pass | OpenBible: "Askar (modern): 65% confidence"; "another name for Shechem (ancient): 25% confidence", resolved to "Tell Balatah" |
| "based on the reference works it surveys" | Pass | OpenBible: "This chart only reflects the sources I consulted (listed above)"; 27 works listed under "Sources" |
| "The International Standard Bible Encyclopedia (1915) discusses the proposal and notes two difficulties" | Pass | ISBE: "There are two difficulties." |
| "long raised against it" | **Fix F4** | ISBE doesn't say the difficulties are old |
| "an unusual, though not necessarily disqualifying, sound change from the Hebrew letter ayin in the name 'Askar'" | **Fix F2, F3** | ISBE: "The first is the initial letter \`ain in the modern name. But G. A. Smith has shown that such a change as this, although unusual, is not impossible." |
| "the presence of Askar's own spring, which would have made it unnecessary for the village's residents to fetch water from Jacob's well" | Pass (but see F3) | ISBE: "the presence of the copious spring, \`Ain \`Askar, which would make it unnecessary for the villagers to carry water from Jacob's Well" |

### Askar `reason`
| Clause | Verdict | Evidence |
|---|---|---|
| "No coordinate for the village of Askar could be confirmed against an accepted source" | Pass | OpenBible's only point for Askar, `[35.28897, 32.21776]`, comes from DAAHL (rejected, M2-batch-2). Wikidata has no item for the village: the label search for "Askar" and the SPARQL radius search found only the refugee camp and unrelated items. Pleiades has none. |
| "the nearest confirmed independent point, the Askar refugee camp, sits roughly 800 m away" | Pass (Note N2) | Q4302319 (P625 `35.29743611, 32.21986389`) is 830 m from OpenBible's Askar point, which is in `openbible:sychar`'s own GeoJSON. Matches M2-batch-2's ~800 m. |
| "and describes a different feature" | Pass | Q4302319: "refugee camp in Nablus", P31 refugee camp (Q622499) |

### Edited Tell Balata `support`
The deletion is clean: only the Askar sentence went, and the coordinate, confidence and sources are unchanged. Of the retained text, "a variant name for … the ancient city of Shechem" passes (OpenBible: "another name for Shechem"), as does "OpenBible.info's … catalog records this identification as an alternative". "**or a place very near**" is stated by none of its three sources: **Fix F5**. This wording predates this PR, but a sign-off covers the whole `support`.

### Edited `summary` and the removed `history` entry
- "Only the Shechem/Tell Balata candidate is on the map; Askar is listed with the proposed sites but has no map point." **Pass.** It describes the project's own display, and the data and the panel match it. The debate sentence before it is unchanged and is stated by OpenBible (two identifications).
- `history: []`: **Pass.** The removed entry's facts now sit in `reason`, so nothing is lost.

### Sources and licensing: pass
- `openbible:sychar` resolves through `data/reference/openbible-ids.json` (`a27b472`). `bib:isbe-sychar` resolves, and `wikidata:Q4302319` exists.
- `bib:isbe-sychar` matches the page: title "Sychar", signed "W. Ewing", 1915, Howard-Severance Company. Its form matches the other `isbe-*` entries, and the URL returns 200 with the Sychar article.
- ISBE (1915) is public domain and is already covered by the "Public-domain texts" rows in `docs/LICENSES.md` and `ATTRIBUTION.md`. OpenBible's identification data is CC BY 4.0, and the DAAHL-derived Askar point is not used. Wikidata is CC0. There is no new upstream, so neither file needs an edit.
- **`wikidata:Q4302319` in `sources`:** appropriate, because the entry has one `sources` array for both `support` and `reason`, and the `reason`'s camp clause needs it. The two-source floor for the proposal itself is met without it, by `openbible:sychar` and `bib:isbe-sychar` (the card's stop condition doesn't trigger). See Note N1 on where its marker appears.

### Confidence: pass, with a question for the PO (Q1)
`medium` (Askar) beside `medium` (Tell Balata) fits "good support with some uncertainty" for each. They are equal, so the record takes no side. This is M2-batch-2's ruling ("confidence (medium/medium) fits the genuinely split modern scholarship"). The evidence also fits `disputed` ("multiple competing proposals in current scholarship"): OpenBible's surveyed works through 2020 still give both proposals, and Bethsaida, Cana, Emmaus and Phoenix mark comparable splits `disputed`. Today the validator counts only `candidates[]` toward the rule that a `disputed` record needs at least two candidates (`scripts/lib/validator.mjs`, `hasDisputedCandidate` and `data.candidates.length < 2`), so Sychar cannot be `disputed` without a rule change. I don't require it.

### No coordinate invented: pass
- `unmappedCandidates[0]` has no `coordinates` or `coordinateSource`, and the schema forbids them.
- After `npm run build:data`, "askar" appears only in `app/public/generated/places/sychar.json`, with no coordinate. The `places.index.json` entry for Sychar has one candidate, at Tell Balata.
- A search of `data/`, `content/`, `app/src/` and `app/public/generated/` finds neither OpenBible's Askar point nor the camp's point.
- The rendered panel (exported app, `?place=sychar`) shows Askar with no letter or button. The `@panel` test asserts that no map feature exists for it.

### WEB and political history: pass
`scripture[0].textWEB` (John 4:5) matches `JOH 4:5` in the WEB file exactly, and the diff touches no `scripture`, `otConnections` or `politicalHistory` line.

### The panel's wording
| String | Verdict |
|---|---|
| "Not on the map: no verified coordinate." | Pass. It states a data limit, not a likelihood, and agrees with `reason`. |
| "Reason:" | Pass |
| "2 proposed sites · 1 on the map" | Pass. These are neutral counts. |
| "Other proposed sites", with only the unmapped proposal listed | **Fix F7** |
| "Today: Tell Balata, West Bank" (from `names.modern`) | **Fix F6** |

## 3. Fixes required

### Research Lead: `data/locations/sychar.json`
- **F1 (content), Askar `support`:** "on the strength of the similarity between the two names" is stated by none of OpenBible, ISBE or Q4302319. ISBE says only "Many have sought to find Sychar in the modern \`Askar." (McClintock and Strong, which isn't cited, says "The etymology, however, is against it".) Remove the clause, or cite an opened source that states this basis.
- **F2 (content), Askar `support`:** "sound change from the Hebrew letter ayin in the name 'Askar'" misstates ISBE. ISBE's letter is "the initial letter \`ain in the modern name": the modern (Arabic) name, not a Hebrew letter. The change runs *to* that ʿain from "Sychar", not *from* it. Suggested wording: "the initial ʿain (ayin) of the modern name, a change from 'Sychar' that ISBE, following G. A. Smith, calls unusual but not impossible".
- **F3 (content, neutrality), Askar `support`:** the clause keeps ISBE's softening of the first difficulty ("not necessarily disqualifying") but drops its verdict on the second: "This difficulty would probably in any case be fatal to the claim of the village at \`Ain \`Askar to represent the ancient Sychar". That makes ISBE read more favourably to Askar than it is. Give ISBE's assessment of both difficulties, or of neither. ISBE's own 1915 leaning ("perhaps here [Telul Balata] we may locate the Sychar of the Gospel") can go on the Tell Balata candidate, citing `bib:isbe-sychar` (see F5).
- **F4 (citation), Askar `support`:** "long raised" isn't in ISBE ("There are two difficulties."). Remove "long", or cite an earlier opened source that raised them.
- **F5 (citation), Tell Balata `support`:** "or a place very near" isn't stated by `wikidata:Q7951237`, `wikidata:Q7697383` or `openbible:sychar` ("another name for Shechem"). Remove it, or add `bib:isbe-sychar` and word the clause to what ISBE says: Sychar is "a distinct place East of Shechem", placed at "Telul Balata".
- **F6 (neutrality), `names.modern`:** "Tell Balata" now names one of two recorded proposals. The panel shows "Today: Tell Balata, West Bank" just above "2 proposed sites · 1 on the map", and search shows "Tell Balata, West Bank · Village". `schema/README.md` ("Modern names") says: "give `names.modern` only when one neutral name covers every candidate; otherwise leave it out". Omit it, or use one sourced name that covers both sites. `names.modernCountries` (`West Bank`) covers both and passes.

### Frontend Engineer: `app/src/features/place-panel/`
- **F7 (neutrality, card conformance):** when a record has one mapped candidate and any unmapped ones, the panel lists only the unmapped proposal, under "Other proposed sites", with its confidence chip and full support. The mapped candidate gets no entry, and its confidence chip is replaced by the count. The reader sees Askar's case and "Medium" but not Tell Balata's, and "Other" ranks the unmapped proposal behind the mapped one only because of the map. The card says "after the mapped candidates, list each unmapped proposal". List the mapped candidate or candidates first in the same section, with confidence, support and sources (a letter only where the map shows one). Use a heading that doesn't rank them, for example "Proposed sites".

## 4. Notes (no change required)
- **N1:** the support paragraph carries all three markers ([3][4][5]), and the `Reason:` line carries none. So the refugee-camp item appears as a source for the support text, which it doesn't support. Consider repeating the markers after `Reason:`.
- **N2:** taken literally, "nearest confirmed independent point" is not the camp: Joseph's Tomb (Q1297538, 653 m) and Tell Balata (Q7697383, 802 m) are closer Wikidata points. The intended meaning is the nearest point *named* Askar. Suggested wording: "the only independently sourced point named Askar, the Askar refugee camp, lies roughly 800 m from the village's location given by OpenBible.info and is a different feature".
- **N3:** ISBE puts Askar "Fully half a mile off" the well. "Near" is fair, though "about half a mile from" is more exact.
- **N4:** before the place payload loads, the header shows the single candidate's "Medium confidence" chip, and then it switches to the count, because `places.index.json` carries no unmapped count. The card allows a count in the index for exactly this case.
- **N5:** the panel footer reads "Checked by the project's Fact-Checker · last reviewed unknown" for this draft record (the footer is unconditional, and this predates the PR). Sychar must not merge as `draft`.
- **N6 (for the PR Reviewer):** `app/src/features/map/types.ts` gains a type. The card says nothing in `app/src/features/map/` changes.

## 5. Question for the PO
- **Q1:** should an `unmappedCandidates` entry count toward the rule that a `disputed` record needs at least two candidates, so that a split like Sychar's can be marked `disputed`? M6 will meet more of these. If yes, the gis-engineer changes `scripts/lib/validator.mjs` and `schema/README.md`. That would also apply the existing rule that disputed places omit `names.modern` (F6).

## 6. Commands (Node 24, at `be05625`)
- `npm run build:data`: pass.
- `npm run validate:data`: pass, 207 warnings, none for `sychar`.
- `npm test`: 322 passed, 0 failed.

## Sign-off
**Not signed off.** `sychar` stays `status: "draft"` until F1–F7 are fixed and re-checked. Checked by fact-checker, 2026-11-05.
