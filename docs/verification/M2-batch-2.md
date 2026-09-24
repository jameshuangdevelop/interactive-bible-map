# M2 batch 2 verification — Samaria, Acts and Pauline cities

Independent Phase C review of `data/locations/*.json` (21 records), `data/media/*.json` (21 files, 48 images) and the two new `data/bibliography.json` entries added in `data/m2-batch-2`. Verified against primary sources directly (Wikidata entity JSON, Pleiades bulk JSON where the live site's Anubis challenge allowed it, DARE, and the cited article), not on the Research Lead's or Media Curator's word. Reviewed 2026-09-23; re-verified 2026-09-23 after fix commits `90c5069` and `97456e3` (see "Re-verification"); re-verified again 2026-09-23 after the claims-audit commits `21432ac` and `36ab5b7` (see "Re-verification 2" — **current state**). The needs-change table and verdicts below reflect the state as of "Re-verification"; "Re-verification 2" supersedes them with the current, final findings.

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

## Verdicts (superseded — see "Re-verification 2" for the current, final state)

### Location records (21) — `data/locations/`
All 21 pass. All 21 are `status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-09-23"`: `samaria`, `sychar`, `caesarea-philippi`, `caesarea-maritima`, `joppa`, `damascus`, `antioch-syria`, `tarsus`, `paphos`, `antioch-pisidia`, `iconium`, `lystra`, `derbe`, `philippi`, `thessalonica`, `berea`, `athens`, `corinth`, `ephesus`, `colossae`, `rome`.

*(This verdict was current as of "Re-verification" above. The PR Reviewer subsequently found unsupported claims in several of these records — see "Re-verification 2" for the claims-audit findings and the final, current verdict.)*

### Media records (21) — `data/media/`
All 21 pass. The 6 originally needs-change (`caesarea-maritima`, `antioch-syria`, `colossae`, `iconium`, `philippi`, `thessalonica`) are now resolved and pass on re-verification (see "Re-verification" above; media files carry no `status` field, so none are marked).

### Images (48 total)
All 48 pass. The 9 originally needs-change (2 on `antioch-syria`, 1 on `caesarea-maritima`, 2 on `colossae`, 2 on `iconium`, 1 author fix each on `philippi` and `thessalonica`) are resolved: the 7 image swaps were independently re-confirmed (license, author, and — for the two most consequential swaps — direct visual inspection) to show the correct location, and the 2 author corrections match the Commons API exactly.

*(This image verdict was also current only as of "Re-verification." "Re-verification 2" found one new caption error — see below — so the current count is 47 of 48 passing.)*

## Verdicts 2 (current, final — after "Re-verification 2")

### Location records (21) — `data/locations/`
All 21 pass and are `status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-09-23"`. 15 were re-audited for claim support and re-verified in this round (`antioch-pisidia`, `antioch-syria`, `athens`, `caesarea-maritima`, `caesarea-philippi`, `colossae`, `corinth`, `damascus`, `derbe`, `ephesus`, `paphos`, `philippi`, `samaria`, `tarsus`, `thessalonica`); 6 were unaffected by the audit and remain verified from the prior round (`sychar`, `joppa`, `iconium`, `lystra`, `berea`, `rome`).

### Media records (21) — `data/media/`
All 21 pass.

### Images (48 total)
47 pass; 1 needs-change: the `Agaven_Antikes_Korinth.jpg` caption on `corinth` (owner: media-curator — see "Re-verification 2").

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

## Re-verification 2 (2026-09-23, after `21432ac` and `36ab5b7`)

Triggered by the PR Reviewer (GPT-5.4) finding that `corinth`'s summary claimed "capital of Roman Achaia" and "major commercial center" without a cited source stating either. The PO had the Research Lead audit **every text claim in every record** against its cited sources, applying the strict test: is the clause actually stated by at least one cited source, not merely true? 15 of 21 location records needed changes and were reset to `status: "draft"`; the schema was also rebased onto a commit accepting jurisdiction-ported CC licenses (e.g. `CC BY-SA 2.0 de`, `CC BY 3.0 nl`), and the Media Curator re-checked all 48 images' license strings against the Commons API.

### Location records — clause-by-clause re-check

Independently re-checked every changed clause in all 15 draft records against Wikidata entity JSON, Pleiades' own place-resource text (via targeted search since the live site's Anubis challenge still blocks direct fetches — consistent with `docs/research/SOURCES.md`), the WEB text already in each record's `scripture[]`, and (for `corinth`) the new `bib:worldhistory-corinth` source directly:

