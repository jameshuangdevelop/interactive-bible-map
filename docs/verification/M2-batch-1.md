# M2 batch 1 verification report — Jerusalem, Judea and Galilee (M2-02, Phase C)

Independently verified by the Fact-Checker & Licensing agent on 2026-09-23. Coordinates were re-fetched live from Wikidata (REST API `wikibase/v1/entities/items/<id>/statements`), DARE (`imperium.ahlfeldt.se/api/geojson.php`) and Pleiades (`pleiades.stoa.org/places/<id>/json`) — not taken on trust from the Research Lead's cited values. Image licenses were re-read from the Wikimedia Commons API (`action=query&prop=imageinfo&iiprop=extmetadata`), not from the media record's own claim. Scripture claims were checked against the actual WEB verse text already embedded in each record; all 68 validator warnings were individually reviewed (not just 15 spot-checked). Nothing in this report was accepted on the Research Lead's or Media Curator's word.

**Scope:** 22 location records, 22 media files (32 images), the 10 new `bib:` bibliography entries, and the M2-01 `data/reference/` snapshot row.

## Needs-change summary (fix required before re-verification)

| # | Item | Owner | Exact change required |
|---|---|---|---|
| 1 | `data/media/nain.json` | media-curator | **Remove immediately.** The only image, `Arriving Na'in (1040189092).jpg`, is a 2005 photo tagged on Commons "2005 in Iran" by a cycle-touring photographer (sibling category "Cycling in Isfahan"). It depicts **Na'in, Isfahan Province, Iran** — an unrelated desert town on the Isfahan–Yazd road — not Nain/Nein in Galilee. Find a genuine free image of Nein, Israel, or omit media for this location per the task card's fallback rule. |
| 2 | `data/locations/galilee.json` `politicalHistory` | research-lead | Entry 2's own text reads "(4 BC – AD 39)" but its `toYear` field is `6`; entry 3 ("Roman province of Judaea," 6–41) never applied to Galilee, which stayed under Herodian client rule the whole period. Every sibling Galilee record (`nazareth`, `capernaum`, `cana`, `chorazin`, `magdala`, `nain`, `sea-of-galilee`, `bethsaida`) instead uses `-4→39` (Antipas), `39→44` (Agrippa I), `44→70` (Roman province). Apply that same template to `galilee.json` — it is currently the only Galilee-region record using the wrong (Judea) template. |
| 3 | `data/locations/jerusalem.json` `scripture[43]` (Luke 10:38) | research-lead | Text is "a certain village" — no mention of Jerusalem or any alternate name; the only identification (via John 11:1) is **Bethany**, which already has its own record in this batch. Remove this entry from `jerusalem.json`, or add a `sources` justification if a dataset genuinely ties it to Jerusalem. |
| 4 | `data/locations/jerusalem.json` `scripture[70]` (John 3:22) | research-lead | Text names "Judea," not Jerusalem; the same verse is already correctly included in `judea.json`. Remove the duplicate from `jerusalem.json` (its narrated activity — baptizing in the Judean countryside — is not set in Jerusalem itself). |
| 5 | `data/media/capernaum.json`, second image | media-curator | Commons' own license for `Sites_of_Christianity_in_the_Galillee_-_Ruins_of_the_ancient_Great_Synagogue_at_Capernaum...jpg` is **CC BY-SA 3.0 IGO** (a UNESCO-produced file — see its `CC-BY-SA-3.0-IGO` category), not plain "CC BY-SA 3.0" as recorded. Correct the `license` string. (Decision: this IGO variant is accepted under the CC BY-SA band — see `docs/LICENSES.md`.) |
| 6 | `data/locations/gethsemane.json` `confidence` | research-lead | `high` overstates certainty in the *exact* garden plot. The general area (foot of the Mount of Olives, across the Kidron from the Temple Mount) is not disputed, but at least two distinct denominational garden traditions (the Franciscan-custodied garden by the Church of All Nations, and the Russian Orthodox garden near the Church of Mary Magdalene, ~200 m apart) claim the site, and no first-century boundary of "the garden" itself is archaeologically fixed. Recommend downgrading to `medium`, or explicitly disclosing the multi-tradition caveat in `support` (as `magdala.json` already does for its own coordinate spread). |
| 7 | `data/locations/jericho.json` coordinate scope | research-lead | The candidate point is Tell es-Sultan (the Old Testament–era mound), but the record's own `history` and all six `scripture` entries concern the *Gospel-era* city, which its own text says had "shifted about two kilometers south" by the first century (cited as `wikidata:Q2460244`, never used as a candidate). Either add the Herodian/Roman-period site as a second candidate, or add a sentence to `support` explaining why the OT tell was kept as the sole representative point for a record whose content is mostly NT. |
| 8 | `data/locations/temple-mount.json` scripture scope | research-lead | The 7-entry list is a reasonable, deliberately curated sample (not every "temple" mention, of which the NT has 100+) — but this choice is disclosed only in the (uncommitted) PR body, not in the record itself. Add one sentence to `summary` or a `history` entry stating that the list is representative, not exhaustive. |
| 9 | `data/locations/bethlehem.json` and `bethany-beyond-the-jordan.json` `politicalHistory` | research-lead | Minor/optional. `bethlehem.json` has only its `-37→-4` (Herod the Great) entry, unlike every sibling Judea-group record (`bethany`, `jericho`, `emmaus`), which carries the full 5-entry chain through AD 70. `bethany-beyond-the-jordan.json` is missing the initial `-37→-4` entry that every other record (including its own Perea/Antipas-template siblings) has. Neither is factually wrong, just inconsistent; complete them for uniformity if convenient. |

