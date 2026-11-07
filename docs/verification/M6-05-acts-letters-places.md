# M6-05 verification: Acts, the letters and Revelation (15 places)

- **Card:** `docs/tasks/M6-05-acts-letters-places.md` · **Branch:** `data/m6-05-acts-letters-places`, checked at `4c51b45` (`git diff 851c73e..HEAD`: `6363194`, `8a176bd`, `5d1cbcf`, `8e5e1f5` by the Research Lead; `4c51b45` by the Media Curator)
- **Checked:** the 15 records in `data/locations/`, their 27 images in `data/media/`, the 12 new `bib:` entries, `data/reference/openbible-ids.json`, `ATTRIBUTION.md` and `docs/research/SOURCES.md` (open questions 6–9). Against ADR-0017, ADR-0026, ADR-0033 item 1, ADR-0041 item 1, `schema/README.md` and `docs/LICENSES.md`.
- **Verifier:** fact-checker (Claude, Copilot CLI) · **Date:** 2026-11-06

**Result: 0 verified, 15 fix required.** Every record stays `status: "draft"`. There are 53 findings: 51 for the Research Lead (F1–F51) and 2 for the Media Curator (F52–F53). One coordinate is wrong (F50, Herod's palace, about 630 m off). One unmapped candidate has an accepted coordinate (F16), and one has no source for the proposal itself (F44). The rest are wording and citation fixes. All 39 WEB passages match `engwebp_vpl.txt` exactly, the NT passage lists are complete, and all 27 image licences match Commons exactly. 26 captions pass.

## 1. Commands (Node 24.21.0, at `4c51b45`)
| Command | Result |
|---|---|
| `npm run validate:data` | Pass, 218 warnings (207 on `main` at M6-01). All 11 new warnings are "WEB verse text contains none of this location's configured names": `athens-agora` (Acts 17:17 "marketplace"), `cyrene` (Acts 6:9 "Cyrenians"), `ephesus-theater` ×2 ("theater"), `philippi-forum` ("marketplace"), `philippi-place-of-prayer` ("riverside"), `straight-street` ("Straight"), `temple-of-artemis` ×4 ("Artemis"). These are expected: the verses name the place in words the titles don't contain |
| `npm test` | Pass, 323 passed, 0 failed |
| `npm run build:data` | Pass (generated 2,505,491 bytes, 777,476 gzip; routes 26,305 gzip) |
| `npm run check:images` | Pass: "Checked 1320 Commons URLs ... All image checks passed." No 429s were reported (the script retries 429s itself) |

Scripture was compared with `getWebTextForReference` from `scripts/lib/web-text.mjs`: 39 of 39 `textWEB` values match, including Revelation 17:5's capitals. Political history was compared with `derivePoliticalHistoryFromTimeline`. The 12 records with a `politicalAreaId` match the derived output exactly, and every mapped candidate lies inside its record's drawn area in `data/geo/ancient-areas.geojson`.

## 2. Sources opened (all read 2026-11-06)
| Source | Where | Licence, read at the source |
|---|---|---|
| ISBE (1915): "Babylon in the New Testament", "Har-magedon", "Sinai", "Cyrene", "Crete", "Adria", "Parthians", "Athens", "Damascus", "Ephesus", "Philippi" | internationalstandardbible.com (the `bib:` URLs; all HTTP 200) | Public domain |
| Biblical Archaeology Society, Ngo, "Searching for Biblical Mt. Sinai" | the `bib:` URL (curl blocked by Cloudflare; read through the fetch tool) | All rights reserved; cite-only (existing row) |
| Gordon Franz, "Where Is Mount Sinai In Arabia (Galatians 4:25)?" | biblearchaeology.org (the `bib:` URL) | "© 2026 Associates for Biblical Research. All rights reserved." Cite-only |
| Mark Allan Powell, "Revelation 16:16—Where Is Armageddon?" | the Baker Academic PDF (`bib:` URL), 3 pages | "© 2018 by Mark Allan Powell. All rights reserved." Cite-only |
| Jauhiainen, *Novum Testamentum* 47 (2005) | Brill returned 403; the abstract was read through Crossref, DOI 10.1163/156853605774482117 | Copyrighted journal; cite-only |
| Gleason et al., *Journal of Roman Archaeology* 11 (1998) | the Cambridge Core `bib:` URL. It has no abstract (paywalled); the title and authors were read there and through Crossref, DOI 10.1017/S1047759400017189 | "Copyright © Journal of Roman Archaeology L.L.C. 1998". Cite-only |
| Cornell University Archaeology Program, "Caesarea Maritima" | the `bib:` URL | "© 2026 Cornell University". Cite-only |
| Hellenic Ministry of Culture, Odysseus: "Bema of Saint Paul"; "Philippoi" History and Description | `eh2530`/`eh251.jsp?obj_id=20964`; `eh351`/`eh352.jsp?obj_id=2387` | No licence stated; cite-only (existing row) |
| Religious Greece, "Pilgrimage of Agia Lydia ..." | the `bib:` URL ("Coordinates: 41.020832, 24.276826") | "Copyright © 2026". Cite-only |
| ToposText, "Bema (Corinth)"; Downloads; "Who we are"; its GeoJSON of 2025-11-20 | topostext.org | See section 7 |
| Pleiades | `/places/<id>/json` for 373778, 912849, 1046, 893951, 758514868, 678084, 969121823, 818256726, 873985034, 501482, 570182, 579885, 507402, 501669, 501350, 935360966, plus the search RSS | CC BY 3.0 |
| Wikidata | `Special:EntityData` for every cited QID, plus Q722426, Q91742263, Q71551705, Q243846; a SPARQL radius search around the forum, the bema and the palace | CC0 |
| OpenBible.info | ancient pages for `mount-sinai`, `armageddon`, `cyrene`, `euphrates`, `adriatic-sea`; their GeoJSON; `modern.jsonl` (Bible-Geocoding-Data, `main`) for the coordinate sources | CC BY 4.0 (OSM-derived fields unused) |
| OpenStreetMap (Overpass) | features around Philippi, Caesarea and Damascus | **Cross-check only**, never a coordinate source |
| Wikimedia Commons | the API (`extmetadata`, categories, wikitext, upload log) for all 27 files and 4 categories; 11 thumbnails viewed | Per file (section 6) |
| WEB | `data/reference/engwebp_vpl.txt` | Public domain |

## 3. Per-record verdicts
| Record | Coordinates (≥2 sources) | Text | WEB / OT | Political history | Images | Verdict |
|---|---|---|---|---|---|---|
| `cyrene` | Pass: OpenBible's point is Wikidata Q71551705 "Citadel of Cyrene" (non-OSM); Pleiades and Q44112 within ~0.5 km | F1–F3 | Pass (7) | Pass (derived) | 2 pass | **Fix required** |
| `euphrates` | Pass: label point = Wikidata Q34589's second P625, OpenBible's source | F4–F6 | Pass (2); OT pass | F7 | 1 pass | **Fix required** |
| `sea-of-adria` | Pass: label point = Wikidata Q37495, OpenBible's source | F8–F9 | Pass (1) | Pass | 1 pass | **Fix required** |
| `babylon` | Pass: Mesopotamia: Wikidata, ToposText 56 m, OpenBible 139 m, Pleiades ~680 m. Fortress: Pleiades ~20 m, ToposText 51 m | F10–F14 | Pass (9); OT F15 | Pass (section 5) | 2 pass | **Fix required** |
| `mount-sinai` | Pass for the 3 mapped (Wikidata; OpenBible's points come from the same items; Jebel Musa 234 m) | F16–F22 | Pass (4); OT F21 | Pass (section 5) | 3 pass | **Fix required** |
| `armageddon` | Pass: Megiddo: ToposText "Legio" point 20 m. Carmel: Pleiades 6.9 km, on the same range | F23–F28 | Pass (1); OT pass | Pass (derived) | 1 pass, 1 F52 | **Fix required** |
| `areopagus` | Pass: Pleiades ~27 m, ToposText 59 m | F29–F31 | Pass (2) | Pass (derived) | 1 pass (shows the Areopagus) | **Fix required** |
| `athens-agora` | Pass: ToposText "Agora of Athens" 44 m | F32–F34 | Pass (1) | Pass (derived) | 2 pass | **Fix required** |
| `straight-street` | Pass: OSM "Souq Madhat - Basha Street - Via Recta" centre 99 m, on the same line | F36 | Pass (1) | F35 | 2 pass | **Fix required** |
| `ephesus-theater` | Pass: Pleiades 13 m, Wikidata 29 m | F37–F38 | Pass (2) | Pass (derived) | 2 pass | **Fix required** |
| `temple-of-artemis` | Pass: Pleiades 15 m, ToposText 80 m | F39–F41 | Pass (4) | Pass (derived) | 2 pass | **Fix required** |
| `philippi-place-of-prayer` | Values agree (Wikidata Q91742263 ~10 m, OSM church ~7 m), but the source must change: F42 | F43–F44 | Pass (1) | Pass (derived) | 1, F53 | **Fix required** |
| `philippi-forum` | Accepted as approximate (section 5, Q7), plus F48 | F45–F47 | Pass (1) | Pass (derived) | 2 pass | **Fix required** |
| `corinth-bema` | Pass: Commons category {{Object location}} ~4 m; vici.org ~3 m (Research Lead) | F49 | Pass (2) | Pass (derived) | 2 pass | **Fix required** |
| `herods-palace-caesarea` | **Fail**, F50 | F51 | Pass (1) | Pass (derived) | 2 pass | **Fix required** |

NT completeness: I searched every NT book of the WEB for each name and its forms (Cyren-, Euphrates, Adria, Babylon, Sinai, Harmagedon, Areopag-, Straight, theater, Artemis, place of prayer, riverside, marketplace, judgment seat, Herod's palace). No naming passage is missing. Optional additions are in Notes N3 and N4.

## 4. Findings and required fixes

### Research Lead

**`cyrene`**
- **F1 (WEB, scripture):** the summary says "its first missionaries to Gentiles", and `history[1]` says "among the first to preach to Gentiles at Antioch". The WEB Acts 11:20 says they "spoke to the Hellenists". ISBE says they preached "unto the Jews only" (Ac 11:19-20, KJV). Follow the WEB ("preached to the Hellenists at Antioch"). For "among the early Jerusalem church", cite Acts 11:19 or drop it. Add `scripture:Acts 2:10` to the summary's sources for "Libya around Cyrene".
- **F2 (citation):** for "the leading city of the district later organized with Crete as a single Roman province", ISBE "Cyrene" says only "It henceforth belonged to a Roman province". ISBE "Crete", which the summary doesn't cite, says "With Cyrene on the North coast of Africa, it was formed into a Roman province." Add `bib:isbe-crete`, and drop "leading city" or cite a source for it.
- **F3 (citation):** in `history[0]`, "from the island of Thera" and "forming one of the city's four main population groups by the first century BC" are not in ISBE. ISBE says only "a Greek colony founded by Battus in 630 BC" and "Ptolemy I ... transported Jews ... from this time on Jews were very numerous there". Remove both, or cite an opened source that states them.

**`euphrates`**
- **F4 (accuracy):** the support says "Wikidata's own point for the river instead marks its source near Erzurum ..., about 1,900 km upstream". In fact Q34589 has two P625 values: 39.7283 N, 40.2569 E, and 31.0043 N, 47.442 E. The second is identical to this record's point, and `modern.jsonl` (`mc07de7`) gives OpenBible's `coordinates_source` as `{"type":"wikidata","id":"Q34589"}`. The 1,900 km figure has no source (the straight-line distance is ~1,170 km). Say that the label point is Wikidata's lower-course point, and drop the distance. Citing `wikidata:Q34589` as the `coordinateSource` is optional.
- **F5 (citation):** none of the summary's sources says "the longest river of Southwest Asia" or "join the Tigris". Pleiades 912849 says: "The longest river of Western Asia, the Euphrates flows from the Kara Su and the Murat Su to the confluence with the Tigris river." Cite `pleiades:912849` and follow its wording.
- **F6 (citation):** in `history[0]`, "its precise course meant Rome also held land east of parts of it, such as northern Mesopotamia under the emperor Trajan decades later" is not in ISBE "Parthians". ISBE says only: "This empire stretched from the Euphrates to the confines of India and the Oxus". Remove it or cite a source.
- **F7 (political history):** the entity "A frontier river between the Roman Empire (west bank, for most of its length) and the Parthian Empire" is stated by neither source. `bib:livius-parthia` describes the Achaemenid satrapy and never mentions the Euphrates. The record's own label point is in southern Iraq, which was Parthian on both banks (this project's `mesopotamia`: "Part of the Parthian Empire"). Rewrite the entity to what a source states, for example ISBE's "stretched from the Euphrates", without "west bank, for most of its length".

**`sea-of-adria`**
- **F8 (accuracy):** the support says Josephus was shipwrecked "on a voyage from Cyrene toward Puteoli", and `history[1]` says he was "sailing from Cyrene toward Puteoli, and ... picked up by a ship headed the same way". ISBE: "the shipwreck of Josephus in 'the middle of the Adria' where he was picked up by a ship sailing from Cyrene to Puteoli". It was the rescuing ship that came from Cyrene. Correct both.
- **F9 (citation):** "had by the first century been extended southward until it could cover 'even the waters between Crete and Malta'" (support) and "ancient writers had extended it by the first century" (summary). ISBE gives no date for this. Its authorities for the widest sense are Pausanias, Servius, Orosius (5th century) and Procopius. Remove "by the first century", or cite a source that dates it. The first-century evidence ISBE does give is Acts and Josephus's *Life*.

**`babylon`**
- **F10 (citation):** the summary's "capital of ancient Mesopotamia, on the Euphrates south of modern Baghdad ... exiled in the sixth century BC" is not stated by its sources (ISBE "Babylon in the New Testament" and the scripture). Q5684 says "capital city of Babylonia", and Pleiades 893951 "seat of the Neo-Babylonian Empire from 608 to 539 B.C." Say "Babylonia". Cite `wikidata:Q5684` and `pleiades:893951`, and an opened source for the river and the position relative to Baghdad.
- **F11 (neutrality, citation):** the summary says "Rome (read figuratively, the traditional and most widely held view)". ISBE: "Down to the time of the Reformation this was generally understood to mean Rome ... Since the Reformation, many scholars have followed Erasmus and Calvin and have urged that the Mesopotamian Babylon is meant." This supports "traditional" but not "most widely held". Drop "and most widely held", or cite a current source.
- **F12 (accuracy, neutrality):** the Mesopotamian support says ISBE "notes there is no tradition connecting the apostle Peter with this city". ISBE: "there is no evidence that Peter was ever in Babylon". Its "no tradition" sentences are about Egypt, and about Mark and Silvanus. For "some scholars" (support) and "some reputable scholars" (`history[1]`), ISBE has "Many good scholars hold to this view". Use "no evidence" and "many". Put the coordinate sentence before the caveat (ADR-0041).
- **F13 (identification):** the fortress candidate's point (Q2421968) is the fortress whose surviving walls date "to the late third or early fourth century CE" (Pleiades 758514868). The support presents it as "A Roman fortress ... which ... Strabo says was founded by refugees". Add `pleiades:758514868` and say that the surviving fortress is later (about AD 300) and marks the site of the Egyptian Babylon, which ISBE equates with "Old Cairo".
- **F14 (accuracy):** the Rome unmapped support says the pre-Reformation reading arose "partly because Peter's letter also sends greetings from Mark, who other New Testament letters place with Paul in Rome". ISBE gives the greeting as "internal evidence" for the Rome theory. It does not give it as the reason for the old reading, and it says only that Mark "had been summoned to Rome by the apostle Paul (2Ti 4:11)". Reword it, and cite `scripture:2 Timothy 4:11` if the passage is described.
- **F15 (OT connections):** the 2 Kings 25:1 note speaks of the "siege and eventual destruction of Jerusalem", but 25:1 records only the siege. Use "2 Kings 25:1-11" or reword. The Daniel 4:30 note says ISBE "cites this verse as a fitting summary of Nebuchadnezzar's own building work", but "Babylon in the New Testament" never mentions Daniel 4:30 or the building work. Remove the clause and its `bib:`.

**`mount-sinai`**
- **F16 (schema, completeness):** the Jebel Serbal entry gives as its reason that "no coordinate ... was confirmed against an accepted dataset source". In fact `wikidata:Q722426` "Mount Serbal" has P625 28.646389 N, 33.651667 E, and OpenBible's "Jebel Serbal" point uses the same item. It lies ~34 km WNW of Jebel Musa, which fits ISBE's "20 miles West of Sinai". By `schema/README.md` ("Unmapped candidates"), it must be a mapped candidate (`low`), with `wikidata:Q722426`, `bib:isbe-sinai` and `openbible:mount-sinai`. Its support stays as written.
- **F17 (completeness, neutrality, citation):** the record's own source, Gordon Franz, writes that Sinai "in my opinion should be located at Jebel Sin-Bishar (Franz 2000: 112; Faiman 2000; Har-el 1983; Rasmussen 1989: 89-91)". OpenBible also lists Jebel Sin Bishar (Wikidata Q6923657, at 29.671 N, 32.961 E per OpenBible). BAS presents the Saudi option as Hershel Shanks's "Midianite Hypothesis" ("Mt. Sinai was not in the Sinai Peninsula, but in Midian in northwest Saudi Arabia") and never names Jabal al-Lawz, yet the summary cites BAS for Jabal al-Lawz. Add Jebel Sin Bishar (mapped, `low`, once you have verified Q6923657). Represent the Midian hypothesis as BAS states it, either attributed in Jabal al-Lawz's support or as an unmapped entry, since BAS names no mountain. Correct the summary's citation. The other minor names in OpenBible's list need no change unless a cited source treats them as serious.
- **F18 (neutrality, citation):** Jabal al-Lawz's support says it was "proposed ... chiefly by popular writers rather than mainstream biblical scholars". Franz names its proponents (Robert Cornuke, "president of the BASE Institute"; Larry Williams 1990; Ron Wyatt 1994) but doesn't characterize them so. "Arabia Petraea, the region named for the Nabataean capital Petra" is not in Franz either. Franz says that "in the days of the Apostle Paul the term 'Arabia' included the Sinai Peninsula", citing Herodotus, the Septuagint, Josephus and Strabo. State who proposed it, as Franz does, and word the Arabia point as Franz does. Introduce "Gordon Franz, writing for the Associates for Biblical Research" (ADR-0033).
- **F19 (citation):** Har Karkom's support says "The main objection is chronological: ... far earlier than any widely held date for the Exodus." BAS: "One major obstacle ... is that the religious center at Har Karkom flourished at least 800 years earlier than the traditional date of the Exodus". Follow BAS. "Italian" is not in BAS ("archaeologist Emmanuel Anati"): drop it or cite a source.
- **F20 (accuracy):** `history[1]` says Eusebius and Jerome "located the nearby wilderness of Paran". ISBE: they "place Horeb near Paran, which in their time was placed ... in Wady Feiran". Correct it. For "now known as St. Catherine's Monastery", add `bib:bas-mount-sinai-candidates` (BAS: "Jebel Musa looming over St. Catherine's Monastery").
- **F21 (scripture):** the summary's "according to Exodus, God gave Moses the Law" cites no Exodus passage. The Exodus 19:20 note's "to receive the Law" is not in that verse, which says only that the LORD came down and called Moses to the top. Cite a passage that says it (for example Exodus 31:18) or reword.
- **F22 (neutrality):** `names.otherLanguages` includes "Jebel Musa", which is one candidate's label. It equates the biblical mountain with the traditional site in the record's own names, which scripture linkage also uses. Remove it and keep "Har Sinai".

**`armageddon`**
- **F23 (WEB):** the summary quotes "the war of the great day of God, the Almighty". That is ISBE's ARV wording. The WEB (Revelation 16:14) reads "the war of that great day of God the Almighty", and the summary cites only 16:16, which mentions neither kings nor war. Quote the WEB exactly and add `scripture:Revelation 16:14`.
- **F24 (accuracy):** "Armageddon (Greek Har-Magedon, from the WEB's 'Harmagedon')" is garbled. The WEB spells it "Harmagedon". ISBE has "Harmagedon from Hebrew har meghiddo", and Powell "a transliteration into Greek of an unknown Hebrew word (har magedon)". Reword it, for example "Armageddon (the WEB's 'Harmagedon'), which Revelation calls a Hebrew name".
- **F25 (accuracy, attribution):** Carmel's support says "about 8 km northwest of Megiddo". Powell says "only five miles northeast of that city", and the mapped point is ~18 km from Tel Megiddo. It also says the identification was "proposed by some scholars ... on the idea that 'Mount Megiddo' was sometimes used loosely for the nearby Carmel range". Powell presents this as his own conditional reasoning: "Maybe Mount Carmel was sometimes called Mount Megiddo by people who lived in that area", and "if Mount Megiddo was an alternative name for Mount Carmel ..., then the problem could be solved". OpenBible gives "another name for Mount Carmel" 15%. Drop the distance, and attribute the proposal as the sources state it.
- **F26 (citation, ADR-0033):** Megiddo's support says "A frequently repeated difficulty is that Megiddo is a tell (mound), not a mountain". Powell's difficulty is that "no mountain by that name is known to us", while ISBE calls Megiddo "a hill-town"; state it as Powell does. ISBE's "the most probable explanation" is a quotation of Nestle (HDB), so attribute it. "A seminary-level New Testament textbook supplement" (here and in the unmapped entry) is an unsourced description. Introduce the work: "Mark Allan Powell's supplement to his textbook *Introducing the New Testament*".
- **F27 (neutrality):** the unmapped entry's "Revelation itself never states that the gathering ... takes place at a literal mountain" is the project's own argument. Use a source: Powell, "Some scholars think that is the whole point: the reference is metaphorical and no literal spot on earth was ever intended", or ISBE, "Har-Magedon may stand for the battlefield without indicating any particular locality".
- **F28 (neutrality, citation):** `names.otherLanguages` "Har Megiddo" encodes the Megiddo reading. Use the neutral form ("Har Magedon", after Powell) or drop it. "The Old Testament scholar John Day" (`history[1]` and the Zechariah note): the abstract says only "the old view, recently championed by John Day", so drop the descriptor or cite a source.

**`areopagus`**
- **F29 (citation):** Pleiades 969121823 is the source of "Named after a mythical trial of the god Ares", "to the northwest of the Acropolis" and "a meeting place for the Council of the Areopagus". It is also the "gazetteer" the support mentions, but it is cited nowhere. Add `pleiades:969121823` to the candidate and the summary. Its locations are an OSM outline and a "GeoHack Location" identical to Wikidata's, so instead of "independently maintained ... corroborated", say that its point lies about 30 m away. In the support, "next to the Painted Portico" overstates ISBE's "In this vicinity also was ... the Court of the Areopagus".
- **F30 (citation):** in the summary, "('Hill of Ares')" and "also sat in judgment on serious cases" are unsourced (Wikidata: "associated with ancient legislative and judicial bodies"; Pleiades: "a council of elders"). "Jesus and the resurrection" is Acts 17:18, and "TO AN UNKNOWN GOD" is Acts 17:23; neither is cited. Cite both passages, and reword the council clause to the sources.
- **F31 (scripture):** `history[1]` has "a member of the council named Dionysius the Areopagite", but Acts 17:34 says only "Dionysius the Areopagite". Drop "a member of the council" or cite a source for it.

**`athens-agora`**
- **F32 (WEB, accuracy):** the support says ISBE "places Paul's daily reasoning with Jews, devout Gentiles, and Epicurean and Stoic philosophers" in the Agora. Acts 17:17 puts the Jews and the devout persons in the synagogue ("he reasoned in the synagogue with the Jews and the devout persons, and in the marketplace every day with those who met him"), and so does ISBE ("The apostle disputed in the synagogue with the Jews"). Correct it.
- **F33 (accuracy, citation):** `history[0]` says "ISBE describes Paul passing the Agora on his way to the Acropolis". ISBE: he "passed by the Ceramicus ..., the 'Theseum,' ... and on to the Agora (Market-Place), just North of the Acropolis". In `history[1]`, "excavated since the 1930s" is unsourced, and in the project's own voice the Agora lies north-west of the Acropolis (Wikidata, ToposText). Cite the date or remove it, and say "north-west".
- **F34 (citation):** the summary's "ringed by porticoes (stoas), law courts, and public offices" goes beyond ISBE ("In and around the Agora were many porticoes"; "In this vicinity also was the Senate Chamber ... and the Court of the Areopagus"). Reword it to ISBE. For the philosophers who "brought him to the nearby Areopagus", add `scripture:Acts 17:18` and `scripture:Acts 17:19`.

**`straight-street`**
- **F35 (political history):** the parent `damascus` has a `politicalHistoryOverrides` entry for AD 37–40 ("Status uncertain (Roman-side)": 2 Corinthians 11:32, `bib:isbe-aretas`, Livius). `straight-street` has none, so at AD 38 the street reads "Roman province of Syria" while its city reads "Status uncertain". Copy the override and run `npm run fill:political-history`.
- **F36 (citation):** `history[1]` says ISBE "notes that the old city of Damascus still follows its Roman-era street plan", and the support says "the city's main Roman-era street". ISBE: "In the Greek period, a long, colonnaded street ran through the city, doubtless the 'street which is called Straight'". It says nothing about a street plan. Follow ISBE. The summary's account of Ananias finding Saul and restoring his sight needs `scripture:Acts 9:17` and `scripture:Acts 9:18`. In the support, move "though it is uncertain ..." to the end (ADR-0041).

**`ephesus-theater`**
- **F37 (WEB):** `history[0]` says "Paul's friends among the city's officials (Asiarchs)". The WEB Acts 19:31 says "Certain also of the Asiarchs, being his friends", and nothing makes them city officials. Use "some of the Asiarchs, who were his friends", or cite a source for what Asiarchs were.
- **F38 (citation):** the candidate's "the undisputed site of the riot" cites no source that says so. ISBE: "the huge theater which was the scene of the riot of Paul's time". Add `bib:isbe-ephesus` and use "identified as". The summary's "Hellenistic and Roman theater" and "overlooking the city's processional way" are not in Pleiades ("sits at the foot of the Panayir mountains. It could host up to 25,000 spectators") or Wikidata ("set into the hillside of the Panayirdag"). Cite them or remove them.

**`temple-of-artemis`**
- **F39 (accuracy):** `history[2]` says Wood found the foundations "on January 1, 1870, after eleven years of searching", and the support says "1869-1870". ISBE: "During the eleven years of his excavations at Ephesus ... Search, however, did not reveal the site of the temple until January 1, 1870, after six years of faithful work." Correct both.
- **F40 (WEB):** `history[1]` quotes Paul's preaching as "gods made with hands are no gods". The WEB Acts 19:26 reads "they are no gods that are made with hands". Quote it exactly.
- **F41 (citation):** in the summary, "a marble temple" is unsourced. In `history[0]`, "a treasury so trusted that people stored their money there" goes beyond ISBE's "a treasure-house". The summary's craftsmen "who made silver shrines ... fearing their trade was threatened" come from Acts 19:24–27, which is not cited. Drop "marble" or cite a source, use "treasure-house", and add `scripture:Acts 19:24` and `scripture:Acts 19:27`.

**`philippi-place-of-prayer`**
- **F42 (coordinate source):** the coordinate comes from a cite-only web page (Religious Greece: "Coordinates: 41.020832, 24.276826"), although an accepted dataset gives the same site. `wikidata:Q91742263` "Saint Lydia Church, Philippi" has P625 41.020889 N, 24.276917 E, about 10 m away, and OSM's church (way 231610426) is ~7 m from it. The card says to take coordinates from accepted dataset sources. Make `wikidata:Q91742263` the `coordinateSource`, with its value, and keep the Religious Greece entry as a cited source.
- **F43 (accuracy, citation):** the support says the stream was "called the Gangites or Zygaktis in ancient sources (the modern Anghista)". ISBE: "the valley of the Angites (Herodotus vii.113), which also bore the names Gangas or Gangites (Appian ...), the modern Anghista", and Paul "went out to the bank of the Angites". ISBE's "Zygactes" is a different river, bounding the plain. "Zigaktis" is the name Religious Greece uses for the stream at the baptistery. Pleiades lists "Gangites/Gangas" as "BAtlas 51 unlocated" (507402) and "Zygaktes? (river)" as the modern Xiropotamos (501669). Give each name as its source does, drop "in ancient sources", and add the Pleiades caveat that the ancient Gangites is unlocated (recommended). In the summary, "Since Philippi had too few Jewish men to require a synagogue" is not in ISBE, which says: "There was no synagogue here ... The number of resident Jews was small, their meetings for prayer took place on the river's bank". Follow ISBE, and add `scripture:Acts 16:14` and `scripture:Acts 16:15` for Lydia. "Commentators differ on the river's exact distance from the city gate" is unsourced: cite it or drop it.
- **F44 (unsourced proposal):** in the Krenides entry, "Some readers propose that the 'river' of Acts 16:13 is better identified with this nearer watercourse" is stated by neither source. ISBE gives only the name's meaning ("Crenides ... so called after the springs which feed the river and the marsh"). The "Greek Ministry ... abundant springs at the foot of the hill" clause is on neither Odysseus page: History says only "established the city of Krinides in 360 BC", and Description doesn't mention springs. The summary's "others point instead to the springs" depends on this entry. Cite two opened sources that make the Krenides proposal, or remove the entry and report this to the PO as the card says.

**`philippi-forum`**
- **F45 (citation):** the forum clauses (the support and `history[1]`) are on Odysseus's Description page, not the cited History page (`eh351`). The Description page (<http://odysseus.culture.gr/h/3/eh352.jsp?obj_id=2387>) says: "The Roman forum, the city's administrative centre in the Roman period, was a unified complex of public buildings positioned around a central square, with two monumental temples at the northeast and northwest. The large paved road that runs north of the forum has been identified as the ancient Via Egnatia." Add a `bib:` entry for that page and cite it.
- **F46 (accuracy, caveat):** the same page dates the visible remains: the macellum "is a building of the Antonines period (second half of 2nd century AD), contemporary with the Forum". The record shows the visible forum without saying that it postdates Paul. Add this as the last clause.
- **F47 (citation):** Odysseus calls the forum the "administrative centre" and puts a separate "Roman commercial market (macellum)" south of it, so drop "and commercial" from the summary or cite a source for it. The summary cites only Acts 16:19 for the exorcism, the beating and the prison: add 16:16–18, 16:22 and 16:23. In `history[0]`, add `scripture:Acts 16:23` for "thrown into prison".
- **F48 (coordinate support):** add `bib:isbe-philippi` to the candidate. ISBE: "In the center of the city is the forum (agora, Ac 16:19)". It supports both the identification and the use of the city's central point (section 5, Q7).

**`corinth-bema`**
- **F49 (citation):** neither cited source gives the year in "Excavation by the ASCSA in 1935" (ToposText credits only "Corinth Excavations, American School of Classical Studies"). For "dominating the south side", Odysseus says "standing prominently in the centre of the Roman Forum" and ToposText "dominated the face of the terrace of the Upper Forum". For "officially identified ... as the Bema of Saint Paul", Odysseus says "According to tradition, the site of Paul's trial was the Bema". For "widely ... linked", ToposText says "It is thought to have corresponded to the Bema mentioned in the Acts". Follow the sources. In `history[1]`, the "European regional development program" is "the Operational Program: Western Greece-Peloponnesus-Ionian Islands 2007-2013 (NSRF)" in Odysseus: name it that way.

**`herods-palace-caesarea`**
- **F50 (coordinate, fail):** Wikidata Q2527367's P625 (32.502506 N, 34.891767 E, unreferenced) lies at the harbour and Crusader town, about 630 m north of the Promontory Palace.
  - Cornell: the palace is "adjacent to the restored ancient theater and the newly discovered amphitheatron".
  - Wikidata "Theater of Herod" (Q3537241) is at 32.49605 N, 34.89097 E, and "Caesarea Hippodrome" (Q110300838) at 32.497264 N, 34.890354 E.
  - OSM way 96066573, "Promontory Palace" (ארמון הצוק), is centred at 32.49706 N, 34.88966 E, and OSM's "Caesarea Harbour" node is 31 m from the record's point (cross-check only).
  - The record's point is also only 113 m from `caesarea-maritima`'s own point, and it equals the WLM monument location on the image `herods-palace-caesarea-01`.

  Find an accepted, non-OSM source that places the palace, and check it against at least 2 others. If there is none, stop and report to the PO, as the card says.
- **F51 (citation, scripture):**
  - The support's "Excavations in the 1970s and 1990s (Universities of Pennsylvania and Hebrew University teams, later the Cornell University archaeology program)" is stated neither by Cornell's page nor by the JRA landing page (no abstract).
  - `history[0]`'s "The program dates the Lower Palace to Herod the Great's reign" is not on Cornell's page ("According to Josephus, Herod the Great built a splendid palace").
  - "widely accepted" is unsourced.
  - In `history[1]`, "Paul remained in custody there for two years": Acts 24:27 says "when two years were fulfilled ... Felix left Paul in bonds", not where. Drop "there".
  - The summary's "brought to Caesarea under guard" needs `scripture:Acts 23:33`.

  Remove the unsourced clauses or cite opened sources for them.

### Media Curator
- **F52 (caption):** `armageddon-02` reads "Mount Carmel, seen from the Jezreel Valley". Commons: "the southwest face of mount Carmel ... taken from the entrance of Kibbutz Ma'agan Michael", which is on the coastal plain west of the range. Fix the viewpoint, and reword the rest of the caption to match F25.
- **F53 (caption):** `philippi-place-of-prayer-01` reads "The Gangites River outside Philippi". After F43, use the name the record settles on (for example "The stream at Lydia, west of Philippi, ...").

## 5. Answers to the Research Lead's questions (SOURCES.md 6–9) and other checks
- **Q6, `corinth-bema` (ToposText coordinate):** accepted. ToposText's GeoJSON download (2025-11-20) holds the same point, [22.88028, 37.9051], and the licence ruling is in section 7. It is cross-checked against Commons' "Bema (Ancient Corinth)" category ({{Object location|37.905131|22.880263}}, ~4 m) and vici.org (~3 m, per the Research Lead). Wikidata's nearest items are the South Stoa (11 m) and the "Roman agora of Corinth" (35 m), so none is the bema itself. This meets the bar, following the precedent of Derbe's Devri Şehri (M2-batch-2).
- **Q7, `philippi-forum`:** accepted as an approximate point; it is not a guess. Pleiades' representative point lies at the forum:
  - the camera of `Forum_of_Philippi.jpg` is 39 m away;
  - Wikidata's Basilica A (Q21156432) lies 60 m north, and Basilica B (Q21156181) lies south-west, on either side of the forum;
  - ISBE: "In the center of the city is the forum" (F48).

  It is the only child record whose point is identical to its parent's (0 m). Whether two pins at one point are acceptable is PO question 1.
- **Q8, selection:** Sinai's is not complete (F16 and F17). Armageddon's passes: OpenBible's other readings (Jezreel Valley, Jerusalem, the Euphrates, the Valley of Jehoshaphat) are each under 10%, and no cited source treats them as serious. The symbolic entry covers Powell's and Jauhiainen's readings.
- **Q9, `babylon`:** yes, this is the card's intended structure: "Map the Mesopotamian city, and the fortress Babylon in Egypt if cited scholarship proposes it", and ISBE sets the Egyptian proposal out. One record, which is one biblical name, may map two unrelated real places, as Mount Sinai's candidates do. A display consequence is PO question 2.
- **Political history:**
  - `mount-sinai`'s `arabia` is plausible. All three mapped candidates, and Serbal and Sin Bishar, lie in the drawn `arabia` area, whose own note rests on ISBE's classing of Sinai with "Arabia Petrea". Franz also says Paul's "Arabia" included Sinai.
  - Babylon's Mesopotamian entry ("Part of the Parthian Empire; no internal succession tracked", -4 to 101, no `holderId`) is word for word `mesopotamia`'s own. The timeline has no Parthian holder, and the validator accepts the entry.
  - Its Egyptian entry equals `alexandria`'s derived `egypt-prefecture` entry.
  - `sea-of-adria` follows `syrtis`'s pattern and passes.
- **Confidence:** all values fit "Confidence meanings", once F16 and F17 add candidates. The Har Karkom/Jebel Musa `disputed` pair and Jabal al-Lawz's `low` fit BAS (Har Karkom was at the centre of the 2013 debate).
- **`unmappedCandidates`:** Babylon's two entries pass (each has ≥2 sources and no coordinate). Armageddon's passes after F27. Serbal fails (F16), and Krenides fails (F44).
- **Neutrality:** the Babylon, Sinai and Armageddon summaries each describe the readings and close neutrally ("this project takes no position"). F11, F17, F18, F22, F27 and F28 remove the places where the wording or names lean.

## 6. Images (27)
Every `license` matches Commons' `LicenseShortName` exactly, every one is in an accepted band, and all widths, heights and URLs match the Commons API. The author is the Commons Artist or credit-line name. The subject was confirmed from the Commons categories and description; "Viewed" means I looked at the thumbnail.

| Image | Subject evidence | Licence | Author | Kind | Caption |
|---|---|---|---|---|---|
| cyrene-01 | Cat. "Cyrene"; GPS in the site | CC BY-SA 2.0 | joepyrek | site | Pass |
| cyrene-02 | Cat. "Cyrene"; "Cirene ... Terme di Traiano" | Public domain (PD-self) | MM | site | Pass |
| euphrates-01 | Cat. "Euphrates", "Dhi Qar Governorate" | CC BY 4.0 | Aziz1005 | modern | Pass |
| sea-of-adria-01 | Cat. "Ionian Sea"; from Parga | CC BY-SA 4.0 | Νικόλαος Κυριακάκης | modern | Pass (N8) |
| babylon-01 | Cat. "Babylon"; P18 of Q5684; viewed (reconstructed walls) | CC BY-SA 4.0 | Mohamm3dfadil | site | Pass (N9) |
| babylon-02 | Cat. "Babylon Fortress"; P18 of Q2421968 | CC BY-SA 4.0 (multi-licensed with GFDL) | Daniel Mayer | site | Pass |
| mount-sinai-01 | Cat. "Remote views of Mount Sinai"; "Mount Sinai as seen from the southwest"; P18 of Q377485 | CC BY-SA 4.0 | Gerd Eichmann | modern | Pass |
| mount-sinai-02 | Cat. "Har Karkom" | CC BY-SA 4.0 | שועל | modern | Pass |
| mount-sinai-03 | Description "Snow covers Jabal al-Lawz in Tabuk" (Arabic); P18 of Q4115817 | CC BY-SA 4.0 | وكالة الأنباء السعودية | modern | Pass |
| armageddon-01 | Cat. "Tel Megiddo Canaanite gate" | CC BY-SA 3.0 (migrated; GFDL also) | Golf Bravo | site | Pass (N10) |
| armageddon-02 | Cat. "Mount Carmel"; viewed | Public domain (PD-self) | Chadner | modern | **F52** |
| areopagus-01 | Cat. "Views of the Areopagus from the Acropolis in Athens"; viewed: shows the hill. Reused from `athens.json` | CC BY 4.0 | Jakub Hałun | site | Pass |
| athens-agora-01 | Cat. "Ancient Agora of Athens", "Stoa of Attalus" | CC BY-SA 4.0 | George E. Koronaios | site | Pass |
| athens-agora-02 | Cat. "Ancient Agora of Athens" | CC BY-SA 3.0 | Georgios Liakopoulos | site | Pass |
| straight-street-01 | "Midhat Pasha Street in Damascus Old Town"; cat. "Streets in Damascus"; viewed | CC0 | Amani Sharaa | modern | Pass |
| straight-street-02 | Cat. "Street Called Straight"; LoC photochrom, "published 1905. Photo is between c. 1890 and c. 1900" | Public domain (PD-US) | Detroit Photographic Company | historical | Pass |
| ephesus-theater-01 | Cat. "Ancient Greek theatre (Ephesus)" | CC BY-SA 4.0 | Dudva | site | Pass |
| ephesus-theater-02 | Same category; viewed (the harbour street is visible) | CC BY-SA 3.0 (CC0 also offered) | Austrian Archaeological Institute | site | Pass |
| temple-of-artemis-01 | Cat. "Temple of Artemis"; viewed | CC BY-SA 2.0 | simonjenkins' photos | site | Pass |
| temple-of-artemis-02 | Cat. "Model of the Artemisium"; credit line "© José Luiz Bernardes Ribeiro" | CC BY-SA 3.0 | José Luiz Bernardes Ribeiro | reconstruction | Pass |
| philippi-place-of-prayer-01 | Cat. "Saint Lydia Church, Philippi"; viewed | CC BY-SA 4.0 | DocWoKav | modern | **F53** |
| philippi-forum-01 | "The remains of the forum ... of Philippi"; viewed | CC BY-SA 3.0 | MrPanyGoff | site | Pass |
| philippi-forum-02 | "Philippi - Forum Romanum, Basikila B, Balneum, Octagon" | CC BY-SA 4.0 | DocWoKav | site | Pass |
| corinth-bema-01 | Cat. "Bema (Ancient Corinth)" | CC0 | George E. Koronaios | site | Pass |
| corinth-bema-02 | Cat. "Bema (Ancient Corinth)" | CC BY-SA 4.0 | Davide Mauro | site | Pass |
| herods-palace-caesarea-01 | WLM heritage site; title "King Herod's Sea Palace aerial"; viewed (shows the promontory palace) | CC BY-SA 4.0 | Abraham Graicer | site | Pass |
| herods-palace-caesarea-02 | Cat. "King Herods Promontory Palace"; viewed | CC BY-SA 3.0 | Athanasius Soter | site | Pass |

## 7. Licences
- **ToposText (ruling, new rows in `docs/LICENSES.md` and `ATTRIBUTION.md`):** it has no named open licence. Its pages end "Copyrights © 2026 All Rights Reserved", while its Downloads page offers the place data as "Linked Open Data Files for use with appropriate attribution to ToposText".
  - A single coordinate from that data is a fact and an insubstantial extract. It may be a `coordinateSource` when no accepted dataset has the place, if it is credited through its `bib:` entry and checked against another source. That is compatible with CC BY-SA 4.0.
  - Its text is cite-only and never quoted. Some of its descriptions reproduce Odysseus's text.
  - In `ATTRIBUTION.md` I moved ToposText out of the cite-only row ("ToposText's place descriptions" stays there) and gave its data a row of its own.
- **New cite-only sources:** the Associates for Biblical Research, Cornell, Religious Greece, Powell's supplement, the JRA article and the *Novum Testamentum* article are all rights reserved (notices quoted in section 2). They are cite-only, under the existing copyrighted-works rule, and are now listed in `LICENSES.md`'s "Other copyrighted web references" row. ISBE is public domain, so its quotations are allowed. No record quotes a cite-only source at length (N7).
- **The Religious Greece coordinate:** after F42 it is no longer a coordinate source, so no new licence decision is needed.
- **Images:** all 27 are in the accepted bands. The multi-licensed files (babylon-02, armageddon-01, ephesus-theater-02) are recorded under an accepted option, as `LICENSES.md` allows. No non-free, fair-use or non-WEB Bible content is used.

## 8. Notes (no change required)
- **N1:** `bib:jauhiainen-...` and `bib:gleason-...` would be easier to check with their DOIs (10.1163/156853605774482117; 10.1017/S1047759400017189). Brill returns 403 to scripts.
- **N2:** `bib:odysseus-corinth-bema`'s URL (`eh2530`) is a frame. The description text is at `eh251.jsp?obj_id=20964`.
- **N3:** Acts 17:34 ("Dionysius the Areopagite") could join `areopagus`'s `scripture`, as Acts 6:9's "Cyrenians" joined `cyrene`'s.
- **N4:** `temple-of-artemis` lists Acts 19:28 ("Great is Artemis") but not 19:34, which has the same cry. Include both or neither.
- **N5:** `cyrene`'s coordinate is OpenBible's point, which comes from Wikidata Q71551705, "Citadel of Cyrene". Citing that item is optional.
- **N6:** ISBE puts Socrates's trial at the Court of the Areopagus. `areopagus` attributes this to ISBE and says only "in the same neighborhood", which is fine.
- **N7:** `armageddon` puts Jauhiainen's abstract words "cutting down" and "mountain" in quotation marks. These are the prophets' terms, but dropping the marks would avoid any question under the verbatim-quotation rule.
- **N8, N9, N10 (captions):** "the waters the first century called 'Adria'" would read better as "the waters first-century writers called 'Adria'". Babylon-01's caption could also name Matthew and Acts, not only 1 Peter. Armageddon-01 reads as if the gate itself were "widely read as" Har-Magedon; it should be the site.
- **N11:** the Sinai alternatives' second coordinate sources (OpenBible) come from the same Wikidata items. For ridges and mountains this agreement is enough.

## 9. Questions for the PO
1. `philippi-forum` uses exactly `philippi`'s point, so the map would show two pins at one point. Is that acceptable, or should a site with no coordinate of its own wait for one? A record needs at least one mapped candidate.
2. `babylon`'s `parentId` is `mesopotamia`, so the panel's "Type · Province · Empire" line reads Mesopotamia even when the reader looks at the Egyptian candidate. Should the record keep this, or does it need a map-code change later?
3. If no accepted source places Herod's palace (F50), may a `bib:` source with a stated coordinate be used, as for Derbe and the bema, or should the place be reported as missing?

## Sign-off
**Not signed off.** All 15 records stay `status: "draft"` until F1–F53 are fixed and re-checked. The licence edits are made: the ToposText rows and the cite-only list in `docs/LICENSES.md` and `ATTRIBUTION.md`. Checked by fact-checker, 2026-11-06.

**Budget (for the PR's row; not written to `docs/BUDGET.md`, per ADR-0051):** 2026-11-06 · fact-checker · Claude (Copilot CLI) · M6-05 verification · est. ~9M in (mostly cached context) / ~45k out · ~1,700 AI credits (estimated, not measured).
