# M2 batch 2 verification — Samaria, Acts and Pauline cities

Independent Phase C review of `data/locations/*.json` (21 records), `data/media/*.json` (21 files, 48 images) and the two new `data/bibliography.json` entries added in `data/m2-batch-2`. Verified against primary sources directly (Wikidata entity JSON, Pleiades bulk JSON where the live site's Anubis challenge allowed it, DARE, and the cited article), not on the Research Lead's or Media Curator's word. Reviewed 2026-09-23; re-verified 2026-09-23 after fix commits `90c5069` and `97456e3` (see "Re-verification" below). The needs-change table and verdicts below reflect the **final, re-verified state**; the original (superseded) findings are kept in "Re-verification" for the record.

## Needs-change summary (fix and owner) — as of the original review

The nine items below were found in the original review. All nine are now fixed (`90c5069`, `97456e3`) and re-verified as resolved; see "Re-verification." This table is kept for traceability and is no longer actionable.

| # | Item | Owner | Exact change required |
|---|---|---|---|
| 1 | `data/locations/sychar.json` — Askar candidate | research-lead | Replace `coordinateSource`/`sources` use of `bib:daahl-askar-site`. DAAHL's license could not be confirmed (site unreachable, no open license found — see Licensing section) and no second independent, non-OSM source corroborates the Askar coordinate to within normal precision (the nearest confirmed Wikidata point, the Askar refugee camp, sits ~800 m away and describes a different feature). Cite DAAHL only as a pointer if its license is later confirmed; do not use it as `coordinateSource`. |
| 2 | `data/media/antioch-syria.json` — `Flag_of_Antioque.png` | media-curator | Remove. The file's own Commons wikitext description is `{{es\|1=afdgd}}` (gibberish) with no evidence tying it to Antioch on the Orontes; its "Antioch" category appears to be a mistagging (the flag itself, red/green with a white crescent and star, matches neither the Hatay State flag (red/white) nor any confirmed Antioch/Antakya emblem). Does not reliably show this location. |
| 3 | `data/media/antioch-syria.json` — `Cameo_Julian_the_Apostate_Inv312a_CdM_Paris.jpg` | media-curator | Remove or replace. It is a portrait cameo of a person (Julian the Apostate), not a depiction of the city; fails "the image actually shows this location," the same standard already applied to reject artifact/portrait images elsewhere in this batch. |
| 4 | `data/media/caesarea-maritima.json` — `11th_Century_(Fatimid_Period)_jewelry_...jpg` | media-curator | Replace with a genuine site/harbor photograph. It is a jewelry-exhibit artifact photo, not the location; the Media Curator's own PR notes rejected comparable artifact photos for Rome ("tools, jewelry... not showing the ancient city itself") but this one was kept for Caesarea Maritima — apply the same standard. |
| 5 | `data/media/colossae.json` — `Archippus_and_Philemon_(Menologion_of_Basil_II).jpg` | media-curator | Remove or replace. Confirmed by direct image inspection: a Byzantine manuscript portrait/narrative icon of two named people, not the town or its mound. |
| 6 | `data/media/colossae.json` — `C+B-Galatia-Map.JPG` caption | media-curator | Fix caption. Confirmed by direct image inspection the file is titled "Asia Minor, with the political divisions about 50 A.D." — a whole-Asia-Minor map (Galatia is only one shaded region among Asia, Cappadocia, Pontus, Lycia, etc.), not a "map of the Galatia region." Colossae itself sits in Phrygia, outside the shaded Galatia-province area. Reword to something like "Map of Asia Minor, c. 50 AD, showing Colossae among the region's cities" so it doesn't misstate the map's scope or Colossae's province. |
| 7 | `data/media/iconium.json` — both images | media-curator | Both images are Konya Archaeological Museum artifact photos; no site or cityscape image is present for Iconium. Ancient Iconium is built over by modern Konya, so this may be defensible, but it does not meet "the image actually shows this location" as applied elsewhere. Add a genuine site or modern-Konya cityscape image if one can be freely licensed, or bring to the PO/CP2 decision (per the M2-02 rule for locations without a suitable free image) rather than leaving artifact-only images uncontested. |
| 8 | `data/media/philippi.json` — `Ancient_Philippi.jpg` author | media-curator | Correct `"author": "Unknown"` to `"author": "MrPanyGoff"` (confirmed via the Commons API `extmetadata.Artist` field). |
| 9 | `data/media/thessalonica.json` — `Thessaloniki_Ancient_Agora_(1).jpg` author | media-curator | Correct `"author": "Unknown"` to `"author": "Armineaghayan"` (confirmed via the Commons API `extmetadata.Artist` field). |

No fail verdicts; all nine issues above were needs-change and are now resolved (see "Re-verification").

## Licensing decisions (new sources)

- **DAAHL (Digital Archaeological Atlas of the Holy Land, UC San Diego)** — **rejected, not yet usable.** `daahl.ucsd.edu` does not currently resolve (confirmed by direct DNS lookup and repeated HTTP attempts, 2026-09-23); the most recent Wayback Machine capture of its "About"/Home pages describes only its research program, with no terms-of-use, copyright, or license statement found live or archived. Independent web search corroborates only a vague "educational and research purposes" framing with an implied permission requirement for reproduction — the same unconfirmed status this project already assigns to Perseus Digital Library. Added to `docs/LICENSES.md`'s source-compatibility table and do-not-use list, and to `ATTRIBUTION.md` as "not used — license unconfirmed," so the decision and reasoning are recorded rather than silently dropped. `sychar`'s Askar candidate must not cite `bib:daahl-askar-site` as its `coordinateSource` until this changes (see needs-change #1).
- **Wagner & Wilson, "Why Derbe?" (Tyndale Bulletin, 2019)** — a copyrighted journal article, correctly used cite-only (as a `bib:` entry, never quoted or closely paraphrased). No `ATTRIBUTION.md` row is needed — consistent with how the project already treats copyrighted academic works (cite-only, per the existing do-not-use rule) rather than as a licensed "upstream source." Independently confirmed via web search that its core claims (the 1956 M. Ballance inscription at Kerti Höyük, the Devri Şehri alternative, and Güdelisin's re-identification as Kodylessos rather than Derbe) are accurately represented in `derbe.json`.
- **`data/reference/` public-domain row (added M2-01)** — confirmed present and unchanged in `docs/LICENSES.md` ("Public domain source text (WEB `engwebp`) plus non-creative integrity metadata"); still accurate and requires no update from this batch.

## Coordinates

Spot-checked directly against Wikidata entity JSON and, where the Anubis anti-bot page allowed it, Pleiades bulk JSON/AI-assisted retrieval of the Pleiades place-resource text (per `docs/research/SOURCES.md`'s note that the live site blocks automated fetches):

- `sychar` Shechem candidate: recorded `[35.281944, 32.213611]` matches Wikidata `Q7951237` exactly (`35.28194444, 32.21361111`); `Q7697383` gives `35.281993, 32.213618`, ~5 m away — normal variance between two Wikidata items for the same site. Pass.
- `sychar` Askar candidate: recorded `[35.28897, 32.21776]` (DAAHL) vs. Wikidata `Q4302319` (Askar refugee camp) `35.29744, 32.21986`, ~800 m away — too far apart to treat as the same point, and no other independent source was found for the village itself. See needs-change #1.
- `derbe` Kerti Höyük candidate: recorded `[33.361453, 37.348569]` matches Wikidata `Q20717624` exactly. Pass.
- `samaria` region point: recorded `[35.190436, 32.276529]` vs. Wikidata `Q1294629` `35.19, 32.275` — ~170 m apart, consistent with "closely agrees" as stated. Pass.
- All other candidates' `[lon, lat]` order and magnitudes were checked for plausibility against their real-world locations (e.g. Rome `12.49, 41.89`; Damascus `36.31, 33.51`; Ephesus `27.34, 37.94`); none show signs of a lon/lat swap, and none cite an `osm:` or `wikipedia:` `coordinateSource` (also enforced by `npm test`'s dedicated cases, which pass).
- No candidate's `coordinateSource` is missing from its own `sources[]` array (validator-enforced, confirmed).

## Claims support (most important check)

Confirmed the following specific claims are actually stated by their cited sources (not merely true), using Wikidata's structured claims (`P1376` "capital of") and the Pleiades place-resource text itself:

- Corinth "capital of the Roman province of Achaia" — Pleiades 570182's own description states this directly. Pass (Wikidata's `P1376` claim only names the modern "Corinthia" unit, so Pleiades is the operative citation here).
- Caesarea Maritima "administrative center of Roman Judea" — Wikidata `Q319242` carries an explicit `P1376` "capital of Judaea" claim. Pass.
- Tarsus "capital of Roman Cilicia" — Pleiades 648789's description states this directly (Wikidata's `P1376` claim names the earlier "Cilicia Satrapy," a weaker match, but Pleiades supports the claim as written). Pass.
- Thessalonica "capital of the Roman province of Macedonia" — Pleiades 491741's description states this directly. Pass.
- Ephesus "leading city of the Roman province of Asia" — Pleiades 599612's description states this directly. Pass.
- Antioch on the Orontes "one of the largest cities of the ancient Mediterranean" and its 300 BC Seleucus I Nicator founding — both stated directly in Pleiades 658381's description. Pass.
- Paphos "Roman capital of the province of Cyprus" — Pleiades 707586's description confirms Nea Paphos was the seat of the Roman proconsul from 58 BC. Pass.
- `derbe`'s disputed-site treatment (1956 Ballance inscription at Kerti Höyük; Devri Şehri as the IVP Atlas's alternative; Güdelisin re-identified as Kodylessos rather than Derbe) — independently confirmed accurate against secondary reporting on Wagner & Wilson 2019 and Ballance 1957. The omission of Güdelisin as a third candidate is justified: current scholarship ties that mound to a different ancient site, so listing it as a Derbe candidate would misstate the evidence.
- `sychar`'s two-candidate treatment (Askar vs. Shechem/Tell Balata) is neutral and each candidate's identification claim is attributable to OpenBible.info/Wikidata as cited — the problem is solely the Askar coordinate's sourcing (see needs-change #1), not the neutrality or the identification claim itself.