**Everything else — all other content, all coordinates, all disputed-site framing, all other images, all licensing, all political-history entries not listed above — passed.**

## 1. Location records (22)

### 1.1 Verdicts

| Record | Verdict | Notes |
|---|---|---|
| `jerusalem` | **Needs-change** | Coordinate, summary, history, politicalHistory, and 173/176 scripture entries pass; see items 3–4 above. |
| `judea` | Pass → `verified` | |
| `galilee` | **Needs-change** | See item 2 above; everything else (coordinate, summary, scripture, 58/72 warning-flagged verses) passes. |
| `temple-mount` | **Needs-change** | See item 8; coordinate, candidate, summary and all 7 scripture entries pass. |
| `pool-of-bethesda` | Pass → `verified` | |
| `pool-of-siloam` | Pass → `verified` | |
| `mount-of-olives` | Pass → `verified` | |
| `gethsemane` | **Needs-change** | See item 6. |
| `golgotha` | Pass → `verified` | Disputed site — see §3. |
| `bethlehem` | **Needs-change** | See item 9 (minor). |
| `bethany` | Pass → `verified` | |
| `jericho` | **Needs-change** | See item 7. |
| `emmaus` | Pass → `verified` | Disputed site — see §3. |
| `bethany-beyond-the-jordan` | **Needs-change** | See item 9 (minor). Disputed site — see §3. |
| `nazareth` | Pass → `verified` | |
| `capernaum` | Pass → `verified` | |
| `bethsaida` | Pass → `verified` | Disputed site — see §3. |
| `cana` | Pass → `verified` | Disputed site — see §3. |
| `magdala` | Pass → `verified` | ~1.75 km Wikidata/DARE spread independently confirmed (see §2); disclosure in `support` is accurate. |
| `chorazin` | Pass → `verified` | |
| `nain` | Pass → `verified` | Identification is genuinely secure (name continuity to modern Nein, Eusebius' *Onomasticon*); `confidence: high` is justified. Its *media* file fails — see item 1. |
| `sea-of-galilee` | Pass → `verified` | |

**15 of 22 records now carry `status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-09-23"`. 7 records remain `draft` pending the fixes above; re-submit for re-verification once changed.**

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

Counts match exactly: `jerusalem` 176, `galilee` 72, `judea` 52, `temple-mount` 7.

**All 68 validator warnings were individually reviewed** (not just the 15 required by the task): jerusalem 35, galilee 14, judea 7, nazareth 3, bethlehem 2, capernaum 2, emmaus 2, bethany 1, golgotha 1, sea-of-galilee 1. Categorized:

- **Periphrasis the automated name-matcher can't recognize** ("the holy city," "David's city," "his own country," "the great city... where their Lord was crucified," "the Skull" for "Place of a Skull," "Judah" for "Judea," "the Galilean(s)," "Herod's jurisdiction/the tetrarch" for Galilee) — legitimate, no change needed.
- **Same-pericope continuation verses** immediately adjacent to an explicit naming (confirmed by reading the surrounding context, e.g. Mark 10:17 sits directly before Mark 10:32–33, which names Jerusalem twice in the same continuous episode) — legitimate.
- **One genuine manuscript-variant crux** at Luke 4:44 (WEB "Galilee" vs. the critical text's "Judea," both correctly represented per project convention) — legitimate and well-disclosed.
- **Two genuine mis-links**, both in `jerusalem.json` — see needs-change items 3–4. These are not periphrasis or continuation; the verses' own identifiable place is a different location entirely.

`temple-mount`'s curated (non-exhaustive) 7-verse scope is a reasonable editorial choice — see item 8 for the one documentation gap. All OT references confirmed present only in `otConnections`, never in `scripture[]`.

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

## 6. Media / images (22 files, 32 images)

Every image's license and author were re-read live from the Wikimedia Commons API (`extmetadata.LicenseShortName`, `extmetadata.Artist`), not taken from the media record's own claim. Content was cross-checked against each file's Commons categories/description (and, for one file, embedded EXIF GPS).

### 6.1 Results

- **31 of 32 images: license, author and depicted location all confirmed correct.** Full per-file license/author cross-check is in §6.2.
- **1 needs-change**: `capernaum.json`'s second image is recorded as "CC BY-SA 3.0" but Commons' own page shows **CC BY-SA 3.0 IGO** (a UNESCO-produced file) — see needs-change item 5. Author and depicted content (Capernaum's Byzantine-era synagogue ruins) are correct.
- **1 fail**: `nain.json`'s only image depicts **Na'in, Iran**, not Nain, Israel — see needs-change item 1. This is exactly the "picture of the wrong place" failure mode the task warned about from an earlier batch.

### 6.2 Per-file license/author confirmation (Commons vs. recorded)

All of the following matched exactly: `jerusalem` (Nettadi, CC BY-SA 3.0); `golgotha` ×2 (Berthold Werner, CC BY-SA 3.0; Bukvoed, CC BY 4.0); `temple-mount` ×3 (Godot13, CC BY-SA 4.0; Yourway-to-israel, CC BY-SA 3.0; Berthold Werner, Public domain); `pool-of-bethesda` ×3 (Berthold Werner, Public domain; Ariely, CC BY 3.0; Krupski Oleg, CC BY-SA 3.0); `bethlehem` ×2 (Neil Ward, CC BY 2.0; Ian and Wendy Sewell, CC BY-SA 3.0); `capernaum` image 1 (Berthold Werner, Public domain); `bethany-beyond-the-jordan` ×2 (Bahnfrend, CC BY-SA 4.0; krebsmaus07, CC BY 2.0); `jericho` ×2 (Daniel Case, CC BY-SA 3.0; Tamarah, CC BY 3.0); `bethany` (Rijksmuseum, CC0); `emmaus` (Emmaus, CC BY-SA 3.0); `nazareth` (Zairon, CC BY-SA 4.0); `bethsaida` (Chmee2, CC BY 3.0); `cana` (Owenglyndur, CC BY 4.0); `magdala` (AVRAM GRAICER, CC BY-SA 3.0); `chorazin` (Zeev Stein/Pikiwiki, CC BY 2.5); `sea-of-galilee` ×2 (Юкатан, CC BY-SA 3.0; Kimberlyblaker, CC BY-SA 3.0); `gethsemane` (Mlevitt1, CC BY-SA 4.0); `mount-of-olives` (Godot13, CC BY-SA 4.0); `pool-of-siloam` (Aleksei m, CC BY-SA 4.0); `judea` (Rh0809, CC BY-SA 4.0); `galilee` (AdrianAbdulBaha, CC BY-SA 4.0). All licenses fall within the accepted PD/CC BY/CC BY-SA bands. `nain` (Peter Dunning, CC BY 2.0 — license itself is fine; the image is the wrong place, see item 1). `capernaum` image 2 (Eddie Gerald, license mismatch — see item 5).

## 7. New sources and licensing decisions

- **10 new `bib:` bibliography entries** (Rainey & Notley; Arav; Notley & Aviam; Taylor; Hutton; McCollough; Reich & Shukron; UNESCO Al-Maghtas; INPA Korazim; Ritmeyer): all are cite-only academic/institutional works, never quoted or closely paraphrased in the records. This is already covered by the existing "copyrighted academic works — cite only" rule in `docs/LICENSES.md`'s do-not-use list; **no new ATTRIBUTION.md rows required.**
- **CC BY-SA 3.0 IGO** (found on one Commons image, §6.1): **accepted**, added to `docs/LICENSES.md` as a documented decision — this IGO variant carries the same Attribution/ShareAlike permissions as standard CC BY-SA, differing only in UN/IGO-specific jurisdiction/immunity boilerplate. The Media Curator must still record the exact variant string, not the plain version number (item 5).
- **`data/reference/` public-domain row (added in M2-01)**: confirmed accurate. Re-verified the committed snapshot's SHA-256 independently (`Get-FileHash`) — matches `engwebp_snapshot_metadata.json` exactly (`bd5f4ac0...9833`) — and spot-checked its content (e.g. `MAT 1:1`) against the known WEB text. `docs/LICENSES.md`'s existing row correctly states public domain per ADR-0012; no change needed.

## 8. Acceptance criteria status

- [x] All 22 records exist and validate (`npm run validate:data`: 0 errors, 68 reviewed warnings; `npm test`: 24/24 passing).
- [x] All 5 disputed sites list every serious candidate, neutrally, with fitting confidence.
- [x] Every coordinate has ≥2 independent sources; none OSM-derived; none swapped.
- [x] All `textWEB` matches WEB (validator-enforced).
- [ ] All image licenses confirmed on their Commons page — 31/32 confirmed correct; 1 needs a corrected license string (item 5); 1 needs removal for depicting the wrong place (item 1).
- [ ] 7 of 22 records need the fixes listed above before they can be marked `verified`; 15 are done.
