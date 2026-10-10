# M4-02 verification — The first-century timeline

Independent verification of the Research Lead's work on branch `data/m4-timeline` (head `1bc3adb` when I started): `data/timeline.json`, the research note `docs/research/M4-timeline.md`, the place records' political links and histories, and 18 new bibliography entries. I checked them against card `docs/tasks/M4-02-timeline.md`, ADR-0017, ADR-0026, ADR-0027, ADR-0033, ADR-0037 with its two 2026-10-07 updates, CP2 decision 5, CP3b decision 2 and `docs/verification/M3-ancient-regions.md`. The baseline for the semantic diff is `main` at `d359e3b`. Reviewed 2026-10-07 and 2026-10-08. **Re-verified twice on 2026-10-08, after the Research Lead's fixes and the PO's decisions. The final result is verified; see "Re-verification (2026-10-08)" and "Second re-verification (2026-10-08)" at the end.**

**Result of the first round: needs Research Lead fixes.**

| Item | Pass | Needs change | Fail |
|---|---|---|---|
| Stops (13) | 3 | 7 | 3 |
| Entities (30) | 24 | 5 | 1 |
| Areas with periods (23) | 5 | 12 | 6 |
| Border anchors and area composition (research note §2.24–§2.25) | 11 | 1 | 2 |
| Place records (89) | 28 (set to `verified`) | 61 (stay `draft`) | 0 |
| New bibliography entries (18) | 18 | 0 | 0 |

"Fail" means a cited source contradicts the claim, or a rule is broken in a way the map would show. "Needs change" means the claim is unsourced, imprecise, worded for the team rather than readers, or incomplete. Most of the 61 place records only inherit a problem from their area; they pass once the area is fixed and `npm run fill:political-history` is re-run.

