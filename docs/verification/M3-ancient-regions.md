# M3-11 verification — Ancient empire and provinces (about AD 50)

Independent verification of the Research Lead's commit `a0ec902` ("data(locations): add ancient empire and provinces") against the card (`docs/tasks/M3-11-ancient-regions.md`), ADR-0027, ADR-0026, ADR-0017 and ADR-0013. The baseline is `1f73a0e`, the schema commit just before the data. The branch head when I started was `45ef580`, which merges M3-10 into this branch but changes no location records. Reviewed 2026-09-28.

**Result:** all 73 records are `verified`, and none failed. All 10 new records needed changes before they could pass. The most common problems were clauses that rested on Wikipedia alone, misquoted WEB verses, and "senatorial" or "procurator" wording used for the wrong period. The five uncertain-case notes also needed rewrites. This commit fixes all of them with sources I opened, moves three label points off city pins, adds a sourced note to Perga on the Pamphylia question, and adds 17 bibliography entries. Six items need a decision from the PO or the human (see "Items for the PO and the human").

## Scope

- The 10 new records (`roman-empire`, `italy`, `sicily`, `achaia`, `macedonia`, `asia`, `syria`, `cyprus`, `crete-cyrene`, `judea-province`) and galatia's change to `type: "province"`.
- Every `parentId` set by the Research Lead (42 records, galatia included), and the history notes added to caesarea-philippi, bethany-beyond-the-jordan, damascus, nicopolis and tarsus.
- The spelling table in `docs/research/M3-11-bible-spellings.md`, the three new bibliography entries, and the validator and test changes that switched on `REQUIRE_EMPIRE_ROOT`.

## Method

1. **Semantic diff.** A node script parsed every location file at `1f73a0e` and at `a0ec902`, and later in the working tree, and compared them field by field.
2. **Sources opened.** For every clause I read the cited source or found another. Primary texts: Cassius Dio 53, 54, 59 and 60, Suetonius *Claudius* and *Nero*, Tacitus *Annals* 1, 2 and 12 and *Histories* 2, and Strabo 17.3, all in the Loeb translations on LacusCurtius. Josephus: *Antiquities* 17–20 and *Jewish War* 2 (Whiston, CCEL). Reference works: Livius.org (Cilicia, Damascus, Judaea, Macedonia, Nabataeans, Pamphylia, Tarsus, Corinth), the *International Standard Bible Encyclopedia* (1915; Achaia, Aretas, Asia, Crete, Cyprus, Galatia, Macedonia, Melita, Nicopolis, Pamphylia, Cilicia), and World History Encyclopedia's "Corinth". I also read the raw text of every cited Wikipedia article to see what the Research Lead relied on.
3. **Coordinates.** I fetched every cited Wikidata item (`P625`, `P36` capital, `P571` inception, `P576` dissolved, `P1584` Pleiades ID) and every matching Pleiades record, including each location's provenance. Then I measured each label point against all 73 records' points.
4. **Quotations.** A script checked every quoted string in the edited records against the WEB snapshot (`data/reference/engwebp_vpl.txt`) and the fetched primary texts. All new quotations match, and every quotation comes from a public-domain text (WEB, Loeb translations published 1914–1932, Whiston).
5. **Checks.** `npm run validate:data`, `npm test` and `npm run build:data`, run before and after my changes.

## Semantic diff

**The Research Lead's commit (`a0ec902`) against `1f73a0e`: confirmed.** 42 existing records changed. The only paths that differ are `parentId` (42), `status`/`verifiedBy`/`lastReviewed` (42), `history` (5: caesarea-philippi, bethany-beyond-the-jordan, damascus, nicopolis, tarsus) and `type` (galatia only). Every existing history entry is unchanged, and the new notes were appended. `45ef580` changes no location record. Minor: the commit body says 41 records got a parent, but its own table has 42 rows (41 places plus galatia).

**The final state (this commit) against `1f73a0e`:** `parentId` (42), `history` (6: the same five plus perga, all appended entries) and `type` (galatia). The status fields match the baseline again: every record is `verified`, by `fact-checker`, on 2026-09-28.

## Verdicts: new records

Every record below was **needs-change** at `a0ec902` and is a **pass** after the fixes in this commit. "Wikipedia alone" means the clause cited only Wikipedia plus sources that don't state it (a dataset ID, or a `bib:` entry that doesn't mention it).

