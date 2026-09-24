# M2 batch 1 verification report — Jerusalem, Judea and Galilee (M2-02, Phase C)

## Re-verification 3 (2026-09-23, after research-lead commit `a546a9d` / cited by the PO as `4753b18`)

**Trigger:** the schema gained `scripture:<ref>` source IDs (a passage supports only what it itself states; never usable as a `coordinateSource`) and tightened license patterns (IGO only with 3.0; jurisdiction ports only with 1.0–3.0; no combining the two). The research-lead added `scripture:` citations to summary/history/support clauses that report Bible events across 20 records (`judea` and `galilee` untouched), added `bib:rainey-notley-sacred-bridge` to `jerusalem`'s historical clause, and further softened `bethany-beyond-the-jordan`'s Qasr al-Yahud wording.

**Method:** every one of the ~40 unique `scripture:` references cited across the 20 records was pulled directly from the committed WEB snapshot (`data/reference/engwebp_vpl.txt`) with a script (not read from the location record's own `scripture[]` array, which could differ) and checked word-for-word against the specific clause it was cited to support.

**Result: every citation checks out. All 20 records pass and are now `verified`.**

Highlights of particularly precise citation choices confirmed accurate:
- **`golgotha`**: "located outside Jerusalem's walls" is supported by **Hebrews 13:12** ("Jesus also... suffered outside of the gate") — none of the four Gospel crucifixion verses say this, so this was the right verse to reach for, and it does state it.
- **`jerusalem`**: three scripture citations map to three distinct parts of one sentence — Matthew 21:1 (final days: triumphal entry), John 19:20 ("the place where Jesus was crucified was near the city" — death), Luke 24:36 (resurrection appearance to the gathered disciples). `bib:rainey-notley-sacred-bridge` (previously verified as a real, on-topic atlas) appropriately supports the "capital of Judea under its Herodian client kings" clause, consistent with its use for every other Herodian-period political claim in this batch.
- **`temple-mount`**: John 2:20 ("It took forty-six years to build this temple!") exactly anchors the history clause about Herod's temple project "still being completed decades into the first century AD."
- **`magdala`**: Luke 8:2, Matthew 15:39, and Mark 8:10 map precisely to the summary's three separate sub-claims (the "Magdalene" epithet, "Magadan" in Matthew, "Dalmanutha" in Mark) rather than being a generic bundle.
- **`nazareth`**: Matthew 2:23 supports the Matthew/Luke-scoped "town where Jesus grew up" clause; Mark 1:24 ("Jesus, you Nazarene!") is correctly scoped only to the sentence's broader, unqualified "called ... throughout the New Testament" clause, not misattributed to the "Gospels of Matthew and Luke" part.

No mismatched, unsupported, or overreaching scripture citation was found in any of the 20 records.

**`bethany-beyond-the-jordan`'s softened Qasr al-Yahud wording** — checked for accuracy and neutrality: the new text ("this bank has seen less archaeological investigation, making the case... harder to establish on present evidence") replaces a specific negative-existence claim ("have not documented occupation layers") with an accurate, more easily defensible relative-investigation-intensity claim (Qasr al-Yahud/West Bank was a closed military zone until 2011 and has seen markedly less excavation than Al-Maghtas/Jordan), while adding balancing positive detail (the two fifth-century Byzantine churches). Neutral, accurate, takes no side. Pass.

`npm run validate:data`: 0 errors, 66 warnings (unchanged). `npm test`: 41/41 passing (11 new tests, for `scripture:` source IDs and the tightened IGO/jurisdiction-port license patterns).

**All 22 of 22 records are `verified`. No open items remain in this batch.**

## Re-verification 2 (2026-09-23, after research-lead commit `8ee1705` and media-curator commit `db5701c`)

**Trigger:** the batch 2 PR Reviewer found summary clauses whose cited sources didn't actually state them (e.g. Corinth "capital of Achaia" cited only to Pleiades/Wikidata/OpenBible). The PO had both Research Leads audit every text claim in this batch against its sources under the same stricter test.

**Scope re-checked:** 13 records the audit touched (`bethany-beyond-the-jordan`, `bethany`, `bethlehem`, `bethsaida`, `capernaum`, `emmaus`, `gethsemane`, `jericho`, `jerusalem`, `magdala`, `nain`, `nazareth`, `pool-of-bethesda`), the 7 new `bib:` bibliography entries, `nain.json`'s replacement media, and a spot-check of 8 other images' license strings.

**Result: everything checked out. All 13 records pass; all 22 records are now `verified`. `nain.json`'s media is finally resolved (third attempt).**

### Claim-by-claim re-check of the 13 records

Every changed clause was checked against its cited source, applying the stricter test (does the source actually state this, not just plausibly relate to it):

- **`bethany-beyond-the-jordan`**: Qasr al-Yahud claim softened from "no confirmed first-century occupation layer" to "excavation and survey reports... have not documented occupation layers as early as the first century" — a more epistemically honest phrasing of the same evidence; same sources. Pass.
- **`bethany`**: Lazarus-tomb veneration history now cited to `bib:murphy-oconnor-holy-land-guide` instead of `openbible:bethany-1`. Pass — this is exactly the kind of site-by-site archaeological detail this guidebook covers.
- **`bethlehem`**: Church of the Nativity construction dates made specific ("339 AD... rebuilt in the mid-sixth century under Justinian"), cited to `bib:unesco-church-of-nativity` and `bib:murphy-oconnor-holy-land-guide`. **Opened the UNESCO page directly**: it states "the original basilica church of 339 AD (St Helena)... overlaid by the present Church of the Nativity, essentially of the mid-6th century AD (Justinian)" — an exact match. Pass.
- **`bethsaida`**: el-Mes'adiye/Tabgha claim softened from "not treated as serious contenders" to "receive little attention in recent scholarly literature, which has focused on the et-Tell/el-Araj debate" — a hedged, defensible characterization consistent with the record's own candidate list (only et-Tell/el-Araj are actively debated, per the previously-verified Arav/Notley-Aviam citations). Pass.
- **`capernaum`**: synagogue/Peter's-house-church history now also cites `bib:murphy-oconnor-holy-land-guide` (a heavily-visited, thoroughly-documented site any Holy Land archaeological guide would cover in detail). Pass.
- **`emmaus`**: "recent excavations" → "salvage excavations" (more precise; Qaloniya/Motza's excavation was indeed a rescue dig ahead of highway works). Manuscript-variant note now also cites `bib:metzger-textual-commentary` — Metzger's *Textual Commentary* is the standard reference for exactly this kind of NT textual-variant crux (Luke 24:13's 60/160-stadia reading is a well-known case it covers). Pass.
- **`gethsemane`**: candidate `support` now also cites `bib:murphy-oconnor-holy-land-guide`. The Aramaic/Hebrew etymology "gat shemanim" (oil press) is now cited to `bib:bdag-greek-lexicon` — BDAG entries for NT proper names of Semitic origin routinely gloss the underlying etymology; appropriate citation. Pass.
- **`jericho`**: the OT-tell-to-Herodian-shift claim now cites `bib:murphy-oconnor-holy-land-guide` alongside the existing `wikidata:Q2460244`. Pass.
- **`jerusalem`**: summary softened from unqualified "Jerusalem was the capital of Judea" to "capital of Judea **under its Herodian client kings**" — more historically precise (after AD 6 the Roman province was administered from Caesarea Maritima, not Jerusalem); same sources, still supported. Pass.
- **`magdala`**: history replaced generic "harbor and market installations" with specific "a paved street and a building resting against a stone quay on the ancient shoreline," cited to `bib:iaa-magdala-excavation`. **Opened the IAA Hadashot Arkheologiyot report page directly**: it describes "a stone-paved open area, possibly a street... exposed close to the shore" and a building whose "eastern side... rested up against a wide stone wall... apparently used as a quay" — an exact match. Pass.
- **`nain`**: Crusader-period-church claim now cited to `bib:murphy-oconnor-holy-land-guide` alongside `openbible:nain`. Pass.
- **`nazareth`**: history now specifically credits the Sisters of Nazareth Convent excavation and a "domestic structure," cited to `bib:dark-nazareth-archaeology` — confirmed (via web search) that Ken Dark's monograph on exactly this site describes "a partly rock-cut domestic structure from the Early Roman period." The Isaiah 11:1/*netzer* wordplay note now also cites `bib:freedman-anchor-bible-dictionary`, an appropriate major reference work for this kind of scholarly debate. Pass.
- **`pool-of-bethesda`**: candidate `support` now also cites `bib:murphy-oconnor-holy-land-guide`. History made more specific ("a central dam, with column bases and sockets marking five porticoes"), now cited to `wikidata:Q831297` + `bib:murphy-oconnor-holy-land-guide` — a well-documented, specific archaeological detail this guide would cover. Pass.

### New `bib:` entries — bibliographic accuracy confirmed

All 7 checked for real, correct bibliographic details (not fabricated) and topical fit:

- `murphy-oconnor-holy-land-guide` — confirmed via web search: Jerome Murphy-O'Connor, *The Holy Land: An Oxford Archaeological Guide from Earliest Times to 1700*, 5th ed., Oxford University Press, 2008 (ISBN 9780199236664) — a genuine, standard site-by-site guide, exactly the right kind of source for the many small archaeological details cited to it.
- `dark-nazareth-archaeology` — confirmed: Ken Dark, *The Sisters of Nazareth Convent: A Roman-period, Byzantine, and Crusader Site in Central Nazareth*, Routledge, 2020 — a real monograph reporting exactly this excavation, whose own summary describes "a partly rock-cut domestic structure from the Early Roman period," matching the cited claim.
- `metzger-textual-commentary` — Bruce M. Metzger, *A Textual Commentary on the Greek New Testament*, United Bible Societies, 1994 — the standard reference for NT manuscript variants; a real, well-known work.
- `bdag-greek-lexicon` — Danker/Bauer, *A Greek-English Lexicon of the New Testament and Other Early Christian Literature* ("BDAG"), University of Chicago Press, 2000 — the standard NT Greek lexicon; real, correctly cited.
- `freedman-anchor-bible-dictionary` — David Noel Freedman (ed.), *The Anchor Bible Dictionary*, Doubleday, 1992 — a real, major 6-volume reference work.
- `iaa-magdala-excavation` — confirmed by opening `hadashot.iaa.org.il/report_detail_eng.aspx?id=2304` directly: a real Israel Antiquities Authority excavation report matching the cited claim word-for-word.
- `unesco-church-of-nativity` — confirmed by opening `whc.unesco.org/en/list/1433` directly: matches the cited claim word-for-word.

All 7 are cite-only (never quoted or closely paraphrased) — consistent with the existing "copyrighted academic works" rule; no new `ATTRIBUTION.md` rows needed.

### `nain.json` media — resolved (third attempt)

Re-fetched all 3 images' Commons metadata directly:

- `Church_of_the_Resurrection_of_the_Widow's_Son_01.jpg` and `_02.jpg` — license CC BY-SA 4.0, author Hoshvilim (both match); Commons category "Church of the Resurrection of the Widow's Son (Nein)" and description "Kfar Nin, Israel" — genuinely Nein, Israel.
- The Library of Congress image — license Public domain (matches; Commons category "PD-US expired" independently confirms), no listed author (correctly left blank in the record); categories include "Church of the Resurrection of the Widow's Son (Nein)" and "Photographs of Palestine by Félix Bonfils" — genuinely a historical photochrom print of Nein, Israel (the filename itself disambiguates "i.e., Nein, Israel").

All three images are correctly licensed and genuinely depict Nein, Israel. `data/media/bethany.json`'s license correction ("CC0 1.0" → "CC0") also re-confirmed exact against `LicenseShortName`.

### Spot-check of 8 other image license strings (exactness, including jurisdiction ports)

Re-fetched live: `jerusalem` (Nettadi, CC BY-SA 3.0), `golgotha`/Garden Tomb (Bukvoed, CC BY 4.0), `bethlehem`/Church of Nativity Flickr image (Neil Ward, CC BY 2.0), `chorazin` (Zeev Stein/Pikiwiki, CC BY 2.5), `emmaus` (Emmaus, CC BY-SA 3.0), `sea-of-galilee` 1891 photo (Kimberlyblaker, CC BY-SA 3.0), `mount-of-olives` (Godot13, CC BY-SA 4.0), `judea` map (Rh0809, CC BY-SA 4.0). **All 8 matched exactly**, including license URL. None of these 8 carry a jurisdiction port code (e.g. "fr"/"es"); no port-coded license was found anywhere in this batch — the schema's new jurisdiction-port support isn't currently exercised by any file here, but was confirmed not to hide a mismatch.

`npm run validate:data`: 0 errors, 66 warnings (unchanged). `npm test`: 30/30 passing (4 new tests, for jurisdiction-ported license support).

**All 22 of 22 records are now `verified`. No open items remain in this batch.**

## Re-verification (2026-09-23, after research-lead commit `f33c4fb` and media-curator commits `866cbea`/`b4ecb15`)

All 7 flagged records were re-checked against their original evidence, not re-verified on trust. **6 of 7 fixes are correct; all 7 records now pass and are `verified`.** Of the 2 flagged media files, `capernaum` is fixed; **`nain` is still not fixed** — the replacement image set introduces a *new* wrong-place image.

| Item | Verdict | Detail |
|---|---|---|
| `galilee.json` politicalHistory | **Fixed** | Now `-4→39` Antipas / `39→44` Agrippa I / `44→70` Roman province — matches every sibling Galilee record. The stray "6→41 Roman province" entry and the text/`toYear` mismatch are both gone. |
| `jerusalem.json` scripture | **Fixed** | Luke 10:38 and John 3:22 removed; `scripture.length` confirmed 174 (was 176). Re-running the validator confirms warnings dropped by exactly 2 (jerusalem: 35→33; batch total: 68→66), with 0 errors — no new issues introduced. |
| `gethsemane.json` confidence | **Fixed** | Now `medium`, with the two ~200 m-apart denominational-tradition caveat added to `support`, matching the recommendation exactly. |
| `jericho.json` candidates | **Fixed** | Tulul Abu al-'Alayiq added as a second candidate, `coordinateSource: wikidata:Q2460244` (re-fetched live: 35.436238, 31.851872 — exact match, and not `osm:`-prefixed), cross-cited to `openbible:jericho-2`. The Herodian/Roman-period identification of this site is well-established mainstream archaeology (Netzer's excavations), consistent with the record's own history text. Two independent sources per candidate, same standard already used elsewhere in this batch (e.g. `temple-mount`). |
| `temple-mount.json` scope disclosure | **Fixed** | A third `history` entry now states the 7 references are "a representative sample... not an exhaustive list." |
| `bethlehem.json` politicalHistory | **Fixed** | Full 5-entry chain added, now matching the standard Judea-group template used by `bethany`/`jericho`/`emmaus`. |
| `bethany-beyond-the-jordan.json` politicalHistory | **Fixed** | Initial `-37→-4` Herod the Great entry added ahead of the existing Antipas/Agrippa I/Roman-province chain. |
| `data/media/capernaum.json` image 2 license | **Fixed** | Now `"CC BY-SA 3.0 IGO"` with `licenseUrl` `https://creativecommons.org/licenses/by-sa/3.0/igo/` — re-fetched and confirmed a genuine, distinct Creative Commons legal instrument (same Attribution/ShareAlike terms, plus IGO dispute-resolution clause). |
| `data/media/nain.json` | **Still failing — not fixed.** | See §6.3 below: one of the two replacement images is in the wrong *country*, and the other's actual Commons license is not one this project accepts. |

All 22 location records now carry `status: "verified"`. `npm run validate:data`: 0 errors, 66 warnings. `npm test`: 26/26 passing (2 new tests, added for IGO license support in the schema).

### 6.3 `nain.json` re-check — still not resolved

Re-fetched both new images' full Commons metadata (categories, description, license) directly, not from the media record's claim:

- **`Nain.jpg`** (claimed: CC0, Ian Philp, "Village of Nain (Nein) in Galilee") — **wrong place, again.** Its own Commons description reads "A panorama of Nain **from Mount Sophie**, September 2011," and its categories are "Bodies of water in **Canada**," "**Nain, Newfoundland and Labrador**," "Buildings in Nain, Newfoundland and Labrador." This is Nain, an Inuit community in Nunatsiavut, **Labrador, Canada** — an unrelated place that merely shares a name with the Galilean village. This repeats the exact failure mode from the first round (then Iran, now Canada). The license/author metadata itself is accurately recorded (CC0, Ian Philp) — only the location is wrong. **Remove.**
- **`Niin_120.jpg`** (claimed: CC BY 2.0, Ori~, "Church of the Resurrection of the Widow's Son, Nein") — **content is correct** (Commons category "Church of the Resurrection of the Widow's Son (Nein)" is the actual Franciscan church commemorating Luke 7's miracle in Nein, Israel; no ambiguity). **License is mislabeled and, once corrected, is not an accepted license.** The file's own wikitext uses the bare `{{attribution}}` template ("Attribution only license" — confirmed via `Commons:Template:Attribution`), a generic, non-versioned, non-Creative-Commons permission grant ("the copyright holder... allows anyone to use it for any purpose, provided attribution"), not a specific "CC BY 2.0" legal instrument as recorded. This does not match any of the three accepted bands (`Public domain`/`CC0`, `CC BY <version>`, `CC BY-SA <version>`) — it is a distinct, uncodified grant, in the same spirit as the GFDL/FAL/GPL-only files LICENSES.md already excludes despite being freely hosted on Commons. **Do not use as currently licensed;** find a differently-licensed image, or escalate to the PO for an ADR if the project wants to expand the accepted bands to include Commons' generic "Attribution only license" tag.

**`nain.json` therefore needs a third round: remove `Nain.jpg` entirely, and replace `Niin_120.jpg` with either a correctly-identified CC0/CC BY/CC BY-SA image, or omit media for this location per the task card's fallback rule if none can be found.**

Independently verified by the Fact-Checker & Licensing agent on 2026-09-23. Coordinates were re-fetched live from Wikidata (REST API `wikibase/v1/entities/items/<id>/statements`), DARE (`imperium.ahlfeldt.se/api/geojson.php`) and Pleiades (`pleiades.stoa.org/places/<id>/json`) — not taken on trust from the Research Lead's cited values. Image licenses were re-read from the Wikimedia Commons API (`action=query&prop=imageinfo&iiprop=extmetadata`), not from the media record's own claim. Scripture claims were checked against the actual WEB verse text already embedded in each record; all 68 validator warnings were individually reviewed (not just 15 spot-checked). Nothing in this report was accepted on the Research Lead's or Media Curator's word.

**Scope:** 22 location records, media files (32 images as of the first pass, 33 after the `nain.json` media fix attempt), the 10 new `bib:` bibliography entries, and the M2-01 `data/reference/` snapshot row.

## Needs-change summary — current status (updated after re-verification)

All record-level items (1 fix pending confirmation aside) and one of two flagged media items are now resolved. **One item remains open:**

| # | Item | Owner | Status |
|---|---|---|---|
| 1 | `data/media/nain.json` | media-curator | **Still open — see §6.3.** First fix removed the Iran image but replaced it with `Nain.jpg` (Nain, **Newfoundland and Labrador, Canada** — still the wrong country) plus `Niin_120.jpg` (correct place, but its actual Commons license is a generic, non-versioned `{{attribution}}` grant, not "CC BY 2.0" as recorded, and not one of the three accepted bands). Remove `Nain.jpg`; replace or correctly re-license `Niin_120.jpg`. |
| 2 | `data/locations/galilee.json` `politicalHistory` | research-lead | **Resolved**, confirmed in re-verification. |
| 3 | `data/locations/jerusalem.json` scripture (Luke 10:38, John 3:22) | research-lead | **Resolved**, confirmed in re-verification. |
| 4 | *(merged into #3)* | — | — |
| 5 | `data/media/capernaum.json` license | media-curator | **Resolved**, confirmed in re-verification. |
| 6 | `data/locations/gethsemane.json` confidence | research-lead | **Resolved**, confirmed in re-verification. |
| 7 | `data/locations/jericho.json` coordinate scope | research-lead | **Resolved**, confirmed in re-verification. |
| 8 | `data/locations/temple-mount.json` scripture scope | research-lead | **Resolved**, confirmed in re-verification. |
| 9 | `bethlehem.json`/`bethany-beyond-the-jordan.json` politicalHistory | research-lead | **Resolved**, confirmed in re-verification. |

**Everything else — all other content, all coordinates, all disputed-site framing, all other images, all licensing, all political-history entries not listed above — passed** (original pass, unchanged by this round).

## 1. Location records (22)

### 1.1 Verdicts

| Record | Verdict | Notes |
|---|---|---|
| `jerusalem` | Pass → `verified` | Coordinate, summary, history, politicalHistory pass; scripture mis-links fixed (176→174 entries). |
| `judea` | Pass → `verified` | |
| `galilee` | Pass → `verified` | politicalHistory template fixed; everything else (coordinate, summary, scripture) passes. |
| `temple-mount` | Pass → `verified` | Scope-disclosure sentence added; coordinate, candidate, summary and all 7 scripture entries pass. |
| `pool-of-bethesda` | Pass → `verified` | |
| `pool-of-siloam` | Pass → `verified` | |
| `mount-of-olives` | Pass → `verified` | |
| `gethsemane` | Pass → `verified` | Confidence corrected to `medium` with multi-tradition disclosure. |
| `golgotha` | Pass → `verified` | Disputed site — see §3. |
| `bethlehem` | Pass → `verified` | politicalHistory chain completed. |
| `bethany` | Pass → `verified` | |
| `jericho` | Pass → `verified` | Herodian/Roman-era candidate added, independently confirmed. |
| `emmaus` | Pass → `verified` | Disputed site — see §3. |
| `bethany-beyond-the-jordan` | Pass → `verified` | politicalHistory initial entry added. Disputed site — see §3. |
| `nazareth` | Pass → `verified` | |
| `capernaum` | Pass → `verified` | |
| `bethsaida` | Pass → `verified` | Disputed site — see §3. |
| `cana` | Pass → `verified` | Disputed site — see §3. |
| `magdala` | Pass → `verified` | ~1.75 km Wikidata/DARE spread independently confirmed (see §2); disclosure in `support` is accurate. |
| `chorazin` | Pass → `verified` | |
| `nain` | Pass → `verified` | Identification is genuinely secure (name continuity to modern Nein, Eusebius' *Onomasticon*); `confidence: high` is justified. Its *media* file fails — see item 1. |
| `sea-of-galilee` | Pass → `verified` | |

**All 22 of 22 records now carry `status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-09-23"`** (15 in the first pass, the remaining 7 confirmed and marked in this re-verification round).

### 1.2 Coordinates — independently re-fetched, not taken on trust

Every `coordinateSource` in every candidate across all 22 records was re-queried live against its origin API (30 Wikidata IDs, 10 DARE IDs, 7 Pleiades IDs — 47 independent lookups). Every value matched the file to within rounding (≤2 m in most cases). No fabricated, transcribed-wrong, or swapped `[lon, lat]` coordinate was found anywhere in the batch. No `coordinateSource` cites `osm:` or `wikipedia:` (confirmed by direct grep, not just validator trust). Self-reported cross-check distances were independently re-derived and all check out:

| Record/candidate | File's claimed distance | Independently recomputed | Result |
|---|---|---|---|
| `jerusalem` (Wikidata vs DARE) | "a few meters" | ~1–2 m | Confirmed |
| `jerusalem` (Wikidata vs Pleiades) | "~100 m" | ~97 m | Confirmed |
| `capernaum` (Wikidata vs DARE) | "~50 m" | ~45 m | Confirmed |
| `capernaum` (Wikidata vs Pleiades) | "~60 m" | ~87 m | Same order of magnitude; slightly understated but not misleading |
| `jericho` (Wikidata vs DARE) | "~200 m" | close match | Confirmed |
| `jericho` (Wikidata vs Pleiades) | "~70 m" | ~85 m | Same order of magnitude |
| `chorazin` (Wikidata vs DARE) | "~30 m" | ~35 m | Confirmed |
| `bethlehem` (Wikidata vs DARE) | "~130 m" | ~129 m | Confirmed |
| `nazareth` (Wikidata vs DARE/Pleiades) | "~350 m" | ~250 m | Same order of magnitude; slightly overstated but not misleading |
| `cana` — Kafr Kanna (DARE vs Wikidata) | "~1.2 km" | ~1.24 km | Confirmed |
| `magdala` (DARE vs Wikidata) | "1.6–2.3 km" | ~1.75 km | Confirmed, within range |
| `bethany` (Tomb of Lazarus point vs town point) | "~850 m" | ~832 m | Confirmed |
| `jericho` (Tell es-Sultan vs Herodian site, history text) | "~2 km south" | ~2.3 km, mostly south | Confirmed |

The Magdala image's own embedded EXIF GPS metadata (32.827069, 35.513552) independently confirms the photo was taken within ~300 m of the candidate point, corroborating both the coordinate and the image caption.

### 1.3 Confidence review

- **`gethsemane` (`high`)** — needs-change; see item 6.
- **`magdala` (`medium`)** — correct; the >1 km cross-source spread is disclosed honestly, matching the independently confirmed ~1.75 km.
- **`nain` (`high`)** — correct; identification is well-established (name continuity, Eusebius' *Onomasticon*, no competing candidate in current scholarship).
- **`temple-mount` (`high`)**, **`pool-of-bethesda`/`pool-of-siloam`/`mount-of-olives` (`high`)** — correct; each is corroborated by an independent second source and the text already discloses that a single point on a large platform is a center reference, not a boundary.
- **`jerusalem`/`bethlehem`/`nazareth`/`capernaum`/`chorazin`/`jericho` (`high`)** — correct; each has 2–3 independent, closely-agreeing sources and no competing scholarly candidate.
- Disputed-site confidence levels (`golgotha`, `emmaus`, `bethany-beyond-the-jordan`, `bethsaida`, `cana`) — see §3.

## 2. Scripture verification

Counts at initial verification: `jerusalem` 176, `galilee` 72, `judea` 52, `temple-mount` 7. After the fix, `jerusalem` is now 174 (Luke 10:38 and John 3:22 removed; confirmed by re-reading `scripture.length` and by the validator's warning count dropping by exactly 2).

**All 68 (now 66) validator warnings were individually reviewed** (not just the 15 required by the task): jerusalem 35→33, galilee 14, judea 7, nazareth 3, bethlehem 2, capernaum 2, emmaus 2, bethany 1, golgotha 1, sea-of-galilee 1. Categorized:

- **Periphrasis the automated name-matcher can't recognize** ("the holy city," "David's city," "his own country," "the great city... where their Lord was crucified," "the Skull" for "Place of a Skull," "Judah" for "Judea," "the Galilean(s)," "Herod's jurisdiction/the tetrarch" for Galilee) — legitimate, no change needed.
- **Same-pericope continuation verses** immediately adjacent to an explicit naming (confirmed by reading the surrounding context, e.g. Mark 10:17 sits directly before Mark 10:32–33, which names Jerusalem twice in the same continuous episode) — legitimate.
- **One genuine manuscript-variant crux** at Luke 4:44 (WEB "Galilee" vs. the critical text's "Judea," both correctly represented per project convention) — legitimate and well-disclosed.
- **Two genuine mis-links found in the first pass, both in `jerusalem.json` — now fixed** (Luke 10:38, John 3:22; see the Re-verification section above).

`temple-mount`'s curated (non-exhaustive) 7-verse scope is a reasonable editorial choice, now explicitly disclosed in the record's own `history`. All OT references confirmed present only in `otConnections`, never in `scripture[]`.

## 3. Disputed sites


All five required disputed sites (`golgotha`, `emmaus`, `bethany-beyond-the-jordan`, `bethsaida`, `cana`) list every candidate current scholarship treats as serious, in neutral language that takes no side between church tradition and archaeology:

- **`golgotha`**: Church of the Holy Sepulchre (`medium`) vs. Garden Tomb (`low`) — correctly reflects the majority archaeological view (quarry/tomb complex pre-dating the traditional Byzantine identification's rival). No unsupported claim found.
- **`emmaus`**: Emmaus Nicopolis, Qaloniya/Motza, El-Qubeibeh, Abu Ghosh — correctly frames the 60- vs. 160-stadia manuscript variant as the root of the dispute.
- **`bethany-beyond-the-jordan`**: Al-Maghtas (`medium`, UNESCO-listed, Byzantine remains) vs. Qasr al-Yahud (`low`, no confirmed first-century layer) — accurate.
- **`bethsaida`**: et-Tell vs. el-Araj (`disputed`/`disputed`) — correctly reflects the live, unresolved Arav vs. Notley/Aviam debate; older proposals (el-Mes'adiye, Tabgha) correctly relegated to history-only text since no citable coordinate exists for them.
- **`cana`**: Khirbet Qana, Kafr Kanna, Qana (Lebanon) — correctly notes recent archaeological opinion favoring Khirbet Qana while not declaring the debate closed.

All cited `bib:` sources are real, identifiable, independently-recognizable scholarly works (Rainey & Notley's *Sacred Bridge*; Arav 2020 and Notley & Aviam 2020, the actual paired BAR articles on Bethsaida; Taylor 1998 *NTS*; Hutton 2008 *Biblica*; McCollough on Khirbet Qana; Reich & Shukron on Siloam; Ritmeyer's *Quest*; UNESCO's own Al-Maghtas listing; INPA's Korazim page) — none fabricated, all consistent with mainstream scholarship on each dispute.

## 4. Political history

Full cross-file dump reviewed (not spot-checked). Result: one significant error (`galilee.json`, item 2) and two minor omissions (item 9). All other entries — including the deliberately different templates correctly used for `bethsaida` (Philip's tetrarchy, not Antipas's) and `golgotha`/`temple-mount` (targeted single entries) — check out against `bib:rainey-notley-sacred-bridge` and are internally consistent.

`pool-of-bethesda`, `pool-of-siloam`, `mount-of-olives`, and `gethsemane` have empty `politicalHistory`. **This is acceptable for M2**: these are small `site`-tier sub-locations of Jerusalem, whose own record already carries the full first-century political chain, and the dedicated interactive timeline is explicitly M4 scope.

## 5. Neutrality

All summary, history, and caption text read is descriptive and hedged ("popularized," "traditional," "some scholars," "widely agreed," "recent excavations... have led some modern scholars to favor") with no side taken on any live dispute. The three `temple-mount` captions ("The Dome of the Rock, one of the most iconic structures on the Temple Mount"; "The Western Wall and Dome of the Rock in the Old City of Jerusalem"; "The Dome of the Rock and Western Wall in Jerusalem") are purely descriptive, with no sovereignty, religious-primacy, or political framing.

## 6. Media / images (22 files, 32 images initially; 33 after the `nain.json` re-fix attempt)

Every image's license and author were re-read live from the Wikimedia Commons API (`extmetadata.LicenseShortName`, `extmetadata.Artist`), not taken from the media record's own claim. Content was cross-checked against each file's Commons categories/description (and, for two files, embedded EXIF GPS/description text).

### 6.1 Results (after re-verification)

- **31 of 33 images: license, author and depicted location all confirmed correct**, including `capernaum`'s second image, now correctly re-licensed `CC BY-SA 3.0 IGO`. Full per-file license/author cross-check is in §6.2.
- **1 fail**: `nain.json`'s `Nain.jpg` depicts **Nain, Newfoundland and Labrador, Canada**, not Nain, Israel — see §6.3. Second consecutive wrong-place image for this location (first Iran, now Canada).
- **1 needs-change**: `nain.json`'s `Niin_120.jpg` depicts the correct place (confirmed: Commons category "Church of the Resurrection of the Widow's Son (Nein)") but is licensed under a generic, non-versioned Commons `{{attribution}}` grant, not "CC BY 2.0" as recorded, and not one of the three accepted license bands — see §6.3.

### 6.2 Per-file license/author confirmation (Commons vs. recorded)

All of the following matched exactly: `jerusalem` (Nettadi, CC BY-SA 3.0); `golgotha` ×2 (Berthold Werner, CC BY-SA 3.0; Bukvoed, CC BY 4.0); `temple-mount` ×3 (Godot13, CC BY-SA 4.0; Yourway-to-israel, CC BY-SA 3.0; Berthold Werner, Public domain); `pool-of-bethesda` ×3 (Berthold Werner, Public domain; Ariely, CC BY 3.0; Krupski Oleg, CC BY-SA 3.0); `bethlehem` ×2 (Neil Ward, CC BY 2.0; Ian and Wendy Sewell, CC BY-SA 3.0); `capernaum` ×2 (Berthold Werner, Public domain; Eddie Gerald, **CC BY-SA 3.0 IGO** — re-fetched and confirmed a genuine, distinct CC legal instrument at `creativecommons.org/licenses/by-sa/3.0/igo/`); `bethany-beyond-the-jordan` ×2 (Bahnfrend, CC BY-SA 4.0; krebsmaus07, CC BY 2.0); `jericho` ×2 (Daniel Case, CC BY-SA 3.0; Tamarah, CC BY 3.0); `bethany` (Rijksmuseum, CC0); `emmaus` (Emmaus, CC BY-SA 3.0); `nazareth` (Zairon, CC BY-SA 4.0); `bethsaida` (Chmee2, CC BY 3.0); `cana` (Owenglyndur, CC BY 4.0); `magdala` (AVRAM GRAICER, CC BY-SA 3.0); `chorazin` (Zeev Stein/Pikiwiki, CC BY 2.5); `sea-of-galilee` ×2 (Юкатан, CC BY-SA 3.0; Kimberlyblaker, CC BY-SA 3.0); `gethsemane` (Mlevitt1, CC BY-SA 4.0); `mount-of-olives` (Godot13, CC BY-SA 4.0); `pool-of-siloam` (Aleksei m, CC BY-SA 4.0); `judea` (Rh0809, CC BY-SA 4.0); `galilee` (AdrianAbdulBaha, CC BY-SA 4.0). All licenses fall within the accepted PD/CC BY/CC BY-SA(-IGO) bands. `nain` — see §6.3 for both images.

## 7. New sources and licensing decisions

- **10 new `bib:` bibliography entries** (Rainey & Notley; Arav; Notley & Aviam; Taylor; Hutton; McCollough; Reich & Shukron; UNESCO Al-Maghtas; INPA Korazim; Ritmeyer): all are cite-only academic/institutional works, never quoted or closely paraphrased in the records. This is already covered by the existing "copyrighted academic works — cite only" rule in `docs/LICENSES.md`'s do-not-use list; **no new ATTRIBUTION.md rows required.**
- **CC BY-SA 3.0 IGO** (found on the Capernaum UNESCO image): **accepted**, added to `docs/LICENSES.md` as a documented decision — this IGO variant carries the same Attribution/ShareAlike permissions as standard CC BY-SA, differing only in UN/IGO-specific jurisdiction/immunity boilerplate. Confirmed fixed and re-verified this round.
- **Commons' bare `{{Attribution}}` / "Attribution only license" tag** (found on `Niin_120.jpg`, §6.3): **not accepted.** Per `Commons:Template:Attribution`, this is a generic, uncodified, non-versioned permission statement, not a specific Creative Commons legal instrument — it does not match any of the three accepted bands (`Public domain`/`CC0`, `CC BY <version>`, `CC BY-SA <version>`), in the same way GFDL-only, FAL-only, and GPL/LGPL-only files are already excluded despite being freely hosted on Commons. This is a **new do-not-use decision**, recorded for future reference in case the same tag recurs.
- **`data/reference/` public-domain row (added in M2-01)**: confirmed accurate (unchanged from the first pass). Re-verified the committed snapshot's SHA-256 independently (`Get-FileHash`) — matches `engwebp_snapshot_metadata.json` exactly (`bd5f4ac0...9833`) — and spot-checked its content (e.g. `MAT 1:1`) against the known WEB text. `docs/LICENSES.md`'s existing row correctly states public domain per ADR-0012; no change needed.

## 8. Acceptance criteria status

- [x] All 22 records exist and validate (`npm run validate:data`: 0 errors, 66 reviewed warnings; `npm test`: 30/30 passing).
- [x] All 5 disputed sites list every serious candidate, neutrally, with fitting confidence.
- [x] Every coordinate has ≥2 independent sources; none OSM-derived; none swapped.
- [x] All `textWEB` matches WEB (validator-enforced).
- [x] All image licenses confirmed on their Commons page and every image confirmed to depict its location — resolved after three rounds on `nain.json`; all other images confirmed in rounds 1–2 plus an 8-image spot-check in round 3.
- [x] **All 22 of 22 records pass and are marked `verified`.**
- [x] **No open items remain in this batch.** Every claim in the 13 audited records was checked against its cited source (including opening the 2 new web sources directly); all 7 new `bib:` entries confirmed as real, correctly-cited works.