- **`corinth`** (the record that triggered the audit): the unsupported "capital of the Roman province of Achaia" and unqualified "major commercial center" clauses are replaced. Fetched `https://www.worldhistory.org/corinth/` directly and confirmed, verbatim: *"A brighter period returned to the city when Julius Caesar founded his colony at the site in 44 BCE... The city was once more flourishing by the 1st century CE and became an important administrative and trade centre."* The record's new text — "after Julius Caesar refounded it as a Roman colony in 44 BC it became, per World History Encyclopedia, 'an important administrative and trade centre'" — is an exact, correctly attributed quotation. **Pass.**
  - **World History Encyclopedia as a source**: judged **acceptable** as a `bib:` cite-only source for this kind of narrative-synthesis clause. It is a named-author (Mark Cartwright), editorially reviewed general reference (distinct from Wikipedia's open-editing model, which the brief already excludes from being copied), the record quotes it verbatim in quotation marks with clear attribution rather than presenting it as the project's own synthesis, and it is not used for coordinates or bulk data extraction. Treated the same as the existing `bib:wagner-wilson-why-derbe` citation: no new `ATTRIBUTION.md`/`LICENSES.md` row is needed, consistent with how the project already treats cite-only academic/reference works.
- **`antioch-pisidia`**: "Col. Caesarea" is confirmed as Pleiades' own recorded alternate name — the resource's canonical title is literally "Antiochia/Col. Caesarea: a Pleiades place resource." **Pass.**
- **`antioch-syria`**: "one of the four cities of the Seleucid Syrian Tetrapolis" is corroborated by sources citing the Pleiades 658381 resource page for this specific fact alongside its own description of the founding and later Theoupolis renaming. **Pass.**
- **`athens`**: "a major Greek city-state and the principal city of Attika" is an exact quotation from the Pleiades 579885 resource. **Pass.**
- **`caesarea-maritima`**: the uncited "twelve-year building program" detail is removed; the remaining text is unaffected and still passes. **Pass.**
- **`caesarea-philippi`**: the uncited Philip-the-Tetrarch-renaming/Pan-shrine narrative history entry is removed; the replacement support/summary text (two names given together, southwest foot of Mount Hermon) is confirmed directly against the Pleiades 678324 resource, whose title is "Paneas/Caesarea Philippi." **Pass.**
- **`colossae`**: "an ancient city of Phrygia" is an exact quotation from Wikidata `Q1001370`'s description. **Pass.**
- **`damascus`**: the new `Isaiah 7:8` otConnection quotes WEB text stating directly "the head of Syria is Damascus" — confirmed against the WEB text already used elsewhere in the project; the reworded Amos 1:3 note ("threshing Gilead 'with instruments of iron'") matches Amos 1:3's WEB wording exactly, replacing the earlier unsupported "capital of Aram" inference. **Pass.**
- **`derbe`**: the reworded support clause attributes the "GPS coordinates in an atlas of the Roman world" detail explicitly to "(per the cited article)" rather than asserting it as independently confirmed; secondary reporting on Wagner & Wilson 2019 corroborates that the article discusses exactly this atlas-coordinate question for Kerti Höyük. Appropriately hedged. **Pass.**
- **`ephesus`**: "the most important ancient metropolis of Ionian Asia Minor" is an exact quotation from the Pleiades 599612 resource; the Artemis "temple keeper" clause quotes Acts 19:35, already in the record's own `scripture[]`. **Pass.**
- **`paphos`**: the unsupported "Roman capital of the province of Cyprus" claim is removed; "has been a center of activity since the Final Bronze Age" is an exact quotation from the Pleiades 707586 resource. **Pass.**
- **`philippi`**: the uncited "refounded as a colony after the battle fought nearby in 42 BC" clause is removed; the replacement quotes Acts 16:12 calling Philippi "a Roman colony" (verbatim, already in `scripture[]`). **Pass.**
- **`samaria`**: "conquered by the Assyrian king Shalmaneser V, probably in 722 BC... reorganized into an Assyrian province" matches the Pleiades 44836840 resource's own account closely. **Pass.**
- **`tarsus`**: the unsupported "capital of Roman Cilicia" claim is removed; "an important city and river port on the Cydnus river located in Cilicia Pedias" is confirmed against the Pleiades 648789 resource. **Pass.**
- **`thessalonica`**: "capital of the Roman province of Macedonia" remains sourced to Wikidata `Q17151`, whose own `P1376` ("capital of") claims include Macedonia (confirmed directly via the Wikidata API in the original review); "an important center of the Roman and Late Antique worlds" is an exact quotation from the Pleiades 491741 resource. **Pass.**

All 15 pass. `status` set to `verified` (`verifiedBy: fact-checker`, `lastReviewed: 2026-09-23`) on all 15.

**Spot-checked one unchanged record for the same risk pattern**: `lystra`'s "Roman colony" claim (not touched by this audit) is independently confirmed — Pleiades' own title for resource 648699 is "Lystra/Col. Iulia Felix Gemina," directly recording the colony name. No issue found; the five other unchanged records (`berea`, `iconium`, `joppa`, `lystra`, `rome`) were in scope only for the draft records per this round's instructions, and their claims are lower-risk (direct scripture paraphrase or self-evident facts), so a full re-audit of all six was not repeated here.

### Media — 10-image spot-check (license, `licenseUrl`, author, and subject)

Independently re-queried the Commons API (`imageinfo`/`extmetadata`) for all 10 files touched by `36ab5b7` and confirmed every `license`, `licenseUrl`, and `author` value matches exactly, including the schema's new jurisdiction-port support:

| File | License | `licenseUrl` | Author |
|---|---|---|---|
| `Agaven_Antikes_Korinth.jpg` (corinth) | `CC BY-SA 2.0 de` ✓ | matches ✓ | "Michael J. Zirbes" ✓ |
| `Alâeddin_hill,_Konya.jpg` (iconium) | `CC BY-SA 3.0` ✓ | matches ✓ (http, not https — now correct) | "Unknown" ✓ (Commons itself has no machine-readable author) |
| `Ancient_Roman_aqueduct_in_Caesarea_Maritima...jpg` | `CC BY-SA 3.0` ✓ | matches ✓ | "Lior Golgher • ליאור גולגר" ✓ (full bilingual byline) |
| `C+B-Galatia-Map.JPG` (colossae) | `Public domain` ✓ | — | "no idea - see source" ✓ (verbatim from Commons) |
| `Umayyad_Mosque,_Damascus.jpg` | `CC BY-SA 3.0` ✓ | matches ✓ | "Bernard Gagnon" ✓ |
| `Damascus,_Syria,_Panoramic_view...jpg` | `CC BY 4.0` ✓ | matches ✓ | "Vyacheslav Argenberg" ✓ |
| `DAVIS(1879)_p329_SITE_OF_DERBE...jpg` | `Public domain` ✓ | — | "Unknown" ✓ (Commons Artist field is empty) |
| `Terrace_Houses_of_Ephesus...jpg` | `CC BY-SA 2.0` ✓ | matches ✓ | "Warren LeMay from Chicago, IL, United States" ✓ (full byline) |
| `100353_jaffa_-_bosphorus_street...jpg` (joppa) | `Public domain` ✓ | — | "Unknown authorUnknown author" ✓ (verbatim Commons quirk) |
| `Saint_Paul's_Church,_Tarsus_02.jpg` | `CC BY-SA 4.0` ✓ | matches ✓ | "Jordi Gili" ✓ |

All 10 pass on license/author/URL accuracy.

**Subject check, including the Corinth agave image specifically requested**: downloaded and visually inspected `Agaven_Antikes_Korinth.jpg`. It shows large agave plants (not an ancient Mediterranean species — agave is native to the Americas and was introduced/naturalized around the Mediterranean much later) growing at the ancient Corinth site, with a stone wall visible behind them — the photo does show the correct location. **However, its caption, "Sculptural fragments at ancient Corinth," is wrong: the image contains no sculpture at all, only agave plants and trees.** This is a new needs-change, not previously caught (the original review checked this file's license/author but not its visual subject against its caption).

**Needs-change (new): `data/media/corinth.json` — `Agaven_Antikes_Korinth.jpg` caption (media-curator).** Replace "Sculptural fragments at ancient Corinth" with an accurate caption, e.g. "Agave plants growing at the archaeological site of ancient Corinth, Greece." The image itself, its license, and its author are all fine and may stay; only the caption is wrong.

### Askar / `sychar` — is prose-only disclosure acceptable, or should the data model change?

My view: prose-only disclosure (the current state) is an **acceptable stopgap for M2**, but the schema should grow proper support for an unmapped candidate before M6 (the next batch of ~50 sites), not be left as a one-off workaround.

- It is acceptable now because it is honest and neutral: Askar is named as a real, serious candidate in both `summary` and `history`, and the reason it isn't mapped (no confirmable non-OSM, non-Wikipedia coordinate) is stated plainly rather than glossed over. A reader of the record is not misled about what evidence exists.
- It is not a good long-term pattern because the `candidates[]` array is the schema's structured, machine-readable way to represent "serious candidate sites," and every other disputed site in this batch (`derbe`) represents its weaker candidate with a real (if lower-confidence) mapped point rather than dropping it to prose. Sychar's Askar candidate is the first case in the M2 batches where a serious candidate has genuinely **no** confirmable coordinate at all, and prose is the only tool available for that case today. If this recurs at M6's scale (~50 more sites), each occurrence will read as an inconsistent, ad hoc treatment unless the schema explicitly plans for it.
- Concretely, I'd recommend `location.schema.json` allow a `candidates[]` entry to omit `coordinates`/`coordinateSource` (perhaps via a new boolean like `"unmapped": true` plus a required `note` explaining why), so the disputed-site UI can still list Askar as a named candidate — just without a pin on the map — instead of requiring every candidate to carry a coordinate or be demoted entirely to prose. This is a schema change, so it belongs in a future M2-01-style or M4 card, not something to retrofit into this batch's already-verified records.

## Validation (re-run after the claims audit)

`npm run validate:data`: 0 errors, 29 warnings — same 29 as every prior round (no record's `scripture[]` changed in a way that affects the name-matching heuristic). `npm test`: 30/30 passing (up from 24; the schema rebase added 6 new jurisdiction-port fixture tests, all passing).

## Remaining work

One item remains open: the Corinth agave image caption (see above), owned by media-curator. Everything else — all 21 location records, all 21 media files, and 47 of 48 images (all but the one caption) — passes.