No unsupported "capital of X" or similar overreaching claims were found beyond what's listed above; softer claims (e.g., Iconium "later administratively linked with Galatia," Colossae "overshadowed... by Laodicea and Hierapolis") are hedged appropriately and match Wikidata/Pleiades content.

## Scripture

`npm run validate:data` reports 0 errors, 29 warnings (unchanged after this review). Checked every flagged verse individually: all 29 are legitimate — either a demonym the location-name matcher can't see as a substring (e.g. "Athenians," "Thessalonians," "the Ephesian," "Samaritans") or a narrative continuation via pronoun/context in a passage clearly set at the location (e.g. Acts 11:29, 14:27, 18:23, 23:32, 24:1, 25:24, 28:30, Romans 15:24, 2 Cor 10:14). None are mislinked. Spot-checked completeness for Ephesus, Caesarea Maritima, Antioch on the Orontes, and Rome (the four longest NT reference lists) against a full read of the source chapters; no missing NT mentions were found. OT references appear only in `otConnections`, as required.

## Disputed sites

- **`sychar`**: both serious candidates (Askar, Shechem/Tell Balata) are present, confidence (`medium`/`medium`) fits the genuinely split modern scholarship, and wording is neutral. Askar's coordinate sourcing needs the fix above.
- **`derbe`**: both serious candidates (Kerti Höyük `high`, Devri Şehri `low`) are present with confidence levels that match the evidence (Kerti Höyük has the epigraphic find and is the modern consensus; Devri Şehri is a documented minority/older-literature position). Wording is neutral, takes no side beyond what the evidence supports, and the Güdelisin omission is justified (see Claims support).