**The main findings:**
1. **Commagene and Cilicia Tracheia, AD 17–38, are given to Syria against the sources.** Tacitus (*Annals* 2.56) says Commagene got its own praetorian governor, Quintus Servaeus. Tacitus (*Annals* 6.41) shows a king, Archelaus, still ruling the Cietae of the Taurus in AD 36. The Loeb edition's own note puts "Philopator of Cilicia" in the *east* of Cilicia, so he was not Cilicia Tracheia's king, as the AD 17 stop's title says.
2. **Lycia as "a Roman province in its own right" from AD 43 is contradicted by its only source.** Cassius Dio (60.17.3) says Claudius "incorporated them in the prefecture of Pamphylia". Suetonius (*Vespasian* 8.4) has Vespasian taking Lycia's freedom away again, and the Loeb note to Tacitus's *Histories* 2.9 says Galatia, Pamphylia and Lycia formed one province in AD 69. Lycia should be unclear for 43–74, like Pamphylia.
3. **The Cappadocia area breaks ADR-0037 rule 4.** Its drawn land includes Pontus Galaticus (Galatia's from 2 BC), Polemon's Pontus (a client kingdom until 63/64) and Lesser Armenia (client kings from AD 38 to 72). Yet it shows Cappadocia's holder in every year. Rule 4 names eastern Pontus as its example of a larger unit that must show as unclear while the holders differ. As a result, the folded Pontus changes in the AD 6 and AD 70 stops don't appear on the map at all.
4. **The Sinai ruling fails.** Livius never mentions Sinai, and "Sinai (between the two)" is wrong: Rhinocolura and Gaza are both on the coast, with the peninsula to their south. The note also quotes Livius word for word, which `docs/LICENSES.md` forbids for cite-only sources.
5. **Thrace is "unclear" until AD 79, but Tacitus (*Histories* 1.11) lists it among the districts under imperial agents in January 69.** The note says Tacitus dates the province to Vespasian; Smith only writes "cf. Tac. Hist. 1.11". The ruler, "Rhoemetalces II", is given from 4 BC, but Smith says Caligula *made* him ruler of the whole country in AD 38.
6. **Magdala is missed.** Its own record identifies it with Josephus's Taricheae, one of the towns Nero gave Agrippa II (*Antiquities* 20.8.4), but it has no override, and the note says none of our places was affected. The free cities the card asked for (Tarsus and Thessalonica, at least) aren't recorded either.
7. **Neutrality on the census.** The AD 6 stop lists Luke 2:1–2 with the AD 6 census and no neutral note. The period note is garbled ("the time of Herod's birth narrative") and treats AD 6 as the default. M3-11 removed the same implication from `judea-province`.
8. **Stops change the map without saying so (ADR-0037 item 1).** The Thrace changes appear at AD 53 and AD 100, and the Nabataean successions at AD 41 and AD 72, but none of these summaries mention them. None of the summaries mention the renamed towns either, and §5.2 misses three renamings of our places.
9. **Reader-facing text.** Stop summaries, entity names, rulers and period notes reach the map (the caption's popover, tooltips, and the "Status unclear" reason). Several use team wording ("this note", "drawable", "AWMC's nearest face"). They name writers without introducing them and name databases (ADR-0033), and they quote two cite-only sources word for word.
10. **What passed:** the year convention, coverage without gaps or overlaps, the brief's four stops, the semantic diff, the four province histories M3-11 removed (now rebuilt from ISBE, Livius, Tacitus and Dio), the Yarmuk, Lamus, Pella and Philadelphia anchors, the Agrippa II and Nero's-grant dating (presented both ways), and Antipas's exile (no side taken).

## Scope
- `data/timeline.json`: 13 stops, 30 entities (the card's "about 33" before the rule-5 removal) and 23 areas with periods.
- `docs/research/M4-timeline.md`, especially §2.24 "Border descriptions" and §2.25 "Area composition". The geometry itself is verified in M4-03.
- All 89 place records: `politicalAreaId`, the candidate-level links, the derived `politicalHistory`, and the hand-written histories of `roman-empire`, `parthian-empire`, `media`, `mesopotamia`, `phrygia` and `pontus`. `judea-province` is not hand-written: it is linked to `judea-samaria-idumea`, and its history reads correctly as the history of that land.
- The 18 new bibliography entries and their licenses.

## Method
1. **Semantic diff.** A script compared every location file at `d359e3b` with the working tree, field by field.
2. **Map changes per stop.** A script found each area's holder and ruler at every stop and compared them with the previous stop, to check that each stop changes something and that the summaries name what changes.
3. **Sources opened** (all read 2026-10-07/08):
   - Josephus in Whiston's translation (CCEL): *Antiquities* 17.8.1, 17.11.4, 18.1.1, 18.2.1, 18.4.6, 18.6.10, 18.7.2, 19.5.1, 19.9.1–2, 20.7.1, 20.8.4 and 20.11.1; *Jewish War* 2.8.1, 2.9.6, 3.3.1–5, 7.1.2–3, 7.6.1 and 7.7.1.
   - Loeb translations on LacusCurtius: Tacitus, *Annals* 2.42, 2.56 and 6.41 with the Loeb notes, and *Histories* 1.11 and 2.9 with notes; Cassius Dio 53.12, 59.8, 59.12, 59.25, 60.8, 60.17 and 60.24; Suetonius, *Nero* 18 and 24, and *Vespasian* 8; Strabo 12.3.1, 12.3.9, 12.3.41, 12.5.1, 12.5.4, 14.3.2–3, 14.3.9, 14.4.1, 14.5.6, 14.5.18, 16.2.1 and 16.2.3.
   - ISBE (1915): Abilene, Arabia, Asia, Bithynia, Cappadocia, Crete, Cyprus, Cyrene, Decapolis, Derbe, En-gannim, Galatia, Golan, Iconium, Illyricum, Ituraea, Macedonia, Parthians, Peraea, Philadelphia, Phrygia, Pisidia, Pontus, Tarsus, Thessalonica, Trachonitis, and others checked for free-city status.
   - *Jewish Encyclopedia* (1906): "Agrippa II." (Wayback capture) and "Herod II.".
   - Smith's *Dictionary of Greek and Roman Geography* (1854): "Thracia".
   - Livius.org: Cappadocia (3), Cilicia, Herod Agrippa II, Judaea, Lycia, Nabataeans, Pamphylia, Parthia, Titus, Domitian, Nerva, Trajan.
   - World History Encyclopedia: Vespasian, Pompey. Zondervan Academic: "Who Were the Galatians?".
   - Nikos Kokkinos, "Justus, Josephus, Agrippa II and his Coins", *Scripta Classica Israelica* 22 (2003): the PDF, text extracted and searched.
4. **Identifications.** I queried Wikidata (SPARQL) for the five coordinate anchors and the ten Pleiades IDs in §2.24.
5. **Checks.** `npm run validate:data`, `npm test` and `npm run test:app`; see "Checks".

## Semantic diff
**Confirmed.** Against `d359e3b`, the only fields that changed are `politicalHistory` (89 records), `politicalAreaId` (81), `candidates[].politicalAreaId` (5: two on `bethany-beyond-the-jordan`, three on `cana`) and `status`/`verifiedBy`/`lastReviewed` (89). No record has `politicalHistoryOverrides`. Six records have no link and a hand-written history: `roman-empire`, `parthian-empire`, `media`, `mesopotamia`, `phrygia` and `pontus`. This commit changes only `status`, `verifiedBy` and `lastReviewed`, on the 28 records that pass.

## Year convention and coverage
**Pass.** All years are integers, there is no year 0, and BC years are negative. Each period's `toYear` is the next period's `fromYear`. All 23 areas cover AD −4 to 101 without gaps or overlaps (by script, and by the validator's derived-history check). The one misuse of the half-open convention is in a hand-written history: see `roman-empire` under "Places".

## Stops

| Year | Title | Verdict | Finding |
|---|---|---|---|
| −4 | Herod's kingdom is divided | **Pass** | *Antiquities* 17.11.4 states every clause: Archelaus made "not indeed ... king of the whole country, but ethnarch"; Galilee and Perea to Antipas; Batanea, Trachonitis and Auranitis to Philip; and "Gaza, and Gadara, and Hippos ... added ... to the province of Syria". Gaulanitis is from 17.8.1 and 18.4.6. Matthew 2:22 fits. |
| 6 | Judea becomes a Roman province | **Needs change** | (1) "Two years earlier" is wrong: ISBE "Galatia" gives 2 BC, as the note's own §4 says. "The nearest stop" should be "the next stop". (2) The folded Pontus Galaticus change doesn't show on the map, because Pontus is drawn as part of Cappadocia (see `cappadocia`). (3) Neutrality: Luke 2:1–2 is listed with the AD 6 census without a neutral note (fix R2). (4) "Under a prefect": Josephus says "procurator"; Livius "Judaea" supports "prefect" but isn't cited. |
| 17 | Cappadocia comes under direct Roman rule; Cilicia Tracheia's king also dies | **Fail** | (1) Tacitus names only "Philopator of Cilicia", and the Loeb note to *Annals* 2.42 says his "sovereignty ... extended only to a petty principality in the east of the country". So the title's "Cilicia Tracheia's king" is unsupported. (2) "Rome and local opinion were divided": Tacitus speaks only of the local majority and minority. (3) "Follows the administration-by-Syria reading" takes a side. *Annals* 2.56 puts Commagene under its own praetorian governor, and *Annals* 6.41 has King Archelaus ruling the Cietae of the Taurus in AD 36 (ADR-0037 item 1: show unclear rather than choose). (4) Strabo and Tacitus are named without introduction (ADR-0033). The Cappadocia clauses pass (*Annals* 2.42). |
| 34 | Philip's tetrarchy is absorbed into Syria | **Pass** | *Antiquities* 18.4.6: "His principality Tiberius took, (for he left no sons behind him,) and added it to the province of Syria, but gave order that the tributes ... should be ... laid up in his tetrachy." |
| 37 | Caligula makes Agrippa I a king | **Needs change** | The grant passes (*Antiquities* 18.6.10; ISBE "Abilene"). "The first time since Herod the Great that any of this land is ruled by a king" isn't stated by any source; cut it or source it. "Recorded here rather than on a separate area" is team wording. |
| 39 | Antipas is banished; his tetrarchy joins Agrippa I's kingdom | **Pass** | *Antiquities* 18.7.1–2; *Jewish War* 2.9.6. It names no place of exile, so it doesn't choose between Lyons (*Antiquities*) and Spain (*War*). Commagene's restoration in 38 is from Dio 59.8.2. |
| 41 | Agrippa I's kingdom is made whole; new neighbors appear | **Needs change** | (1) "Restoring his grandfather Herod's full extent ... for the only time in this period" goes beyond *Antiquities* 19.5.1: "all that country over which Herod ... had reigned, that is, Judea and Samaria". Gaza, Gadara and Hippos stayed with Syria, and Abilene had never been Herod's. (2) The "new" client kingdom of Chalcis: ISBE "Ituraea" makes Chalcis the capital of the earlier Iturean kingdom. (3) "Resolves Antiochus IV's position": Dio 60.8.1 says Claudius "restored Commagene to Antiochus, since Gaius ... had taken it away again". Say so. (4) Not named: Malichus II succeeds Aretas IV in 40, which the map shows from this stop. |
| 44 | Agrippa I dies; direct Roman rule returns | **Fail** | The Judea clauses pass (Acts 12:20–23; *Antiquities* 19.8.2, 19.9.1–2: Fadus over "Judea, and ... the entire kingdom"). But "Claudius had made Lycia ... a Roman province in its own right" is contradicted by its cited source. Dio 60.17.3: "He reduced the Lycians to servitude ... and he incorporated them in the prefecture of Pamphylia." "Allied with Rome" is unsourced. |
| 53 | Agrippa II trades Chalcis for the northern tetrarchy | **Needs change** | The exchange passes (*Antiquities* 20.7.1, "completed the twelfth year of his reign"; the Jewish Encyclopedia for "50" and for "probably in the years 53 and 61"). (1) "With the title of king": he was already king of Chalcis; cut. (2) "It is recorded on the towns themselves" is not yet true: Magdala (Taricheae) has no override. (3) Not named: Thrace becomes unclear from 46, which the map shows from this stop. (4) Josephus is not introduced (ADR-0033). "Drawable land" is team wording. |
| 70 | Jerusalem falls | **Needs change** | "Four years of war" (*Antiquities* 20.11.1: the war began in Nero's twelfth year), Titus's capture, the tenth legion left at Jerusalem (*Jewish War* 7.1.2–3) and Agrippa II's own kingdom all pass. (1) "Ending Jewish self-government in the province" isn't in the cited sources. (2) "Praetorian" legate: *Jewish War* 7.6.1 says only "legate". (3) Polemon's "independent kingdom": it was a client kingdom (ISBE "Pontus": "a separate kingdom"). ISBE "Pontus" gives 63 and ISBE "Galatia" 64; say so. (4) The folded Pontus change doesn't show on the map. Note for the PO: this stop changes no holder, only the province's ruler. The brief requires it anyway. |
| 72 | Commagene is annexed; Cilicia is reunited | **Needs change** | The main clauses pass: *Jewish War* 7.7.1 ("in the fourth year of the reign of Vespasian ... Cesennius Petus, who was president of Syria") and Livius "Cilicia" ("Vespasian reunited Cilicia in 72"). Not named: Rabbel II succeeds in 71, which the map shows from this stop. Not recorded anywhere: Livius "Cappadocia (3)", which the Research Lead cites, links Cappadocia's first senatorial governor (69) to "the merging of Cappadocia with Galatia". World History Encyclopedia's "Vespasian" has him annexing Lesser Armenia in 72. See fix R12. |
| 74 | Pamphylia leaves Galatia and is joined with Lycia | **Fail** | (1) "Pamphylia leaves Galatia" and "from 'Galatia'" contradict the file's own unclear holder for Pamphylia before 74 (neutrality). (2) "Lycia to its south": Lycia lies to the west. Livius "Pamphylia": "To the west, the Pamphylian city Attalia faced Lycia." (3) "Vespasian" isn't in the cited sources: ISBE "Pisidia" gives 74 without naming him, and Dio has nothing on it. Livius "Pamphylia" and Zondervan name him. (4) "The existing records also describe" is team wording. |
| 100 | Agrippa II dies; his kingdom joins Syria | **Needs change** | These pass: Kokkinos ("copied by Photius from the work of Justus, the ... secretary and court historian of Agrippa II"; "the conventional date of pre-CE 93 ... based on an interpretation of Josephus"; the revised Schürer "rejected Schürer's own opinion" on Justus's date), Livius ("indications that he lost some territories after 93") and ISBE "Abilene" (the kingdom joins Syria). (1) The lead weight is presented as proof ("shows him still reigning"). Kokkinos reports that the reading "Year 43" is disputed: Kushnir-Stein "reportedly suggested 'Year 33'", and later "23". (2) "Pre-CE 93" is quoted word for word from a copyrighted article (fix R22); write "before AD 93". (3) It names "Livius.org", a database, and doesn't introduce Josephus (ADR-0033). (4) Not named: Thrace becomes a province (from 79), which the map shows from this stop. |

**The brief's four stops** (4 BC; AD 6; AD 41 and 44; AD 70) **are present.** Every stop except AD 70 changes at least one holder; AD 70 changes only the ruler of the province of Judea.

## Entities

**Pass (24):** `herod-the-great`, `archelaus-ethnarchy`, `antipas-tetrarchy`, `roman-province-judea`, `agrippa-i-kingdom`, `agrippa-ii-kingdom`, `roman-province-syria`, `commagene-kingdom`, `cilicia-province`, `cappadocia-kingdom`, `cappadocia-province`, `galatia-province`, `thrace-kingdom`, `thrace-province`, `achaia-province`, `macedonia-province`, `asia-province`, `cyprus-province`, `crete-cyrene-province`, `egypt-prefecture`, `sicily-province`, `illyricum-province`, `nabataean-kingdom`, `uncertain-roman-side`. Names follow ADR-0026: the Bible's spelling where it names the area (Judea, Idumea, Galilee, Achaia, Macedonia, Asia, Cyprus, Illyricum, Egypt), otherwise the sources' standard name.

| Entity | Verdict | Finding |
|---|---|---|
| `lycia-province` ("Roman province of Lycia") | **Fail** | Its only source, Dio 60.17.3, says the Lycians were "incorporated ... in the prefecture of Pamphylia". |
| `philip-tetrarchy` | **Needs change** | ADR-0026 and the card's own example: Luke 3:1 names Philip "tetrarch of the region of Ituraea and Trachonitis", and most of the six versions spell it "Iturea". The name uses Josephus's district list instead, drops the Bible's Iturea, and reads awkwardly ("Philip's lands"). A nit on the ruler "Herod Philip": Luke and Josephus call him Philip, and "Herod Philip" is also used for Herodias's first husband. |
| `bithynia-province` ("Roman province of Bithynia") | **Needs change** | The sources call the province Bithynia and Pontus: Dio 53.12, "Bithynia with Pontus which adjoined it"; ISBE "Pontus", "governor of Bithynia and Pontus". The drawn area also includes western Pontus. |
| `italy-direct` ("Italy (governed directly from Rome)") | **Needs change** | M3-11's Fact-Checker removed "governed directly from Rome" as unsourced. Dio 53.12 shows only that Italy wasn't among the provinces. Suggest "Italy". |
| `lycia-league` | **Needs change** | Dio 60.17.3 supports Lycia's freedom before 43. The name "Lycian League" is Strabo's (14.3.2–3), so cite Strabo. Livius "Pamphylia" says nothing about the League. |
| `lycia-pamphylia-province` | **Needs change** | Cites Dio alone, which has nothing on 74. Cite ISBE "Pisidia" (74) and Livius "Pamphylia" (Vespasian, "after 70"). |

## Areas and their periods

**Pass (5):**
- `macedonia`: ISBE "Macedonia" (148 BC; Greece "placed under the control" of its governor); Dio 53.12; Tacitus *Annals* 1.76 and 1.80 (from M3-11); Dio 60.24.1 ("Claudius now made [them] to depend upon the lot once more").
- `asia`: ISBE "Asia" ("not until 129 BC that the province of Asia was really formed").
- `cyprus`: ISBE "Cyprus" (58 BC attached to Cilicia; "at first (27–22 BC) an imperial province"; "in 22 BC ... handed over to the Senate").
- `crete-cyrene`: ISBE "Crete" ("annexed ... in 67 BC. With Cyrene ... formed into a Roman province").
- `illyricum`: ISBE "Illyricum" ("finally organized in 10 AD"; "a consular legatus Augusti pro praetore residing at Salonae").

Together with the derived histories below, these close the backlog item on the province histories M3-11 removed.

| Area | Verdict | Finding |
|---|---|---|
| `commagene` | **Fail** | 17–38, "Roman province of Syria (Governor of Syria)": Tacitus *Annals* 2.56, "Quintus Servaeus was appointed to Commagene, now for the first time transferred to praetorian jurisdiction"; Strabo 16.2.3, Commagene "has now become a province". Neither says Syria. 38–72 hides Caligula's removal of Antiochus (Dio 60.8.1). The −31 start is invented, and its note ("Start year not found in sources opened for this note") is shown to readers. |
| `cilicia-tracheia` | **Fail** | −33 to 17: the note treats Philopator as possibly Tracheia's ruler, against the Loeb note (east of Cilicia; compare Strabo 14.5.18 on the kings of the Amanus). Strabo 14.5.6 gives Tracheia to Archelaus of Cappadocia. 17–38, "Governor of Syria": contradicted by *Annals* 6.41 (the Cietae "a tribe subject to Archelaus of Cappadocia", fighting "the forces of the king", AD 36). 38–72: Dio 59.8.2 gives Antiochus only "the coast region of Cilicia", and Dio 60.8.2 gives Polemon "some land in Cilicia" in 41. |
| `cappadocia` | **Fail** | (1) ADR-0037 rule 4: the drawn land includes Pontus Galaticus (Galatia from 2 BC, ISBE "Galatia"), Polemon's Pontus (to 63/64, ISBE "Pontus"/"Galatia"; Polemon II given his "ancestral domain" in 38, Dio 59.12.2) and Lesser Armenia (Cotys from 38, Dio 59.12.2; Aristobulus from 54, *Antiquities* 20.8.4; annexed 72, World History Encyclopedia "Vespasian"). Rule 4 requires an unclear status while the holders differ, or a line. The note, "this does not change Cappadocia's own holder", contradicts it. (2) The ruler "Quintus Veranius, first governor" is given for 17–101. The Loeb note to *Annals* 2.56 calls his appointment "only a temporary expedient". Livius "Cappadocia (3)" and Suetonius (*Vespasian* 8.4: "gave it a consular governor in place of a Roman knight") show equestrian governors until c. 69–72. (3) The merger with Galatia that Livius describes isn't recorded. |
| `lycia` | **Fail** | 43–74, `lycia-province`: contradicted by Dio 60.17.3, Suetonius *Vespasian* 8.4 ("He made provinces of Achaia, Lycia ... taking away their freedom") and the Loeb note to *Histories* 2.9 ("Galatia, Pamphylia, and Lycia now formed one province"). The sources disagree, so this should be `uncertain-roman-side`, like `pamphylia`. |
| `thrace` | **Fail** | (1) Ruler for −4 to 46: Smith says Caligula "made [Rhoemetalces II] ruler over the whole country" in AD 38, and names earlier kings (Rhoemetalces and Rhascuporis, about 14 BC). (2) The note says Tacitus dates the province to Vespasian, but Smith writes only "cf. Tac. Hist. 1.11". Tacitus *Histories* 1.11 lists "Thrace and the other districts which were in charge of imperial agents" in January 69, so the unclear span must end by 69. (3) The cited Rolfe Suetonius (*Vespasian* 8.4) reads "Trachian Cilicia", not Thrace. (4) Smith gives 47 (the Eusebian Chronicle), not 46. (5) The changes aren't named in the AD 53 and 100 summaries. |
| `arabia` | **Fail** (the note; the reigns pass) | The reigns pass against Livius "Nabataeans" ("Aretas IV ... 9 BCE – 40 CE", "Malichus II 40–70/71", "Rabbel II ... 71–106"). The Sinai note fails: Livius doesn't mention Sinai; "between the two" is geographically wrong; "Egypt's conventional edge" is unsourced; and the quotation of Livius breaks the verbatim rule. ISBE "Arabia" says only that the New Testament uses "Arabia" for the Sinai peninsula and that Ptolemy's Arabia Petrea "also includes the peninsula of Sinai". That is geography, not the first-century border. |
| `judea-samaria-idumea` | **Needs change** | (1) −37 to −4 still cites `bib:rainey-notley-sacred-bridge`. The card applies CP3b decision 2 here, and Josephus suffices (*Antiquities* 17.8.1: "having reigned, since he had procured Antigonus to be slain, thirty-four years"). (2) The 6–41 census note is garbled and not neutral (fix R2). (3) "Prefects" and "Procurators" need `bib:livius-judaea` ("In 6 CE, Judaea became an autonomous part of the Roman province Syria, ruled by a prefect"; after 44 "the governor was no longer a prefect, but a procurator"). Whiston's Josephus uses "procurator" throughout. This answers the note's open question 5. (4) The 70–101 note's "praetorian" is unsourced. |
| `galilee-perea` | **Needs change** | (1) Rainey and Notley, as above. (2) 44–101 has the ruler "Procurators" past 70, when the same province had legates; split at 70. (3) Magdala's override is missing (see "Places"). |
| `philip-tetrarchy-lands` | **Needs change** | (1) −20 to −4: ISBE "Ituraea" says only that "the country of Zenodorus, lying between Trachonitis and Galilee, and including Paneas and Ulatha" was given to Herod in 20 BC; Trachonitis, Batanea and Auranitis aren't part of it. Reword. Our two places, at Paneas and in Gaulanitis, fit the 20 BC grant. (2) 100–106 note: ISBE "Trachonitis" says only Trachonitis joined Arabia in 106. The note is wrong for Bethsaida and Caesarea Philippi. (3) 53–100: add that some historians date his death to about 92/93, so place histories stay neutral. |
| `syria` | **Needs change** | The note says Syria administered Philip's former tetrarchy in "44–53", but this file gives those years to the procurators of Judea. "Briefly Commagene and Cilicia Tracheia (17–38)" is contradicted (see above). Josephus, the source for 34–37, isn't cited. |
| `cilicia` | **Needs change** | −27 to 72: Dio and Strabo don't say "administered from Syria". Cite Livius "Cilicia" ("the remainder became an appendix to the province Syria"). 72–101 passes. |
| `galatia` | **Needs change** | It starts at −4, although ISBE "Galatia" dates the province to 25 BC (the old record said −25), so the places' histories now read as if it began in 4 BC. The note passes (ISBE "Galatia"; ISBE "Pisidia": "the greater (southern) part of it was assigned to the new double province Lycia-Pamphylia"; Zondervan: "Vespasian detached almost all of Pisidia from Galatia in AD 74"). The merger with Cappadocia is missing (fix R12). |
| `pamphylia` | **Needs change** | The unclear holder before 74 passes, because the sources disagree (Dio 60.17.3 against Tacitus *Histories* 2.9 and Livius "Pamphylia"). The note is the "Status unclear" reason readers see, but it reads like team notes ("Already held open in the existing records ... this note ... AWMC's nearest face"). 74–101 cites only Dio, which has nothing on it. |
| `bithynia` | **Needs change** | The examples Amastris, Sinope and Amisus aren't given as parts of the province in ISBE "Bithynia" or "Pontus"; ISBE says Sinope "was in Paphlagonia". Entity name: see above. |
| `achaia` | **Needs change** | The periods −27 to 67 pass (Dio 53.12; Tacitus; Dio 60.24.1). (1) 67–69 is held by the "Roman province of Achaia" with the ruler "Free (exempted by Nero)". Suetonius (*Nero* 24: "he presented the entire province with freedom") describes a change of status, which ADR-0037 item 1 counts. (2) The reversal at 69 is a placeholder (the note says so), and ADR-0037 item 1 asks for an unclear status instead. (3) Its only source, World History Encyclopedia's "Vespasian", doesn't mention it; Suetonius *Vespasian* 8.4 does, without a year. "Senate, proconsul" after the reversal is unsourced. |
| `egypt` | **Needs change** (minor) | The start, −30, isn't in Tacitus. The `egypt` record's own sources (Dio; Livius "Actium") give it. The ruler passes (Tacitus *Annals* 2.59; *Histories* 1.11: "managed ... by Roman knights in place of their former kings"). |
| `italy` | **Needs change** | The entity name only (see above). |
| `sicily` | **Needs change** (minor) | The start, −241, isn't in Dio. Start at −27 with Dio 53.12, or cite the `sicily` record's source. |

## Research note: border anchors and area composition (§2.24–§2.25)

| Anchor or ruling | Verdict | Evidence |
|---|---|---|
| Galilee/Samaria west end: Mount Carmel and Ptolemais | Pass | *Jewish War* 3.3.1 ("bounded toward the sun-setting, with the borders of the territory belonging to Ptolemais, and by Carmel"). Wikidata Q185318 (35.023333, 32.6725) and Q126084 (35.083889, 32.926111) match the note. |
| Ginea identified with Jenin | **Needs change** | ISBE "En-gannim": "It probably corresponds to the Ginnea of Josephus ..., and may certainly be identified with the modern Jenin." The note's quotation drops "probably", and "confirming Josephus's own identification" is wrong, since Josephus identifies nothing. The anchor itself is reasonable: Wikidata Q374748 (35.3, 32.461111) is linked to Pleiades 678163. Keep it, at "probable". |
| East end: Scythopolis and the Jordan | Pass | Pleiades 678378 (Scythopolis) and 687932 (Jordan), confirmed through Wikidata. |
| Perea's north: Pella and Philadelphia | Pass | *Jewish War* 3.3.3 ("from Macherus to Pella, and its breadth from Philadelphia to Jordan"). ISBE "Peraea": "the northern boundary of the Peraea would run, as Josephus says, from Pella eastward". Pella: Q167993 (35.616669, 32.450001), Pleiades 678326. Philadelphia: Q3805 (35.933333, 31.95), Pleiades 697728. |
| Perea's east, Jordan and the lake, the Arpha–Libanus line | Pass | *Jewish War* 3.3.1, 3.3.3 and 3.3.5, quoted correctly. Pleiades 678430 is the Sea of Galilee. |
| Gaulanitis's south: the Yarmuk | Pass | ISBE "Golan; Gaulonitis": "The boundaries of the province today are Mt. Hermon on the North, Jordan and the Sea of Galilee on the West, Wady Yarmuk on the South". The ancient district "must have corresponded roughly with the modern Jaulan". The note's caveat ("reasonably confident, not certain") is accurate. Pleiades 678183 is the Yarmuk. |
| Abilene's land with `syria` (rule 4) | Pass | ISBE "Abilene" (Abila, "18 Roman miles from Damascus"); no source gives its edges. |
| Cilicia Pedias/Tracheia: the Lamus | Pass | Strabo 14.5.6: "the boundary of the latter, the river Lamus and the village of the same name, lies between Soli and Elaeussa." |
| Lycia/Pamphylia: Phaselis and Olbia | Pass | Strabo 14.4.1 ("After Phaselis one comes to Olbia, the beginning of Pamphylia"); Pleiades 639051 is Phaselis. Strabo 14.3.9 adds that Phaselis "has no part in the common League". |
| Commagene/Syria; Paphlagonia's borders; Lake Tatta | Pass | Strabo 16.2.1, 16.2.3, 12.3.9, 12.3.41, 12.5.1 and 12.5.4, quoted correctly. Pleiades 658587 (Samosata), 857148 (Halys) and 619268 (Lake Tatta, today Lake Tuz). |
| Composition: Pisidia and Pamphylia in one AD 14 face, kept with `pamphylia` | Pass | A rule-4 judgment, disclosed in the period note. |
| Composition: Nicopolis with Achaia, Patmos with Asia, Malta with Sicily, Illyricum as Dalmatia only, Crete with Cyrenaica | Pass | Dio 53.12 ("Greece with Epirus"; "Crete and the Cyrenaic portion of Libya"); ISBE "Asia", "Melita" (from M3-11) and "Illyricum" ("narrower sense"). |
| Composition: Pontus and Lesser Armenia inside `cappadocia` | **Fail** | ADR-0037 rule 4 (see `cappadocia`). "Matching the rule-4 ruling" applies the small-unit branch to the unit the rule names as its large-unit example. |
| Ruling: Sinai with `arabia` | **Fail** | See `arabia`. If Sinai stays with `arabia`, it is a rule-3 approximation (AWMC's AD 200 line between Arabia and Egypt), the provenance must say so, and M4-03 confirms it. |

**Other research-note corrections**, besides those already listed for the data:
- §2.9, §2.10, §2.12 and §2.14: as for `commagene`, `cilicia-tracheia`, `lycia` and `thrace` above. The Loeb note answers open question 10.
- §2.7 says Gaza, Gadara and Hippos were cut from "Archelaus's and Philip's territory". Josephus says "from his government", meaning Archelaus's (nit).
- §5.2 misses three renamings of our places: Iconium as Claudiconium under Claudius (ISBE "Iconium"); Derbe as "Claudio-Derbe" (ISBE "Derbe"); and Philadelphia as "Neo-kaisaria" in the first century and "Flavia" under Vespasian (ISBE "Philadelphia").
- §6 has two errors: Magdala is Taricheae in its own record, and the free cities aren't identified (fixes R16 and R17).

## Places

**Pass, set to `verified` by `fact-checker` on 2026-10-08 (28).** Their derived histories match sources I opened, and none of these places differs from its area:
- `asia`, `colossae`, `ephesus`, `hierapolis`, `laodicea`, `miletus`, `mysia`, `patmos`, `pergamum`, `philadelphia-lydia`, `sardis`, `smyrna`, `thyatira`, `troas`
- `berea`, `macedonia`, `neapolis-macedonia`, `philippi`
- `cyprus`, `paphos`, `salamis-cyprus`
- `crete-cyrene`, `crete`, `libya`
- `illyricum`
- `media` and `mesopotamia`, which are hand-written. ISBE "Parthians": the empire "stretched from the Euphrates"; Mithridates I "added ... Media, Persia and Babylonia". Livius "Parthia" says the same.
- `phrygia`, which is hand-written. ISBE "Phrygia": "divided into two parts ... Galatian Phrygia, and ... Asian Phrygia ... the line between them was never sharply drawn"; Galatian Phrygia's cities included Antioch and Iconium.

The ISBE pages I opened for these cities give none of them free-city status (Pergamum's page didn't resolve at the address I tried). Philadelphia's renaming belongs to §5.2 and the stop summaries, not to its political history.

**Needs change; they stay `draft` (61).**

These inherit a problem from their area and pass once it is fixed and `npm run fill:political-history` is re-run:
- `judea-samaria-idumea`: `bethany`, `bethlehem`, `caesarea-maritima`, `emmaus`, `gethsemane`, `golgotha`, `jericho`, `jerusalem`, `joppa`, `judea`, `judea-province`, `mount-of-olives`, `pool-of-bethesda`, `pool-of-siloam`, `samaria`, `sychar`, `temple-mount`.
- `galilee-perea`: `capernaum`, `chorazin`, `galilee`, `nain`, `nazareth`, `sea-of-galilee`. `sea-of-galilee` keeps its M3-11 exception.
- `philip-tetrarchy-lands`: `bethsaida`, `caesarea-philippi`.
- `syria`: `antioch-syria`, `syria`, `tyre`.
- `galatia`: `antioch-pisidia`, `derbe`, `galatia`, `iconium`, `lycaonia`, `lystra`, `pisidia`. `lycaonia` follows the western, Roman part, as its own history says.
- `pamphylia`: `pamphylia`, `perga`.
- `achaia`: `achaia`, `athens`, `cenchreae`, `corinth`, `nicopolis`.
- `italy`: `italy`, `puteoli`, `rome`.
- `sicily`: `sicily`, `malta`.
- One each: `arabia`, `bithynia`, `cappadocia`, `cilicia`, `egypt`.

These candidate-level links are right but inherit their areas' problems:
- `bethany-beyond-the-jordan`: Al-Maghtas is in Perea (*Jewish War* 3.3.3), Qasr al-Yahud in Judea. This matches its summary.
- `cana`: Khirbet Qana and Kafr Kanna are in Galilee, and Qana in Lebanon falls in Syria.

These have problems of their own:
- `magdala`: its record names the town Taricheae (in its history and `otherLanguages`), and Nero gave Taricheae to Agrippa II (*Antiquities* 20.8.4: "Caesar also bestowed on Agrippa a certain part of Galilee, Tiberias, and Tarichae"). It needs an override from AD 54, or an unclear status for 54–61, given the Jewish Encyclopedia's 61.
- `tarsus`: correctly linked to `cilicia`, but it was a free city. ISBE "Tarsus": "civitas libera et immunis ... confirmed by Augustus".
- `thessalonica`: a free city. ISBE "Thessalonica", citing Pliny, *Natural History* 4.36.
- `damascus`: its summary says the extent of Aretas's control is debated (2 Corinthians 11:32), but its political history gives Syria throughout, with no note.
- `roman-empire`: the row "68..69 Galba, Otho and Vitellius ... (the 'Year of the Four Emperors')" covers AD 68 only, under the half-open convention. Otho and Vitellius reigned in 69, the Year of the Four Emperors (Livius "Cappadocia (3)"; World History Encyclopedia "Vespasian"). The row "69..79 Vespasian" cites only the *Jewish War*, which doesn't give 79; World History Encyclopedia's "Vespasian" does (69–79). The emperors from 79 pass against Livius.
- `pontus`: the note says "Suetonius dates Polemon's kingdom becoming a province to AD 63", but Suetonius (*Nero* 18) gives no year; the 63 is ISBE "Pontus", as the record's own history says. The start, −65, isn't in the cited sources (ISBE: Pompey "appointed in 66 BC"; World History Encyclopedia "Pompey": the Manilian Law, 66 BC).
- `parthian-empire`: the entity text refers to the project's own process ("Not drawn as a timeline area in M4: AWMC ... (ADR-0037 item 5)").

## Bibliography and licensing
**All 18 new entries resolve (HTTP 200) and may be cited:**
- **Public domain:** the ISBE's Decapolis, Ituraea, Peraea, Trachonitis, Abilene, En-gannim and Golan (1915); the Jewish Encyclopedia's "Agrippa II." (through its 2005 Wayback capture) and "Herod II." (1906); and Smith's "Thracia" (1854; London: Walton and Maberly, as printed on the Perseus page).
- **Cite-only:** the Livius pages (Herod Agrippa II, Titus, Domitian, Nerva, Trajan, Cappadocia, Lycia; custom terms, as before). Kokkinos's article (2003) is open access to read, but *Scripta Classica Israelica*'s "Journal Ethics and Copyrights Statement" says copyright is "vested with the Israel Society for the Promotion of Classical Studies".

**Fixed in this commit** (formatting only): `isbe-en-gannim` and `isbe-golan` had `type: "web"` and "International Standard Bible Encyclopedia" as publisher. They now match the other ISBE entries: `chapter`, Howard-Severance Company, and the same `containerTitle`.

**`docs/LICENSES.md` and `ATTRIBUTION.md`, updated in this commit:**
- The Jewish Encyclopedia (1906) and Smith's *Geography* (1854) are added to the public-domain rows.
- The Perseus do-not-quote item now says it doesn't cover public-domain works Perseus hosts.
- The Kokkinos article is added to the cite-only rows.
- The app's copy of those row names, in `app/src/features/search/sources-credits-content.ts`, is updated to match.

**Two verbatim quotations of cite-only sources** in `data/timeline.json` must be reworded: "Rhinocolura (Al-Arish) and Gaza" (Livius) and "pre-CE 93" (Kokkinos). Quotations of public-domain texts (Josephus, ISBE, Smith) are allowed.

## Backlog items the card closes
- **Province histories M3-11 removed: closed.** Macedonia, Asia, Cyprus, and Crete and Cyrene are rebuilt from ISBE, Livius, Tacitus and Dio, without Wikipedia, and pass.
- **Client kingdoms with their dates: not closed.** The Nabataean kingdom passes. Polemon's Pontus no longer appears on the map (fix R12), and its only history carries a misattributed date (`pontus`). Commagene and Cilicia Tracheia have the errors above.

## Fixes for the Research Lead
Each item lists the source to use. Re-run `npm run fill:political-history` after the area fixes.

- **R1. Herod's kingdom.** Remove `bib:rainey-notley-sacred-bridge` from both −37 to −4 periods; *Antiquities* 17.8.1 suffices.
- **R2. The census.** Rewrite the 6–41 note neutrally, for example: "Luke 2:1–2 links a census 'when Quirinius was governor of Syria' to Jesus' birth, which Luke 1:5 and Matthew 2:1 place in King Herod's days; Josephus dates Quirinius's census of Judea to AD 6. How the accounts relate is debated." Cite Luke 2:1–2, Luke 1:5, Matthew 2:1 and *Antiquities* 18.1.1. Either drop Luke 2:1–2 from the AD 6 stop or add the same sentence to it.
- **R3. Prefect and procurator.** Cite `bib:livius-judaea` for "prefect" (the 6–41 period and the AD 6 stop) and for "procurator" (44–70).
- **R4. After AD 70.** Drop "praetorian" and "ending Jewish self-government" (or source them), and split `galilee-perea` at 70.
- **R5. Commagene.**
  - 17–38: use a holder sourced to *Annals* 2.56 and Strabo 16.2.3, for example a Roman province of Commagene under its own governor, or `uncertain-roman-side` with that note.
  - Record Caligula's removal of Antiochus and Claudius's restoration (Dio 60.8.1). The date isn't known, so ADR-0037's unclear status may apply from 39 to 41.
  - Replace the invented −31 and its note.
- **R6. Cilicia Tracheia.**
  - −33 to 17: the Kingdom of Cappadocia (Strabo 14.5.6), or keep it unclear with a corrected note.
  - 17–38: `uncertain-roman-side` (*Annals* 6.41).
  - 38–72: note Polemon's land in Cilicia (Dio 60.8.2), or make it unclear under rule 4.
- **R7. The AD 17 stop.** Retitle it; use Tacitus's wording on opinion; drop "follows the administration-by-Syria reading"; introduce the writers.
- **R8. The `syria` note.** Remove "44–53" and "Commagene and Cilicia Tracheia (17–38)", and cite Josephus for 34–37.
- **R9. Lycia.**
  - 43–74 becomes `uncertain-roman-side`, with Dio 60.17.3, Suetonius *Vespasian* 8.4 and the Loeb note to *Histories* 2.9. Remove `lycia-province`.
  - Rewrite the AD 44 clause from Dio's words.
  - Cite Strabo 14.3.2–3 for the League.
- **R10. The AD 74 stop.** Use a neutral title, for example "Lycia and Pamphylia become one province". Say "west", not "south". Cite Livius "Pamphylia" or Zondervan for Vespasian, and ISBE "Pisidia" (not Dio alone) on the 74 periods and entity.
- **R11. Thrace.**
  - Fix the ruler: split the period at 38, or name the earlier kings.
  - End the unclear span by 69 (*Histories* 1.11).
  - Correct what the note says of Tacitus and Suetonius, and use 47 per Smith or source 46.
  - Name the changes in the summaries of the stops where they show.
- **R12. Cappadocia, eastern Pontus and Lesser Armenia** (the PO decides between the options; see P1).
  - Apply rule 4: make the drawn area unclear in the years its parts' holders differ, or ask M4-03 for a line (AWMC's AD 69 layer may separate Galatia's Pontus from Cappadocia).
  - Fix the ruler for 17–101: equestrian governors, the first being Quintus Veranius.
  - Record, or explain leaving out, the merger with Galatia that Livius "Cappadocia (3)" calls probable (c. 69–72), with Suetonius *Vespasian* 8.4.
  - Correct the AD 6 and AD 70 stops: "in 2 BC", "the next stop", "client kingdom", and 63 or 64.
- **R13. Achaia.** Model Nero's grant as a change of status (Suetonius *Nero* 24), and the reversal under Vespasian (Suetonius *Vespasian* 8.4, no year) as unclear until a sourced year (ADR-0037 item 1). Replace the World History Encyclopedia citation.
- **R14. Sinai.** Rewrite the `arabia` note without Livius's words and without "between the two". State its real basis: a rule-3 AWMC line, which M4-03 confirms, with ISBE "Arabia" for the geography.
- **R15. Philip's former tetrarchy.** Reword the 20 BC note to what ISBE "Ituraea" says. Drop the 106 claim, or limit it to Trachonitis (ISBE "Trachonitis"). Add the 92/93 view to 53–100.
- **R16. Magdala.** Add an override for Nero's grant (*Antiquities* 20.8.4; the Jewish Encyclopedia for 61), and correct §6 and the AD 53 summary.
- **R17. Free cities** (card step 5; ADR-0037 item 3). Record Tarsus (ISBE "Tarsus") and Thessalonica (ISBE "Thessalonica"; Pliny, *Natural History* 4.36) on their places, and check Athens and Antioch, which no page I opened confirms.
- **R18. Damascus.** Add a place-level note or unclear override for the Aretas years, with both views (ISBE "Aretas", Livius "Damascus" and "Nabataeans", 2 Corinthians 11:32).
- **R19. What the stops name** (ADR-0037 item 1). Name every change the map shows: Malichus II at AD 41, Rabbel II at AD 72, and Thrace at the stops where it changes. Mention the renamings in the stop summaries.
- **R20. Renamings.** Add Iconium, Derbe and Philadelphia to §5.2, with the ISBE entries above.
- **R21. Names** (ADR-0026). Rename Philip's tetrarchy after Luke 3:1, "Bithynia and Pontus" (Dio 53.12; ISBE "Pontus"), and "Italy".
- **R22. Reader-facing text** (ADR-0033 and `docs/LICENSES.md`).
  - Remove team wording from the summaries, rulers and notes.
  - Introduce writers (Strabo, Tacitus, Josephus, Eusebius, Eutropius, Smith), and don't name databases (Livius.org, AWMC).
  - Reword the two verbatim cite-only quotations.
- **R23. The AD 100 stop.** Present the lead weight as Kokkinos's reading, which is disputed.
- **R24. The AD 41 stop.** Use Josephus's wording ("Judea and Samaria"), drop "new", and say that Commagene was restored.
- **R25. The AD 37 stop.** Cut or source "the first time since Herod the Great".
- **R26. The AD 53 stop.** Cut "with the title of king".
- **R27. Sources on period starts.**
  - Add `bib:livius-cilicia` to `cilicia` −27 to 72.
  - Source Egypt's −30 and Sicily's −241, or start Sicily at −27.
  - Start `galatia` at −25 (ISBE "Galatia").
  - Source or drop the `bithynia` examples.
- **R28. Hand-written histories.**
  - `roman-empire`: fix the rows for 68 and 69, and add World History Encyclopedia's "Vespasian" to the Vespasian row.
  - `pontus`: attribute the 63 to ISBE "Pontus", and source or replace −65.
  - `parthian-empire`: describe the empire, not the project.
- **R29. Ginea.** Restore ISBE's "probably" in §2.24 and §2.25, and cite Pleiades 678163 (through Wikidata) as support.

## Items for the PO
- **P1. Rule 4 and eastern Pontus.** ADR-0037's update names "the two parts of eastern Pontus in 2 BC – AD 64" as its example of a larger unit that is drawn with its neighbour and shown as unclear. The later "rule 4" correction folded that land into `cappadocia` as if it were a small unit. Either Cappadocia shows as unclear in most years, or M4-03 needs a line. That decision is the PO's.
- **P2. Galatia and Cappadocia after about AD 70.** Livius calls the merger "probable", and Suetonius records a consular governor. Decide whether the map shows one holder from AD 72 or 74, two holders, or an unclear status.
- **P3. Nero's freedom for Achaia (AD 67).** It is a change of status in an area with four of our places (Corinth, Athens, Cenchreae, Nicopolis). Decide whether it is a stop and how to show its reversal, whose year is unknown.
- **P4. AD 70 changes no holder.** Only the province's ruler changes. That is fine because the brief requires the stop; this is for information.
- **P5. Reader-facing timeline text.** Stop summaries, entity names, rulers and period notes reach readers, so ADR-0033 applies to them. A line in the Research Lead's instructions would help.

## Checks
- `npm run validate:data`: 0 errors and 203 warnings, before and after this commit (unchanged).
- `npm test`: 195 of 195 pass.
- `npm run test:app`: 136 of 136 pass. The first run failed one test, which checks that the app's "Sources & credits" list matches the table in `ATTRIBUTION.md`. This commit's two new names in that table are now copied into `app/src/features/search/sources-credits-content.ts`. `npm run lint` and `npm run typecheck` are clean.

## Re-verification (2026-10-08)

**Scope.** The Research Lead's fixes on `data/m4-timeline`:
- `08dd826`: entities, areas and stops.
- `ea957f1`: place overrides for Magdala, Tarsus, Thessalonica and Damascus.
- `6ea1459`: the hand-written histories.
- `20495e6`: the research note and three new ISBE entries (Derbe, Philadelphia, Tarsus).
- `636fbe6`: PROGRESS and BUDGET.

I also checked the PO's decisions on P1–P5 (ADR-0037, merged as `669abe4`). I re-ran the semantic diff and the per-stop map-change script, re-opened every source behind a changed text, and searched for sources that might settle the five spans the Research Lead marked unclear.

**Result: almost ready; needs Research Lead fixes R30–R38.**
- R1–R29: 20 fixed, 9 partly fixed, none open.
- 86 of 89 place records are now `verified`. The other 3 (`cappadocia`, `damascus`, `magdala`) wait on R33, R36 and R37.
- Of the five spans marked unclear, four stay unclear and one is settled: Thrace was a Roman province from AD 46.
- Small fixes I made myself are listed below. The branch isn't ready for a PR, so I haven't written the PR body yet.

### R1–R29

| Item | Status | Evidence |
|---|---|---|
| R1 Herod's kingdom | Fixed | Both −37 to −4 periods cite only Josephus (*Antiquities* 17.8.1). |
| R2 The census | Fixed | The AD 6 stop and the 6–41 note set Luke 2:1–2, Luke 1:5 and Matthew 2:1 beside Josephus without choosing. No project source says the question "is debated" (ISBE's "Quirinius" and "Census" entries are cross-references only), so I reworded that clause to "this map takes no position on how the two accounts relate". |
| R3 Prefect and procurator | Fixed | `bib:livius-judaea` is cited on 6–41, 44–70 and the AD 6 stop. |
| R4 After AD 70 | Fixed | "Praetorian" and "ending Jewish self-government" are gone, and `galilee-perea` is split at 70. |
| R5 Commagene | Partly | 17–38 is now the `roman-province-commagene` entity (Tacitus *Annals* 2.56; Strabo 16.2.3), and Caligula's removal shows as unclear for 39–41. I corrected the note, which named Caligula where Dio 60.8.1 names Claudius. Open: the invented −31 became an invented −50 with "Antiochus III" (R31). |
| R6 Cilicia Tracheia | Partly | Archelaus to AD 17 (Strabo 14.5.6), unclear for 17–38 (*Annals* 6.41), and Polemon's land noted. Open: the start year (R32). |
| R7 The AD 17 stop | Fixed | Retitled, with Tacitus's own wording, and no side taken. I reworded "no source says what became of it", which *Annals* 6.41 contradicts. |
| R8 The `syria` note | Fixed | |
| R9 Lycia | Fixed | 43–74 is unclear, `lycia-province` is gone, the AD 44 clause quotes Dio, and the League cites Strabo. |
| R10 The AD 74 stop | Fixed (with my edits) | The Research Lead fixed the title, the direction and the sources. I removed the leftover "not its south" and "from 'Galatia'", and a new verbatim quotation of Zondervan (cite-only), now paraphrased. |
| R11 Thrace | Partly | The unclear span ends at 69 (*Histories* 1.11), and Rhoemetalces II rules from 38. Open: 4 BC–AD 38 was made unclear although Tacitus describes client kings throughout, and Livius settles the annexation year (R30). |
| R12 Cappadocia and its small units | Partly | P1 and P2 are applied, with 2 BC, "client kingdom" and "63 or 64" corrected. Open: the ruler labels and the note's sources (R33), and naming the small units' changes in the stop summaries (R34). |
| R13 Achaia | Partly | P3 is applied. I removed the unsourced "Senate, proconsul" after 79. Open: the AD 70 summary doesn't name Achaia's change (R35). |
| R14 Sinai | Fixed | The note rests on ISBE "Arabia" (Sinai in Arabia Petrea) and calls the line an approximation. The Livius quotation is gone. |
| R15 Philip's former tetrarchy | Fixed | ISBE's 20 BC wording is used, and the 106 claim is limited to Trachonitis. I added `bib:livius-nabataeans` for "together with the Nabataean kingdom", and `bib:kokkinos-justus-josephus-agrippa-coins` for the before-AD 93 view. |
| R16 Magdala | Partly | The override from AD 54 and the §6 row are in. I corrected the quotation to Whiston's "Tarichae", cited the IAA report ("identified with the settlement Migdal Nunia (Taricheae)"), and fixed §6's leftover sentence that said no place was affected. Open: the override runs to 101 (R37). |
| R17 Free cities | Fixed | Tarsus (ISBE "Tarsus": "civitas libera et immunis ... confirmed by Augustus") and Thessalonica (ISBE "Thessalonica"; Pliny, *Natural History* 4.36) carry place notes. Their holder stays the province, which ADR-0037 item 3 allows. No source I or the Research Lead opened confirms Athens or Antioch. |
| R18 Damascus | Partly | An unclear override for 37–40 gives both views. Open: the coin clause inverts ISBE (R36). |
| R19 What the stops name | Partly | Malichus II (41), Rabbel II (72), Lesser Armenia's annexation (72) and the Thrace changes (53, 70) are named. Open: the small units (R34), Achaia at AD 70 (R35) and the renamings (R38). |
| R20 Renamings in §5.2 | Fixed | Iconium as Claudiconium, Derbe as "Claudio-Derbe", and Philadelphia as "Neo-kaisaria", later "Flavia", all match ISBE. |
| R21 Names | Fixed (with my edit) | "Bithynia and Pontus" and "Italy" are in. Philip's tetrarchy now follows Luke 3:1, but the Research Lead used the WEB's "Ituraea". ADR-0026 takes "Iturea" (NIV, NLT, NKJV, CSB; "Ituraea" only in ESV and KJV; checked on Bible Gateway), so I changed it. |
| R22 Reader-facing text | Partly | Team wording, database names and the two cite-only quotations are gone. Writers and emperors were still often named without introduction, and a new cite-only quotation appeared. I fixed all of these except the three Thrace notes, which R30 rewrites. |
| R23 The AD 100 lead weight | Fixed | "On his reading ... disputed among specialists". |
| R24 The AD 41 stop | Fixed | Josephus's own words are used, and Commagene's restoration is stated. I added ISBE "Ituraea" as the source for "capital of the earlier Iturean kingdom". |
| R25, R26 The AD 37 and AD 53 stops | Fixed | In the data. The research note's §4 still had the old text, so I marked §4 as superseded by the data. |
| R27 Period starts | Fixed | Cilicia now cites Livius; Egypt cites Suetonius, *Augustus* 18 ("He reduced Egypt to the form of a province"); Sicily starts at −27 and Galatia at −25; the Bithynia note quotes ISBE "Bithynia" ("the Black Sea littoral as far as Amisus"). |
| R28 Hand-written histories | Fixed | `roman-empire`: Galba, Otho and Vitellius cover 68–70, and Vespasian 70–79 (World History Encyclopedia). `pontus`: 63 is attributed to ISBE "Pontus", and −66 to ISBE's "Pompey, appointed in 66 BC". `parthian-empire` describes only the empire. |
| R29 Ginea | Fixed | "Probably" is restored, and Pleiades 678163 is cited. |

### The PO's decisions
- **P1 (eastern Pontus and Lesser Armenia as small units):** applied. Their land is drawn with `cappadocia`, the Cappadocia note names all three, and the visual spec's map key names Polemon's kingdom. The stop summaries still miss some of their changes (R34).
- **P2 (Galatia and Cappadocia stay two areas):** applied. Both notes give Livius's "probable" joint government.
- **P3 (AD 67 a stop; Achaia unclear 70–79):** applied, as `achaia-free` for 67–70, unclear for 70–79, a province from 79, and stops at 67 and 79. One gap: the AD 70 summary (R35).
- **P4:** for information.
- **P5 (ADR-0033 for all timeline text):** met after my wording fixes, except the three Thrace notes (R30).

### The five spans marked unclear
| Span | Ruling | Evidence |
|---|---|---|
| Commagene 39–41 | **Unclear confirmed** | Dio 60.8.1 gives no year for Caligula's removal. Suetonius (*Caligula* 16.3) records only the restoration of 38 ("to Antiochus of Commagene, a hundred million sesterces"). Livius's "Caligula" page has nothing on it. |
| Achaia 70–79 | **Unclear confirmed** | Suetonius (*Vespasian* 8.4) gives no year. Livius's "Vespasian" and World History Encyclopedia's "Vespasian" don't mention the reversal. |
| Cilicia Tracheia 17–38 | **Unclear confirmed** | *Annals* 6.41 has a King Archelaus ruling the Cietae in AD 36, and the Loeb note puts them "on the coast of Cilicia Trachea". Nothing says who held the rest, or that Syria governed it. The note could add the Loeb location (optional, R32). |
| Lycia 43–74 | **Unclear confirmed** | The sources disagree. Dio 60.17.3: in 43 the Lycians were put into Pamphylia's prefecture. ISBE "Lycia": "In 53 AD ... it became a Roman province, and in 74 AD it was united with Pamphylia". Suetonius (*Vespasian* 8.4): Vespasian took Lycia's freedom away. The Loeb note to *Histories* 2.9: one province with Galatia and Pamphylia in 69. |
| Thrace 47–69 | **Settled: a Roman province from AD 46** (R30) | Livius, "Claudius" (Jona Lendering): "45/46 Annexation of Thrace". Tacitus, *Histories* 1.11, lists Thrace among "the other districts which were in charge of imperial agents" in January 69. Smith reports the Eusebian Chronicle's 47. The only contrary view, Vespasian's reign, rests on Smith's reading of Suetonius (*Vespasian* 8) and Eutropius. *Histories* 1.11 contradicts it, and the cited Loeb Suetonius reads "Trachian Cilicia" there. |
| Thrace 4 BC–AD 38 (also marked unclear) | **Settled: a client kingdom** (R30) | Tacitus, *Annals* 2.64: "The whole of that country had been subject to Rhoemetalces; after whose death Augustus conferred one half on his brother Rhescuporis, the other on his son Cotys." *Annals* 2.67: from AD 19, "Thrace was divided between his son Rhoemetalces ... and the children of Cotys", under a Roman regent, Trebellenus Rufus. |

### Reader-facing text, the stop summaries and the semantic diff
- **ADR-0033.** I scanned every stop title and summary, entity name, ruler and period note for writers, works, emperors, databases and team wording. Every first mention now introduces the person or work, for example "the Roman historian Cassius Dio" or "the emperor Nero". No database is named except as a cited work ("the International Standard Bible Encyclopedia (1915)"). No cite-only source is quoted word for word. The exceptions are the three Thrace notes (R30) and an ISBE quotation that contains "Augustus".
- **What the stops name** (ADR-0037 item 1), checked by script against the map's holder and ruler changes at all 15 stops. Every change is named, except Achaia at AD 70 (R35), the small units' changes (R34) and the renamings (R38).
- **Semantic diff.** Against `d359e3b`, only `politicalHistory`, `politicalAreaId`, `candidates[].politicalAreaId`, `politicalHistoryOverrides` (4 records) and the status fields have changed. Since `4a173eb`, only derived histories and the four overrides changed, and no record I had verified changed.

### My small fixes in this commit
Wording, quotations, spelling and sources only; no holder or year changed.
- **Introductions (ADR-0033):** writers and emperors are introduced throughout the stops and notes; "ISBE" is spelled out; "the Loeb edition" is now "a translator's note".
- **Quotations:** Dio's subject is corrected from Caligula to Claudius in the Commagene note; Whiston's "Tarichae" is restored in the Magdala note and three times in the research note; "Taricheae" is used in prose, as in the Magdala record.
- **Spelling:** "Iturea" per ADR-0026.
- **Cited sources added:** ISBE "Ituraea" (AD 41); the IAA report for Taricheae (AD 53, `galilee-perea`, Magdala); Livius "Nabataeans" and Kokkinos (`philip-tetrarchy-lands`).
- **Unsupported wording removed or corrected:**
  - "within this same year" (AD 39);
  - "is debated" (AD 6 stop and the 6–41 note);
  - "no source says" (AD 17);
  - the AD 74 wording (see R10);
  - "from Vespasian's accession", now "from AD 70" (AD 79);
  - Achaia's unsourced ruler after 79.
- **The research note:** §4 is marked as superseded by the data, and §6's leftover sentence is corrected.
- **Re-runs:** `npm run fill:political-history`, then status updates for the 58 records that now pass.

### New fixes for the Research Lead
Each item comes with its exact source, so the fix is mechanical.
- **R30. Thrace.**
  - 4 BC–AD 38: the client kingdom, not unclear. Ruler, for example: "Rhoemetalces, then Rhescuporis and Cotys, then (from AD 19) Rhoemetalces II and the sons of Cotys". Cite Tacitus *Annals* 2.64 and 2.67.
  - AD 38–46: Rhoemetalces II (Smith).
  - From AD 46: `thrace-province`, citing a new entry `bib:livius-claudius` ("Claudius", Livius.org, Jona Lendering, <https://www.livius.org/articles/person/claudius/>: "45/46 Annexation of Thrace") and Tacitus *Histories* 1.11.
  - Note: Smith reports the Eusebian Chronicle's 47, and the Vespasian dating from Suetonius and Eutropius; the Loeb Suetonius reads "Trachian Cilicia" at *Vespasian* 8.4.
  - Introduce the writers in all three notes.
  - Summaries: name the AD 46 annexation at the AD 53 stop, and drop the AD 70 Thrace sentence, which also calls Tacitus's January 69 "this same January".
- **R31. Commagene.** Replace −50 to 17 "Antiochus III" with −20 to 17, the client kingdom, ruler "Mithridates (from 20 BC), then Antiochus (died AD 17)". Cite Dio 54.9.3 ("to one Mithridates, though still a mere boy, he gave Commagene") and Tacitus *Annals* 2.42.
- **R32. Cilicia Tracheia's start.** −33 becomes −20. Dio 54.9.2: Augustus gave Tarcondimotus "the kingdom of Cilicia ... except for a few places on the coast. These latter together with Lesser Armenia he granted to Archelaus." Note Dio's "a few places on the coast" beside Strabo's "Cilicia Tracheia". Optional: add the Loeb note's location to the 17–38 note.
- **R33. Cappadocia's rulers and sources.**
  - 17–69: Tacitus calls Veranius the province's "governor" (2.56), "only a temporary expedient" (Loeb note), and he appears among the legates and senators of Germanicus's staff (2.74). So "Equestrian governors, the first being Quintus Veranius" mislabels him. Suggested ruler: "Quintus Veranius, sent to organize the province; then equestrian governors". Add Livius "Cappadocia (3)" ("equestrian governors (procurators)") and Suetonius *Vespasian* 8.4.
  - 69–101: Livius calls Gnaeus Pompeius Collega the first "governor of senatorial rank" (69); Suetonius says Vespasian gave Cappadocia "a consular governor". Word the ruler to match.
  - Cite sources for the note's claims about the small units: ISBE "Galatia" (2 BC; 64), ISBE "Pontus" (63), Dio 54.9.2 (Lesser Armenia to Archelaus in 20 BC) and 59.12.2 (to Cotys in 38), Josephus *Antiquities* 20.8.4 (to Aristobulus in 54), and World History Encyclopedia "Vespasian" (annexed in 72).
- **R34. Small units in the summaries (P1).**
  - AD 39: name Caligula's grants of 38: "to Cotys Lesser Armenia" and "to Polemon, the son of Polemon, his ancestral domain" (Dio 59.12.2).
  - AD 67: name Aristobulus's Lesser Armenia (54; *Antiquities* 20.8.4) and Polemon II's surrender of Pontus (63/64; ISBE). Move the latter from AD 70, since 67 is now the next stop after 64.
  - Update the Cappadocia note's "see the AD 6 and AD 70 stops".
- **R35. The AD 70 summary.** Name Achaia's change to an unclear status (P3).
- **R36. The Damascus note.** ISBE "Aretas" says: "This date is further fixed by a Damascus coin, with the image of King Aretas and the date 101. If that date points to the Pompeian era, it equals 37 AD." The note says no such coins survive. Correct it, or cite an accepted source for that other view.
- **R37. Magdala.** End the override at 100, the year the data gives for Agrippa II's death.
- **R38. Renamings in the stop summaries** (ADR-0037 item 1). Mention each in the summary of the first stop after it:
  - Paneas as Caesarea and Bethsaida as Julias (*Antiquities* 18.2.1, under Philip);
  - Iconium as Claudiconium and Derbe as "Claudio-Derbe" (ISBE, under Claudius);
  - Caesarea Philippi as Neronias (the Jewish Encyclopedia, citing *Antiquities* 20.9.4);
  - Philadelphia as "Neo-kaisaria", then "Flavia" under Vespasian (ISBE).

A nit, not a fix: several summaries open folded changes with "Folded in here:", a term from ADR-0037. "Also from this stop:" would read more naturally.

### Checks
- `npm run validate:data`: 0 errors and 203 warnings (unchanged).
- `npm test`: 195 of 195 pass.
- `npm run test:app`: 136 of 136 pass.
- `npm run build:data` succeeds and writes the 15 stop files.

## Second re-verification (2026-10-08)

**Scope.** I checked the Research Lead's `d4fa940` (fixes R30–R38 and the new area) and `736119c` (the research note) against ADR-0037's update "the rest of the Roman world, islands and the empire's edge" (`edf826f`).

**Result: verified.** R30–R38 are all fixed. The new area, the island assignments and the two border sources pass after small fixes. All 89 place records are `verified`, and no R-items remain.

| Item | Status | Evidence |
|---|---|---|
| R30 Thrace | Fixed | A client kingdom to AD 38 (Tacitus, *Annals* 2.64 and 2.67, quoted correctly), Rhoemetalces II alone to 46, and a province from 46 (Livius "Claudius"; Tacitus, *Histories* 1.11). The AD 53 stop names the annexation, and the AD 70 sentence is gone. I corrected "two years earlier (AD 46)", since AD 46 is seven years before AD 53. |
| R31 Commagene | Fixed | Starts in 20 BC under "Mithridates (from 20 BC), then Antiochus (died AD 17)" (Dio 54.9.3). I rewrote the note: it called the two kings possibly one, against its own ruler label. |
| R32 Cilicia Tracheia | Fixed | Starts in 20 BC (Dio 54.9.2, quoted exactly), with the Loeb note's "on the coast of Cilicia Trachea". |
| R33 Cappadocia | Fixed | The rulers now read "Quintus Veranius, sent to organize the province; then equestrian governors" and "Gnaeus Pompeius Collega, the first governor of senatorial rank (AD 69)" (Livius). Every claim about the small units is sourced. I rewrote the note to remove "Livius", "ISBE" and inline citations (ADR-0033). |
| R34 Small units in the stops | Fixed | Cotys and Polemon II (38) are named at AD 39, quoting Dio 59.12.2 exactly. Aristobulus (54) and Pontus (63/64) are at AD 67. I replaced a code identifier, `cappadocia`, in the AD 39 text. |
| R35 Achaia at AD 70 | Fixed | |
| R36 Damascus | Fixed | The note now quotes ISBE "Aretas" correctly ("a Damascus coin, with the image of King Aretas and the date 101"). I removed a clause that neither cited source states ("rather than merely posting a representative there under Roman sufferance"). |
| R37 Magdala | Fixed | The override ends in AD 100, and the town follows its area from then. |
| R38 Renamings | Fixed | Philip's towns (AD 17), Claudiconium and Claudio-Derbe (41), Neronias (67), and Neo-kaisaria and Flavia (70). None of these sources gives a year, so I replaced "about this same time" and "about this time" with wording that dates nothing. |

**ADR-0037's update:**
- **`other-roman-lands`, held by the new entity `roman-empire`:** one period from 4 BC to AD 100, `focus: false`, and the entity's `locationId` is `roman-empire`, as the ADR asks. The note cited Dio 53.12 alone, but Dio doesn't name Moesia or Pannonia. I added Tacitus, *Annals* 1.80 ("Poppaeus Sabinus was continued in his province of Moesia", AD 15), and ISBE "Illyricum" (Pannonia a separate province from AD 9). I also dropped "far from the New Testament's places", since Romans 15:24 names Spain. Dio 60.19–21 supports Britain "conquered from AD 43".
- **Islands (§2.25):** each citation matches Smith's *Dictionary of Greek and Roman Geography* on Perseus word for word:
  - Euboea: "Under the Romans, Euboea was included in the province of Achaia."
  - Brattia: "an island off the Dalmatian coast of Illyricum".
  - Curicta: "(Plin. Nat. 3.21 …), an island off the coast of Illyricum".
  - Corcyra: "The Romans made the capital a free state".
  - Samothrace: "In Pliny's time Samothrace was a free state", and the Synecdemus places it "with Thasos, in the province of Illyricum", which is late, as the note says.
  - Thasos: "continued to be a free (*libera*) town in the time of Pliny".

  Leaving the three free towns unassigned (that is, in `other-roman-lands`) follows ADR-0037 item 2.
- **Border sources:**
  - *Jewish War* 3.3.3: Perea's length is "from Macherus to Pella". I corrected the research note's quotation, which read "Machaerus".
  - Strabo 12.2.7 matches: "Mazaca, the metropolis of the tribe, is in the Cilician prefecture, as it is called".
  - Wikidata confirms Pleiades 697700 as Machaerus and 629035 as Caesarea of Cappadocia (Mazaca).

**Other small fixes in this commit:**
- Writers and people introduced: Aristobulus as "son of Herod of Chalcis"; William Smith's *Dictionary* by its title; "the fourth-century Chronicle of Eusebius"; "the emperor Augustus".
- "Livius" no longer named in the Thrace note.
- `bib:worldhistory-vespasian` cited for "Flavia, after the emperor's own family name".
- `npm run fill:political-history` re-run, then `cappadocia`, `damascus` and `magdala` set to `verified`.

**Semantic diff against `d359e3b`:** only `politicalHistory`, `politicalAreaId`, `candidates[].politicalAreaId`, `politicalHistoryOverrides` (4) and `lastReviewed` differ.

**Checks:** `npm run validate:data` gives 0 errors and 203 warnings (unchanged); `npm test` passes 195 of 195; `npm run test:app` passes 136 of 136; `npm run build:data` writes the 15 stop files.