| Record | What was wrong | Fix and sources |
|---|---|---|
| roman-empire | The summary said Luke "sets Jesus' birth under a census decree" and that Paul "as a Roman citizen, exercised his right" to appeal. Luke 2:1 and Acts 25:11 state neither. "Every place lay within one of its provinces" is wrong for Rome and Puteoli, because Italy was not a province. | Rewritten to quote the WEB. Actium now also cites `bib:livius-actium`, and the name Augustus in 27 BC is from Dio 53.16 and 53.20. The candidate now cross-checks against `pleiades:423025` (Roma, 1.3 km away). |
| italy | "Puteoli, a major port on Italy's southern coast": Puteoli is on the Bay of Naples, and no source says "southern". "A greeting 'from those in Italy'" is not the WEB, which reads "The Italians greet you." Three clauses rested on Wikipedia alone: the "privileged status" of Italy, Augustus's "eleven regions", and the Claudius edict "most historians date to about AD 49". Acts 28:13 names only Puteoli. | Clauses removed or rewritten with Dio 53.12 and Pleiades (`pleiades:1052`: "the Italian peninsula extending northward to the Alps"). The WEB quotation is corrected, and the Suetonius quotation is checked against Rolfe. Acts 28:13 is removed from `scripture[]` but stays a source for the Puteoli clause, and Puteoli's own record keeps it. The summary now says plainly that Italy was not a province (rewritten again in the follow-up commit; see "Follow-up: Italy's summary"). |
| sicily | "Rome's first overseas province", "since 212 BC it had also administered … Malta" and the "Egadi, Lipari, Ustica and Pantelleria" island groups rested on Wikipedia alone. The Malta date is also wrong: ISBE, citing Livy 21.51, has Rome taking Malta in 218 BC and attaching it to the province of Sicily. "An arrangement still in force at AD 50" had no source. | Rewritten with Pleiades and Wikidata (241 BC), `bib:isbe-melita` (Malta, which also supports malta's parent), Dio 53.12–13 (senatorial, proconsuls) and Strabo 17.3.25. Capital Syracuse: Wikidata `P36` and Wikipedia. |
| achaia | "Paul's letters … call the same region 'Greece'": "Greece" is in Acts 20:2, not in Paul's letters. "'Throughout Achaia'" is not the WEB ("in the whole of Achaia"). The capital at Corinth cited World History Encyclopedia, which doesn't say it. "Under a procurator" for AD 15–44 is wrong: Tacitus (*Annals* 1.76, 1.80) says Achaia and Macedonia went to the emperor and were added to the legate of Moesia. Suetonius was cited for AD 15, but he doesn't give that date. The Gallio inscription clause and "Thessaly" rested on Wikipedia alone; ISBE says Roman Achaia excluded Thessaly. | Summary rewritten with WEB quotations. Capital: Wikidata `P36` and Wikipedia. Greece = Achaia: `bib:isbe-achaia` ("In Ac 20:2 'Greece' means Achaia"). History rewritten with `bib:isbe-macedonia`, Dio 53.12 ("Greece with Epirus"), Strabo 17.3.25, Tacitus and Dio 60.24. In `politicalHistory`, the end year 67 is supported by Suetonius *Nero* 24 (Nero freed the province on leaving Greece) and World History Encyclopedia (Nero's canal attempt on the same tour, AD 67). |
| macedonia | "146 BC": ISBE and Livius say 148 BC, after Andriscus' revolt. "Procurator" is wrong, as for Achaia. `politicalHistory` called Macedonia "senatorial" from 146 BC, although the Senate/emperor division dates from 27 BC. Its end year, 306, rested on Wikipedia alone. | History now gives 148 BC (`bib:isbe-macedonia`, `bib:livius-macedonia`) and notes that some reference works (Wikidata, Wikipedia) give 146 BC. `politicalHistory` is removed because no source I opened gives an end year for the open-ended entry (see item 5 below). The summary now quotes Acts 16:12 ("a city of Macedonia") instead of an unsourced "founded churches" clause. |
| asia | The history quoted Wikipedia word for word ("'the most prestigious senatorial province'"). `docs/LICENSES.md` bans copying Wikipedia. "With the exception of Crete", "densely urbanized" and "after putting down a rival claimant" rested on Wikipedia alone. The Acts 19:10 quotation was not the WEB. `politicalHistory` said "senatorial" from 133 BC, and its end year, 293, rested on Wikipedia alone. | Rewritten with `bib:isbe-asia` (the bequest in 133 BC, the province formed by 129 BC, the wealthiest province, the seat moved from Pergamum to Ephesus, islands including Patmos), Dio 53.12, Strabo, and Acts 19:38 ("there are proconsuls"). WEB quotations corrected. `politicalHistory` removed. |
| syria | "Caligula folded Cilicia … into Syria around AD 37–41" rested on Wikipedia alone. Livius dates the attachment to after 30 BC; both sources agree Vespasian reunited Cilicia in AD 72. `wikidata:Q620864` (Cilicia) states no history. "Came into the regions of Syria and Cilicia" is not the WEB ("came to"). "Guarded by several legions facing Parthia" rested on Wikipedia alone. The clause about Syria's oversight of Judea cited the Aretas IV Wikipedia article. `politicalHistory` said "imperial … legate" from 64 BC. | Rewritten with `bib:livius-cilicia`, Dio 53.12 (Syria, Phoenicia and Cilicia kept by Augustus) and Dio 59.8.2 (Caligula gave Antiochus IV "the coast region of Cilicia"). Judea clause: Josephus *Antiquities* 18.1–2 and 18.120–122, and `bib:isbe-aretas`. `politicalHistory` split into 64–27 BC and 27 BC – AD 72 (`bib:livius-damascus`, Dio, `bib:livius-cilicia`). |
| cyprus | `politicalHistory` said "Under Caesar's authority, administered together with Cilicia" for 58–22 BC, but Cyprus was attached to the Republic's province of Cilicia in 58 BC and held by Augustus only in 27–22 BC. The final end year, 293, rested on Wikipedia alone. "Sergius Paulus believed" cited Acts 13:7, which doesn't say so. | History rewritten with `bib:isbe-cyprus` and Dio 53.12 and 54.4. Acts 13:5, 13:6 and 13:12 added as sources. `politicalHistory` removed. |
| crete-cyrene | "Combined into a single senatorial province in 67 BC": the province only became senatorial in 27 BC. `politicalHistory` said the same, and its end year, 267, rested on Wikipedia alone. | History rewritten with `bib:isbe-crete` (annexed in 67 BC and joined with Cyrene), Dio 53.12 ("Crete and the Cyrenaic portion of Libya") and Strabo. `politicalHistory` removed. Title "Crete and Cyrene" confirmed: ISBE uses it, and Pleiades has "Creta et Cyrene". |
| judea-province | **Neutrality:** "the same census Josephus and Luke's Gospel both associate with this period" takes a side in the debate over Luke 2:2, so it is removed. Samaria was already in the province from AD 6 (it was in Archelaus's ethnarchy: Livius, Josephus *Antiquities* 17.320), but `politicalHistory` left it out for AD 6–41 and listed it as new in AD 44. "Until AD 50, when he received … Chalcis" implied Chalcis was part of the province. Several clauses rested on Wikipedia and *The Sacred Bridge*, which I could not open. `scripture` was empty, although Luke 3:1 names the province. | Rewritten with Josephus (*Antiquities* 17.320, 18.1–2, 19.274, 19.363, 20.104, 20.138, 20.159; *Jewish War* 2.117, 2.220) and `bib:livius-judaea`. Added a neutral note that Josephus (*Antiquities* 18.2), Tacitus (*Annals* 12.23) and Livius also describe Judea as attached to Syria. Added Luke 3:1 ("Pontius Pilate being governor of Judea"), with `textWEB` filled from the snapshot. |
| galatia (type change) | None. Its names, summary and history were verified in M2. ISBE's "Galatia" puts Derbe and Lystra in Galatic Lycaonia, and Iconium and Pisidian Antioch in Galatic Phrygia. | Pass. |

**Names (ADR-0026).** I fetched the table's six verses from BibleGateway in all six versions (read 2026-09-28, names only, no text kept). Achaia, Macedonia, Asia, Syria, Cyprus and Italy appear in every version, so all 36 cells match. Sicily, "Crete and Cyrene", "Province of Judea" and "Roman Empire" are not Bible titles, and each follows a standard English reference name. Two statements in the research doc were wrong, and I corrected them. The Crete and Cyrene alternate is "Crete and Cyrenaica", not the Latin form. Sicily's sources are Wikidata and Pleiades, not World History Encyclopedia.

**`names.modern`.** Only italy ("Italy"), sicily ("Sicily") and cyprus ("Cyprus") have one. Each is the neutral geographic name of a peninsula or island, like malta's "Malta" (M3-08). No other new record has one, which is correct: there is no neutral modern name for Achaia, Macedonia, Asia, Syria, Judea or the others.

**Confidence.** All label candidates are `high`. That fits, because each province's identity is undisputed and the point is only a label position.

## Verdicts: the five uncertain cases and Perga

| Record | Finding | Verdict |
|---|---|---|
| caesarea-philippi | The parent is right. "Seat of the tetrarchy" had no source, "Rome then administered the territory directly" was loose (Josephus says Tiberius added it to the province of Syria), and the note cited Wikipedia beside Josephus. | Rewritten from Josephus (*Antiquities* 18.28, 18.106–108, 18.237, 19.363, 20.138) and Livius. **Pass.** |
| bethany-beyond-the-jordan | The parent is right. The note cited a dataset ID and *The Sacred Bridge*, which I could not open. | Added Livius (the procurators governed "the territories on the east bank of the Jordan") and Josephus *Antiquities* 20.2–4 (Fadus settles a Perea border quarrel). Also added that the minority Batanea proposal lay under the same procurators until AD 53, so the parent holds for every candidate. **Pass.** |
| damascus | The parent is right. "The ethnarch under King Aretas" is not the WEB ("the governor under King Aretas"). The dispute and the dating rested on Wikipedia alone, and "every proposal … within Caligula's reign at the latest" over-generalized. | Rewritten with the WEB verse quoted exactly, `bib:isbe-aretas` (the view that Caligula gave Aretas the city), Wikipedia (the dispute), `bib:livius-nabataeans` (Aretas IV reigned until AD 40) and `bib:livius-damascus` (part of Syria from 64 BC). **Pass.** |
| nicopolis | The parent is right. "Together with Thessaly and part of Epirus … separated from Macedonia" rested on Wikipedia, and "Epirus was only later organized as a separate province" had no source. | Rewritten with direct evidence: Dio 53.12 lists "Greece with Epirus" as one senatorial province, and Tacitus (*Annals* 2.53) calls Nicopolis "the Achaian town" in AD 18. **Pass.** |
| tarsus | The parent is right. The Caligula account rested on Wikipedia alone (see syria). | Rewritten with `bib:livius-cilicia`, Pleiades (Tarsus is in the Cilician plain) and Galatians 1:21. **Pass.** |
| perga | Had no history note on its disputed province. | Added (see "Pamphylia"). **Pass.** |

## Label points

Every point is on land and inside its area as of AD 50. None comes from OSM or cites Wikipedia as its coordinate source.

| Record | Point (lon, lat) | Source | Nearest records | Result |
|---|---|---|---|---|
| roman-empire | 12.5, 41.9 | `wikidata:Q2277` (Rome); 1.3 km from Pleiades' Rome | **On the Rome pin (1.3 km)** | Kept; no other sourced point exists. **PO** |
| italy | 11.094951, 43.694151 | **Changed** to `pleiades:1052` (Barrington Atlas location) | Rome 231 km | The Wikidata point (12.5, 42.0) was 12 km from Rome and 11 km from the empire label. |
| sicily | 14.015378, 37.599958 | `wikidata:Q691321`; Pleiades 981549 is 95 km east, at Catania | Malta 192 km | Kept. |
| achaia | 22.45, 37.89 | `wikidata:Q204772`; Pleiades 981502 is 120 km northeast | Corinth 38 km | Kept. |
| macedonia | 22.020662, 40.743844 | **Changed** to `pleiades:981531` (Barrington). Wikidata's province item has no coordinate. | Berea 29 km, Thessalonica 80 km | The old point was Thessalonica's own coordinate, 2 km from its pin. |
| asia | 28.3, 38.4 | `wikidata:Q210718`; Pleiades 981509 is 46 km west | Philadelphia 20 km, Sardis 25 km | Kept. The Pleiades point is no clearer (Sardis at 23 km). |
| syria | 36.15, 36.2 | `wikidata:Q207118` (Antioch) | **On the Antioch pin (2.9 km)** | Kept. Pleiades' point (37.5, 37.5) was not used: it comes from Barrington's map of the empire under Trajan and appears to fall in Commagene, which was a client kingdom in AD 50. **PO** |
| cyprus | 33.222467, 34.995436 | **Changed** to `pleiades:707498` (the island of Cyprus) | Salamis 65 km, Paphos 79 km | The Wikidata point was Paphos, 2.8 km from its pin. |
| crete-cyrene | 24.946957, 35.062141 | `wikidata:Q692775` (Gortyn) | **Crete's label 28 km** (not a pin) | Kept. Pleiades' point (21.68, 33.05) lies offshore, off the Cyrenaican coast. **PO** |
| judea-province | 34.9, 32.5 | `wikidata:Q1003997` (Caesarea Maritima) | **On the Caesarea Maritima pin (0.8 km)** | Kept. Pleiades 981527 has no location of its own; its computed point sits 7 km from Samaria's label. **PO** |

## Pamphylia and Perga

The Research Lead's correction is **half right: the evidence is split.** The commit body says Wikipedia, "citing Suetonius … and Cassius Dio 60.17.3–4", states that Claudius annexed Lycia alone in AD 43. But Dio 60.17.3 actually says Claudius "incorporated [the Lycians] in the prefecture of Pamphylia", which points to a joint province from AD 43. The evidence on the other side:

- Tacitus (*Histories* 2.9) says that under Galba (AD 68–69) the provinces of Galatia and Pamphylia had one governor.
- Livius ("Pamphylia") says Octavian made Pamphylia part of Galatia, and Vespasian created Lycia and Pamphylia "after 70".
- Pleiades (981530) says Claudius annexed Lycia in AD 43 while Pamphylia "was once a part of the province of Galatia", and that Vespasian merged the two.
- Wikipedia cites recent epigraphic work (Şahin and Adak's *Stadiasmus Patarensis*; Onur 2008) for the same view.

Dio 53.26.3 adds that in 25 BC "the portions of Pamphylia formerly assigned to Amyntas were restored to their own district" rather than kept in Galatia. So I would not call the case settled. Perga's parent stays `galatia`, which follows the more recent evidence. Perga now has a history note that sets out both views with sources. No record needs a separate Lycia record: no place in the dataset is in Lycia. If the PO prefers the other reading, the change is a new "Lycia and Pamphylia" province record and Perga's parent (item 2 below).

## The province list for about AD 50

All 73 records reach the Roman Empire. Every place sits in one of the ten areas under the empire (Italy and nine provinces). No place needs Epirus: Dio lists "Greece with Epirus" under the Senate, and Tacitus calls Nicopolis Achaian. No place needs Cilicia either, because the Cilician plain was governed from Syria until AD 72 (Livius, Wikipedia). Lycia is covered under Pamphylia above. No place lies in any other province.

## The Judea model

The model is **sourced, neutral and clear after this commit**:

- `judea` is the district around Jerusalem. The NT uses the name for the district when it separates it from Caesarea (Acts 12:19, "from Judea to Caesarea").
- `judea-province` is the Roman province, which the NT names in Luke 3:1 ("Pontius Pilate being governor of Judea").
- `judea`, `samaria` and `galilee` sit under the province. For AD 50 that is right: Samaria from AD 6, and Galilee and the lands east of the Jordan from AD 44 until Nero's grants in AD 54/55 (Josephus, Livius).

One nuance was missing. Josephus says that in AD 6 Judea "was now added to the province of Syria". Tacitus says Judaea was "attached to the province of Syria" after Agrippa's death. Livius calls it "an autonomous part of the Roman province Syria" and also "a third-class province". Pleiades and Wikidata classify it as a province, and the record now says both.

**Recommendation for the PO:** keep the two records, and keep the province's parent as the Roman Empire rather than Syria. Its governors ran it separately, and the schema requires a province's parent to be the empire. "Province of Judea" is an acceptable English title under ADR-0026: the Bible's own spelling, "Judea", with a descriptive prefix, the same pattern the spelling table records for NIV and NLT, which gloss Asia as "the province of Asia".

**PO decision and follow-up commit.** The PO accepted the model and title. The PO asked to drop the alternate "Judaea (Roman province)", because a name shouldn't carry a description, and to use plain English names if the sources support both spellings for the province. The follow-up commit sets `names.alternate` to ["Judea", "Judaea"]:

- **"Judea":** the province's name in Luke 3:1 ("Pontius Pilate being governor of Judea") in the WEB and in 5 of the 6 versions (NIV, ESV, NLT, NKJV, CSB), and Josephus's "procurator of Judea".
- **"Judaea":** the KJV's spelling in Luke 3:1, and the standard reference spelling for the province in Wikidata (`Q1003997`), Livius and the Loeb Tacitus (*Annals* 12.23).

I fetched Luke 3:1 from BibleGateway in all six versions on 2026-09-28 (names only, no text kept). Because the names now rest on that comparison, the record cites the six version entries in `summary.sources`, as M3-10's records do. Both spellings are also on the `judea` record, so a search for "Judea" lists both records. The Luke 3:1 validator warning is gone. The rest of the record is unchanged, and it is re-verified: **pass**.

## Parent assignments

All 42 are correct for about AD 50. Unchanged parents (for example Jerusalem's sites → `jerusalem`, and cenchreae → `corinth`) still end at the empire.

| Parent | Records | Basis |
|---|---|---|
| achaia | athens, corinth, nicopolis | Pleiades 981502 (Peloponnese and central Greece); Wikidata capital; nicopolis as above |
| macedonia | berea, neapolis-macedonia, philippi, thessalonica | Acts 16:12; Wikidata capital; Pleiades |
| asia | colossae, ephesus, hierapolis, laodicea, miletus, patmos, pergamum, philadelphia-lydia, sardis, smyrna, thyatira, troas | ISBE "Asia" (Mysia, Lydia, Caria, part of Phrygia, the Troad and islands including Patmos; it names most of these cities); Revelation 1:4 and 1:11 |
| galatia | antioch-pisidia, derbe, iconium, lystra, perga | galatia's own history (Pisidia and Lycaonia); ISBE "Galatia"; perga as above |
| syria | antioch-syria, damascus, tarsus, tyre | Wikidata capital; damascus and tarsus as above; Acts 21:3 ("we sailed to Syria and landed at Tyre") |
| cyprus | paphos, salamis-cyprus | ISBE "Cyprus"; Acts 13:4–6 |
| crete-cyrene | crete | ISBE "Crete" |
| italy | puteoli, rome | Pleiades 1052 |
| sicily | malta | ISBE "Melita" (attached to the province of Sicily) |
| judea-province | bethany-beyond-the-jordan, caesarea-maritima, caesarea-philippi, galilee, joppa, judea, samaria | Livius; Josephus (Joppa and Strato's Tower under Archelaus, *Antiquities* 17.320; Fadus over "the entire kingdom", 19.363); caesarea-maritima is the capital (Wikidata) |
| roman-empire | the 10 areas above | ADR-0027 |

Joppa and Caesarea Maritima go to the province rather than the district. That is safer: Acts 12:19 separates Caesarea from Judea, and both cities were in the province from AD 6. In `213b727` Bethsaida kept `galilee` (John 12:21, "Bethsaida of Galilee"), although both of its candidates lie east of the Jordan, in the former tetrarchy of Philip. That did not follow the card's rule of the smallest containing area, as the PR review pointed out. The second follow-up moves it to `judea-province`; see "Follow-up: PR review".

## Validator and test changes

The Research Lead's changes are reasonable and **do not weaken coverage**:

- The module default is now `true`, and `npm run validate:data` and `npm run build:data` call the validator with no option, so production data is always checked.
- The old fixtures have no empire, so the shared helpers default `requireEmpireRoot` to `false`. Any test can override that with `true`.
- The hierarchy tests (empire has no parent, a province's parent is an empire, `zoomTier`) still run with the real default.
- "Enabled by default" asserts the constant and runs a no-option validation that must fail on the old fixture.
- "Can be enabled" and "passes when chains end at an empire" cover both outcomes.

The builder is covered too. `tests/build-app-data.test.mjs` ("keeps empire/province types and parent chain in places.index") runs `buildAppData` with the default setting on an Athens → Achaia → Roman Empire chain. The other builder tests pass `false` because their fixtures have no empire. (Corrected after the PR review; the first version of this report said every builder test passed `false`.)

## Results

- `npm run validate:data`: **0 errors, 107 warnings.** The count was 98 at the end of M3-10. `a0ec902` added 9 "verse text contains none of this location's configured names" warnings:
  - crete-cyrene ×3: the verses name "Cyrene" only.
  - italy ×2: Acts 28:13 names only Puteoli, and "Italians" is not "Italy".
  - roman-empire ×2 and sicily ×1: the NT never names these areas.
  - cyprus ×1: Acts 13:7, the proconsul verse.

  This commit removes one (Acts 28:13 on italy) and adds one (Luke 3:1 on judea-province, because "Province of Judea" isn't a literal string in the verse), so the total stays at 107. The follow-up commit clears the Luke 3:1 warning ("Judea" is now one of the record's names), leaving **106**.
- `npm test`: **70/70 pass.** There were 69 at `a0ec902`; the M3-10 merge `45ef580` added one test.
- `npm run build:data`: **73 places.**

## Licensing

The three bibliography entries the Research Lead added, and the 14 I added from the same kinds of sources, are public domain or cite-only:

- Loeb translations of Dio, Suetonius, Tacitus and Strabo on LacusCurtius: each page states "The text is in the public domain".
- Josephus in Whiston's translation (1737) and the ISBE (1915): public domain by age.
- Livius and World History Encyclopedia: cite-only, as before, and paraphrased, never quoted.

`docs/LICENSES.md` and `ATTRIBUTION.md` gain one row each for the public-domain texts. The follow-up commit adds Smith's *Dictionary of Greek and Roman Antiquities* (1875) to those rows. Its LacusCurtius page is marked public domain (a single asterisk in the URL, under the site's stated rule).

## Sources added in this commit

`bib:tacitus-annals`, `bib:tacitus-histories`, `bib:strabo-geography`, `bib:josephus-jewish-war`, `bib:livius-cilicia`, `bib:livius-damascus`, `bib:livius-judaea`, `bib:livius-macedonia`, `bib:livius-nabataeans`, `bib:livius-pamphylia`, `bib:isbe-achaia`, `bib:isbe-aretas`, `bib:isbe-asia`, `bib:isbe-crete`, `bib:isbe-cyprus`, `bib:isbe-macedonia`, `bib:isbe-melita`. Dataset IDs newly cited: `pleiades:1052`, `pleiades:981531`, `pleiades:707498`, `pleiades:981502`, `pleiades:981509`, `pleiades:981516`, `pleiades:981517`, `pleiades:981527`, `pleiades:981530`, `pleiades:981549`, `pleiades:981550`, `pleiades:423025`, `wikidata:Q207497`. Removed where they supported nothing: `wikidata:Q17151` from macedonia, `wikidata:Q620864` from syria, `wikipedia:Aretas_IV_Philopatris` from syria, and `bib:worldhistory-corinth` from achaia's summary and candidate. The follow-up commit adds `bib:smith-dictionary-provincia` (italy) and cites the six Bible-version entries on judea-province.

## Items for the PO and the human

The PO's decisions (2026-09-28) are recorded after each item.

1. **Judea (CP3b):** keep `judea` and `judea-province` as two records under the Roman Empire, with the title "Province of Judea". Decide whether to rename the alternate "Judaea (Roman province)" to "Judaea" and whether to add "Judea" as an alternate (see "The Judea model"). *Decided: model and title kept; alternates are now "Judea" and "Judaea" (follow-up commit).*
2. **Pamphylia:** the sources are split. Perga stays in Galatia, with a note giving both views. The alternative is a "Lycia and Pamphylia" province record. *Decided: accepted as it is.*
3. **Labels on pins:** Roman Empire (Rome), Syria (Antioch) and Province of Judea (Caesarea Maritima) have no sourced point clear of the pin. Crete and Cyrene's label is 28 km from Crete's. For M3-03: offset or hide these province labels at zooms where the pins show, or have the Research Lead source hand-placed points. *Decided: accepted; the map will offset area labels away from pins.*
4. **Scripture on areas the NT never names:** roman-empire (Luke 2:1, Acts 25:11) and sicily (Acts 28:12, Syracuse) keep related verses. Keep them, or leave `scripture` empty? *Decided: kept for now; the PO puts the policy to the human at CP3b.*
5. **`politicalHistory` removed** on macedonia, asia, cyprus and crete-cyrene. Their open-ended intervals had end years that rested on Wikipedia alone, and some called the provinces "senatorial" before 27 BC. The AD 50 status is in each record's history text. M4's timeline should add sourced intervals. *Decided: the PO adds a backlog item for M4.*
6. **Italy has `type: "province"`** although it was not a province. The summary says so, and the panel will read "City · Italy · Roman Empire". *Decided: the type stays, and the PO documents in `schema/README.md` that `province` also covers equivalent top-level divisions such as Italy. The follow-up commits rewrite the summary to say plainly, with sources, that Italy was not formally a province (see "Follow-up: Italy's summary").*

## Follow-up: Italy's summary

The first follow-up (`214701d`) said that "while the provinces received governors sent out from Rome, Italy was governed directly from Rome". No public-domain source I found states the last clause in those words: it rested on Wikipedia's "Roman Italy" (in Italy, Roman magistrates held civil authority) plus inference. The PR review flagged it. The second follow-up keeps only what the non-Wikipedia sources state. The summary now reads:

> It was not formally a province and received no provincial governor: the Roman state had two distinct parts, Italy and the provinces, and Italy is absent from Cassius Dio's list of the provinces that Augustus divided between the Senate and himself in 27 BC.

Sources:

- **Smith's *Dictionary of Greek and Roman Antiquities*, "Provincia" (George Long, 1875; `bib:smith-dictionary-provincia`):** "The Roman State in its complete development consisted of two parts with a distinct organization, Italia and the Provinciae." It defines a province as a territory beyond Italy under Roman administration, run by "a governor annually sent from Rome". So Italy, not being a province, had no provincial governor.
- **Cassius Dio 53.12–13:** Italy is absent from Augustus's list of provinces, and each of those provinces received governors.
- **Strabo 17.3.24–25:** the Romans acquired Italy first and send "praefects and collectors of tribute" to the provinces.
- **Wikipedia's "Roman Italy":** a pointer only.

ISBE's "Italy" does not cover Italy's status.

## Follow-up: PR review

The GPT-5.4 data review (2026-09-28) raised two must-consider findings and one nit. This commit fixes all three.

**Bethsaida (must fix).** `parentId` moves from `galilee` to `judea-province`. The card's rule is the smallest area containing the place in about AD 50:

- Josephus places Bethsaida, which Philip raised to a city named Julias, "in the lower Gaulonitis" (*Jewish War* 2.168; *Antiquities* 18.28).
- He gives Galilee's eastern border as "Hippeae and Gadaris, and also … Gaulonitis" (*Jewish War* 3.37).
- Both candidates, et-Tell and el-Araj, are put forward as Bethsaida-Julias (the record's existing note).
- The province governed Philip's former tetrarchy from AD 44 to 53 (*Antiquities* 19.363, 20.138).

A new history note records that John 12:21 calls it "Bethsaida of Galilee". It adds that scholars discuss whether the wording reflects a wider use of "Galilee" for the land around the lake or points to a town on the Galilean shore, a possible second Bethsaida. Sources: John 12:21, Josephus, and ISBE's "Bethsaida" (W. Ewing, 1915; new entry `bib:isbe-bethsaida`), which sets out both views.

Re-verifying the record turned up a related error. Its `politicalHistory` kept Bethsaida in the province for AD 44–70, but Claudius gave Philip's former tetrarchy to Agrippa II in AD 53 (*Antiquities* 20.138). The entry is now split into AD 44–53 (the province) and AD 53–70 (Agrippa II's kingdom; *Jewish War* 3.37 names "the kingdom of Agrippa" on Galilee's border during the war). **Pass.**

**The other Galilee-lake places.**

| Record | Position | Result |
|---|---|---|
| capernaum | Tell Hum, northwestern shore, west of the Jordan's inflow, about 4 km west of el-Araj | Galilee is right. Luke 4:31 calls it "a city of Galilee". **No change.** |
| chorazin | Khirbet Karraza, in the hills north of Capernaum, west of the Jordan, about 6 km west of et-Tell | Galilee is right. **No change.** |
| magdala | Migdal, western shore, about 11 km southwest of el-Araj | Galilee is right. **No change.** |
| sea-of-galilee | The lake itself; its label point is mid-lake | The lake spans the boundary: its western shore was Galilee, and its northeastern and eastern shores were not. Only the Roman Empire contains all of it, so the smallest-area rule gives no useful parent. The parent stays `galilee`, following the lake's New Testament name and its existing `politicalHistory`. A new sourced note explains the exception: Josephus's eastern border of Galilee (*Jewish War* 3.37), and ISBE on Bethsaida and Gamala in Gaulanitis. **Pass; the PO may prefer another parent.** |

Nain, Nazareth and Cana lie inland, west of the lake, so the question of which side of the Jordan they lie on doesn't arise. One separate point, outside this review: Cana's low-confidence candidate, Qana in southern Lebanon, lies north of Galilee proper. Its two main candidates are in Galilee, so the parent stands, but the PO may want the same kind of note there.

**Italy (must fix).** See "Follow-up: Italy's summary". "Governed directly from Rome" is gone, and the sentence now says only what Smith, Dio and Strabo state. **Pass.**

**Nit.** The "Validator and test changes" section now describes the builder test that runs with the default setting.

**Semantic diff, final state against `1f73a0e`:**
- `parentId`: 43 records (bethsaida added).
- `history`: 8 records, all with appended entries (bethsaida and sea-of-galilee added).
- `politicalHistory`: 1 record (bethsaida's split).
- `type`: 1 record (galatia).
- Bethsaida, sea-of-galilee and italy stay `verified` (fact-checker, 2026-09-28).

**Checks:** `npm run validate:data` gives 0 errors and 106 warnings. `npm test` passes 72/72 (the GIS commit `4e9686e` added two tests). `npm run build:data` builds 73 places.