## Images

48 images across 21 media files (matches the file counts referenced in the task card; the PR body's "50" total appears to be a copy-paste miscount from an earlier draft, not a real discrepancy in the committed files).

- **Berea**: specifically re-checked per the task's known prior issue (Berea, Ohio photos). All three images (`Veria_BW...`, `Beroia_Archaelogical_Museum.jpg`) are confirmed Veria/Beroia, Greece. Pass.
- **License accuracy**: queried the Commons API (`imageinfo`/`extmetadata`) for all 48 files. All recorded `license` values match Commons' `LicenseShortName` exactly, except `Agaven_Antikes_Korinth.jpg` (Corinth), whose Commons page reports "CC BY-SA 2.0 DE" (the German-ported instrument); recording it as "CC BY-SA 2.0" is the schema-mandated simplification (`media.schema.json`'s `license` pattern has no jurisdiction suffix) and is materially equivalent for compatibility purposes, so this is not a needs-change.
- **Author accuracy**: two files record `"author": "Unknown"` where Commons' own `extmetadata.Artist` names a real uploader — see needs-change #8 and #9.
- **Subject accuracy ("shows this location")**: see needs-change #2–#7. All other images were confirmed by title, Commons categories, and (for the six flagged and three other ambiguous cases) direct visual inspection of the downloaded file to depict the correct real-world location or, for historical/narrative artwork, a scene explicitly set at that location (e.g. `Fall_of_Antioch_in_969.png`, a Madrid Skylitzes miniature of the city's siege; `Saint_Paul_at_Lystra_MET_DP820060.jpg`, a genre painting of the Acts 14 scene at Lystra) — accepted on the same basis, distinct from portrait/artifact images of a person or object with no depiction of the place itself.
- **Neutrality**: all captions read as neutral, factual descriptions; none take a side on disputed identifications or make unsupported claims.

## politicalHistory

Empty in all 21 records. **Acceptable for M2.** The task brief scopes the province/administrative timeline to M4, and several sites carry well-known Roman administrative statuses (e.g., Antioch in Pisidia and Iconium as coloniae, Corinth as capital of Achaia, Caesarea Maritima as the Judean prefect/procurator's seat) that could support entries — but pinning precise, cross-checked start/end years for each without further dedicated research would risk guessing at the dates the schema requires (integers, BC negative, no year 0). Leaving `politicalHistory` empty rather than guessing is the correct call for this milestone; this is not a needs-change.

## Verdicts (final, after re-verification)

### Location records (21) — `data/locations/`
All 21 pass. All 21 are `status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-09-23"`: `samaria`, `sychar`, `caesarea-philippi`, `caesarea-maritima`, `joppa`, `damascus`, `antioch-syria`, `tarsus`, `paphos`, `antioch-pisidia`, `iconium`, `lystra`, `derbe`, `philippi`, `thessalonica`, `berea`, `athens`, `corinth`, `ephesus`, `colossae`, `rome`.

### Media records (21) — `data/media/`
All 21 pass. The 6 originally needs-change (`caesarea-maritima`, `antioch-syria`, `colossae`, `iconium`, `philippi`, `thessalonica`) are now resolved and pass on re-verification (see "Re-verification" above; media files carry no `status` field, so none are marked).

### Images (48 total)
All 48 pass. The 9 originally needs-change (2 on `antioch-syria`, 1 on `caesarea-maritima`, 2 on `colossae`, 2 on `iconium`, 1 author fix each on `philippi` and `thessalonica`) are resolved: the 7 image swaps were independently re-confirmed (license, author, and — for the two most consequential swaps — direct visual inspection) to show the correct location, and the 2 author corrections match the Commons API exactly.

## Re-verification (2026-09-23, after `90c5069` and `97456e3`)

**`sychar` (research-lead, `90c5069`).** The Askar candidate and its `bib:daahl-askar-site` citation are removed entirely, from both the location record and `data/bibliography.json`; no dangling `daahl` reference remains anywhere in `data/` (checked). `names.modern` now reads "Tell Balata (Nablus, West Bank)" only. The remaining Shechem/Tell Balata candidate's `support` text now explicitly names Askar as a proposed modern equivalent and states plainly why it isn't mapped (no confirmable non-OSM, non-Wikipedia coordinate). A new `history` entry repeats this reasoning and notes the nearest confirmed independent point (the Askar refugee camp, Wikidata `Q4302319`) sits ~800 m away and describes a different feature — consistent with this Fact-Checker's own original measurement. The `summary` still names Askar as part of the scholarly debate, so the record does not silently drop a serious candidate; it explains the gap. **Judgment: this is neutral and complete.** Askar remains a real, named position in Sychar scholarship and is disclosed in prose; only its map-quality coordinate is missing, and that absence is honestly attributed to a sourcing gap rather than hidden or guessed. This is the correct call given the constraint (no acceptable license/second-source), not a defect. **Verdict: pass.** `status` set to `verified` (`verifiedBy: fact-checker`, `lastReviewed: 2026-09-23`).

**Media fixes (media-curator, `97456e3`).** Confirmed via the Commons API (`imageinfo`/`extmetadata`) and, for the two most consequential replacements, direct visual inspection of the downloaded file:

- `antioch-syria`: `Cameo_Julian_the_Apostate...` and `Flag_of_Antioque.png` replaced with `Antakya_-_2011-04-10.jpg` (Maarten Sepp, CC BY-SA 4.0 — matches Commons exactly) and `Antioch_Saint_Pierre_Church_Front.JPG` (Volkan Hatem, CC BY 2.5 — matches Commons exactly). Visually confirmed the first is a genuine cityscape of Antakya; the second (by title/category) is the Cave Church of St. Peter, a well-attested historic site in Antakya traditionally linked to the earliest Antiochene church. Both now show the location. **Pass.**
- `caesarea-maritima`: the Fatimid jewelry photo replaced with `Ancient_Roman_aqueduct_in_Caesarea_Maritima_DSC05202.JPG` (Lior Golgher, CC BY-SA 3.0 — matches Commons; the record drops the Hebrew half of the bilingual Commons byline, which is an acceptable simplification, not a misattribution). Title and category confirm it depicts the Caesarea Maritima aqueduct ruins directly. **Pass.**
- `colossae`: the Archippus/Philemon icon removed; `Colossae'den_Honaz_görünüm.jpg` added (Gülhan Nurhan, CC BY-SA 4.0 — matches Commons). Visually confirmed: a photo taken from the Colossae mound itself looking toward Honaz, showing the unexcavated site (a grass field) with Mount Honaz behind — accurately captioned and genuinely depicts the location. The Galatia-map caption is corrected to "Map of Asia Minor c. 50 AD, showing Colossae and surrounding ancient regions," which no longer misstates the map as a Galatia-only map or misplaces Colossae inside Galatia. **Pass** (both images and the caption fix).
- `iconium`: both Konya Archaeological Museum artifact photos replaced with `Konya_view_from_Seljuk_Tower_3998.jpg` (Dosseman, CC BY-SA 4.0 — matches Commons) and `Alâeddin_hill,_Konya.jpg` (CC BY-SA 3.0 — matches Commons; Commons itself records no machine-readable author, so the record's `"author": "Unknown"` is accurate here, unlike the earlier misattributions). Both are genuine views of modern Konya/the Alaeddin Hill citadel mound, the historic core of ancient Iconium — a reasonable, defensible way to depict a site with no visible ancient ruins. **Pass**, and this resolves the earlier concern about artifact-only imagery.
- `philippi`: `Ancient_Philippi.jpg` author corrected from "Unknown" to "MrPanyGoff," matching the Commons API exactly. **Pass.**
- `thessalonica`: `Thessaloniki_Ancient_Agora_(1).jpg` author corrected from "Unknown" to "Armineaghayan," matching the Commons API exactly. **Pass.**

No new issues were introduced by any of the fixes; every replacement image's license and author were independently re-confirmed against the Commons API rather than taken on trust, and every one now passes the "shows this location" test.

## Validation (re-run after fixes)

`npm run validate:data`: 0 errors, 29 warnings — identical set to the original review (`sychar`'s scripture list is unchanged, so no new warnings were introduced by the candidate/bibliography edit). `npm test`: 24/24 passing.

## Remaining work

None. All 21 location records and all 21 media files (48 images) now pass; no items are outstanding or deferred.


