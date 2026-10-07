# M3-22 verification — Names introduced in the other About texts

Independent check of the Research Lead's commit `623057c` ("data(locations): introduce names in the About text") against card M3-22, ADR-0017, ADR-0033 and visual spec §8, with the PO's ruling on named sources applied. Reviewed 2026-10-05. All 32 changed records pass, 13 of them after fixes; the scan of all 58 non-major records found 6 more records to fix, and they pass too. All 38 are `verified` again.

## Scope

A node script compared every `data/locations/*.json` file, parsed, at the PO's commit `5b34d93` with the working copy and listed every changed path.

- **After the Research Lead's commit:** 32 records changed, all non-major. The only changed paths were `summary.text`, `history[].text`, `history[].sources` (additions only, no removals or reordering) and `status`. No major record, field or file outside `data/locations/` and `data/bibliography.json` changed, apart from the Research Lead's `docs/PROGRESS.md` and `docs/BUDGET.md` rows. `data/bibliography.json` only gained four entries: `worldhistory-cicero`, `worldhistory-pliny-the-elder`, `worldhistory-xenophon` and `worldhistory-arrian`.
- **After this check:** 38 non-major records differ from `5b34d93`, the Research Lead's 32 plus 6 fixed in the scan. The changed paths are `summary.text`, `history[].text`, `summary.sources` and `history[].sources` (additions only) and `lastReviewed`. Each record's `status` and `verifiedBy` end as they began (`verified`, `fact-checker`). `data/bibliography.json` gains one more entry, `livius-ptolemy-i-soter`.

The card listed `derbe` among the 30 records to check. Its only non-biblical name, "early explorers such as W. M. Ramsay", is already introduced, so it needed no change. The Research Lead also changed `puteoli` and `roman-empire`, which the card's first search had missed.

## Method

- **PO ruling.** ADR-0033's "databases such as Pleiades or Wikidata" covers any database or website cited as a source (Wikipedia, BiblePlaces.com, Livius.org and so on), unless the website itself is the subject of the sentence. Such a name becomes a plain statement, and the citation stays in `sources`. Wikipedia is never the only source for a clause (ADR-0017).
- **Each changed clause** was compared word for word with its `5b34d93` text. For every new introduction ("the Roman historian", "the client king" and so on), and for every former "per X" clause, I opened the cited sources and checked that at least one of them states it. I also checked that no fact was lost or altered and that the text still reads naturally.
- **Names scan.** A second script listed every capitalised phrase in the `summary` and `history` text of all 58 non-major records, minus place names already in the dataset: 412 phrases. I reviewed each by hand, then searched again for named sources (Pleiades, Wikidata, Wikipedia, Livius, BiblePlaces, UNESCO, OSM, OpenBible, DARE and "per X").
- **Sources opened (2026-10-05):**
  - World History Encyclopedia: Cicero, Pliny the Elder, Xenophon and Arrian.
  - Livius.org: Actium, Cilicia, Nabataeans, Judaea, Mesopotamia, Parthia, Pamphylia, Damascus, Macedonia (8), Miletus and Ptolemy I Soter, and Livy's *Periochae* 46–50.
  - ISBE: Parthians, Pontus, Cilicia, Lycaonia, Iconium, Arabia, Aretas, Cyrene, Macedonia and Bithynia.
  - LacusCurtius (Loeb): the author pages for Cassius Dio, Strabo, Tacitus and Suetonius; Dio books 21, 36, 37, 51, 53, 59, 60 and 69; Strabo 17.1; Tacitus, *Annals* 2 and 12 and *Histories* 1; Suetonius, *Claudius* and *Nero*.
  - CCEL (Whiston): Josephus's *Life*, *Antiquities* 12, 18 and 20, and *Against Apion* 2.
  - BiblePlaces.com, "Puteoli", through the Wayback Machine (snapshot of 2026-08-02; the live site returns 403).
  - Pleiades: 678324, 981512, 648789 and 981527.

## Changed records (Research Lead's commit)

| Record | Verdict | Checked, and fixes |
|---|---|---|
| achaia | Pass | Cassius Dio: author of the *Roman History* and a Roman senator (LacusCurtius). Strabo: author of the Greek *Geography* (Loeb Greek text). |
| antioch-pisidia | Pass | "recorded by Pleiades" became "also recorded". Pleiades is still cited. |
| arabia | Pass after fix | Trajan ("the emperor Trajan") and Pompey ("the Roman commander Pompey the Great"): Livius, *Nabataeans*, which also uses "Arabia Nabataea". **Fix:** "Aretas IV is also named elsewhere as the Nabataean king" was vague, and "elsewhere" could be read as elsewhere in the Bible. It now reads "Aretas IV was the Nabataean king from 9 BC to AD 40" (Livius king list). |
| bethsaida | Pass | Josephus as a first-century Jewish historian: *Life* ("born ... in the first year of the reign of Caius Caesar") and Livius, *Judaea* ("The Jewish historian Flavius Josephus"). `josephus-jewish-war` was rightly added. |
| bithynia | Pass after fix | **Fix:** "this date for the annexation is also independently attested" was jargon. It now reads "Rome's annexation of Bithynia is also dated to that year" (Pleiades: "annexed by Rome in 74 B.C."). It stays outside the ISBE clause, since ISBE dates only the line of kings. |
| caesarea-philippi | Pass after fix | **Fix:** with Pleiades removed, the summary sentence had become circular ("Its two recorded ancient names ... are recorded together as the site's name"). It now reads "In antiquity it was known both as Paneas and as Caesarea Philippi." Pleiades attests both names in the Roman period. Caligula: Josephus, *Antiquities* 18.6.10 (after Tiberius's death, Caius made Agrippa king). |
| cappadocia | Pass | Tacitus: *Annals* (LacusCurtius). |
| cilicia | Pass | Cicero: ISBE ("Cicero, the orator, was governor"). Octavian, the future Augustus: Dio 53.16. Vespasian: Livius ("The emperor Vespasian reunited Cilicia"). Antiochus as a client king: Dio 59.8, Tacitus, *Annals* 12.55, and Livius ("vassal kings"). |
| crete-cyrene | Pass | Dio and Strabo, as for achaia. |
| egypt | Pass after fix | Antony as a general and Cleopatra as queen: Livius, *Actium* ("one of the best generals of his age"; "the queen of Ptolemaic Egypt"). Germanicus: Tacitus, *Annals* 2. **Fix:** Dio 51.17 says only that Augustus "gave it in charge of Cornelius Gallus", so "its first prefect" had no source. Added `bib:strabo-geography` to the summary: Strabo 17.1.53 has "Cornelius Gallus, the first man appointed praefect of the country by Caesar". |
| iconium | Pass | ISBE names Cicero, Strabo, Pliny and Xenophon. World History Encyclopedia: Cicero "was a Roman orator"; Pliny the Elder was a Roman author; Xenophon of Athens wrote the *Hellenica*, "a work on contemporary Greek history". |
| illyricum | Pass | Tacitus, Josephus and Dio are introduced and now cited. |
| italy | Pass | Dio and Suetonius are introduced; both are cited. |
| judea-province | Pass after fix | Josephus, Tacitus and Nero are supported (*Antiquities* 20.8: "Nero succeeded in the government"). **Fix:** history 1 ("... and a small province, and elsewhere classified as a Roman province; this project follows that last classification") did not make clear which description the project follows. It now reads "... both as an autonomous part of Syria under its own governor and as a small province. Other sources classify it as a Roman province in its own right, and this project follows them ..." (Livius; Pleiades: "The Roman province of Iudaea"). |
| libya | Pass after fix | Dio in the summary is fine. **Fix:** history 0 still named "Ptolemy I" without an introduction. It now reads "Ptolemy I, the first Ptolemaic king of Egypt", with new `bib:livius-ptolemy-i-soter` ("after his death king of Egypt, founder of the Ptolemaic dynasty"). |
| lycaonia | Pass after fix | **Fix:** ISBE says only "Antiochus of Commagene under whom it had been placed", which doesn't support "client king". Added `bib:cassius-dio-roman-history` (59.8 and 60.8: Gaius gave him Commagene and Claudius restored it) and `bib:tacitus-annals` (12.55: "in whose kingdom"). |
| magdala | Pass | Josephus is introduced, and `josephus-jewish-war` is now cited. |
| media | Pass | "Livius.org records that" was removed and Livius is still cited. Strabo and Tacitus are introduced. |
| mesopotamia | Pass after fixes | Arrian: World History Encyclopedia ("a Greek historian"). **Fix 1:** "Alexander's campaigns" could be read as the Alexander of Acts 19:33 or 2 Timothy 4:14. It now reads "the campaigns of Alexander the Great", as in Livius and the World History Encyclopedia. **Fix 2:** ISBE says only that the provinces "were restored ... by Hadrian". Added `bib:cassius-dio-roman-history` (Dio 69: Hadrian "declared emperor"). |
| miletus | Pass | "per Livius.org" was removed; Livius is still cited. |
| neapolis-macedonia | Pass | "per Pleiades" was removed; Pleiades is still cited. |
| nicopolis | Pass | Antony and Cleopatra: Livius, *Actium*. Dio, Tacitus and Germanicus are supported. |
| pamphylia | Pass after fix | Galba: Tacitus, *Histories*. Vespasian: Livius ("the emperor Vespasian"). **Fix:** "Pamphylia is also described as part of Galatia until" became "other sources describe Pamphylia as part of Galatia until". |
| parthian-empire | Pass after fix | Crassus, Trajan ("succeeding emperors") and Mithradates I: ISBE and Livius. **Fix:** ISBE says only "in the days of Nero", so added `bib:suetonius-twelve-caesars` for "the Roman emperor Nero". |
| perga | Pass after fix | Same fix as pamphylia. |
| pontus | Pass | Pompey: ISBE ("the hero on the Roman side was the masterful Pompey, appointed in 66 BC"). Polemon: ISBE ("a separate kingdom under Polemon and his house"). Nero: Suetonius, *Nero* 18. |
| puteoli | Pass after fix | **Fix (PO ruling):** removed "per BiblePlaces.com"; the source stays in `sources`. Trajan: BiblePlaces ("Emperor Claudius ... the reign of Trajan (AD 98–117)"). |
| roman-empire | Pass | Antony and Cleopatra: Livius, *Actium*. |
| samaria | Pass | "Per Pleiades" was removed; Pleiades is still cited. |
| sicily | Pass | Dio and Strabo. |
| syria | Pass | Pompey: Livius, *Damascus*, and Dio 37 ("How Pompey brought Syria and Phoenicia under his sway"). Caligula, Antiochus IV, Vespasian and Josephus are supported. |
| tarsus | Pass after fix | **Fix:** Livius, *Cilicia*, says only "When Octavian became sole ruler", so added `bib:livius-actium` ("Octavian could start his one-man rule, calling himself Augustus") for "(the future Augustus)". The summary keeps Pleiades' wording without quotation marks. Pleiades is CC BY, so `docs/LICENSES.md` allows word-for-word use, and it stays cited. |

## Other records fixed in the scan

These six records were `verified` and unchanged before this check. Each change is limited to the words below and is supported by sources already cited, or by the one source added.

| Record | Fix |
|---|---|
| emmaus | "the fourth-century Codex Sinaiticus" → "the fourth-century manuscript Codex Sinaiticus". |
| hierapolis | Removed "per UNESCO" (PO ruling: a website cited as a source). UNESCO stays in `sources`. |
| judea | "The WEB uses" → "The World English Bible (WEB) uses". |
| macedonia | "the revolt of Andriscus" → "the revolt of Andriscus, who claimed to be a son of the Macedonian king Perseus", with `bib:cassius-dio-roman-history` added. Dio, Book 21 (Zonaras), says "A certain Andriscus ... caused a large part of Macedonia to revolt by pretending to be his son". ISBE names Perseus as Philip's son and successor. |
| sychar | "an accepted, non-OSM, non-Wikipedia source" → "an accepted source" (PO ruling). The meaning is unchanged: the project's coordinate rules decide which sources are accepted. |
| tyre | Removed "per UNESCO" (PO ruling). UNESCO stays in `sources`. |

## Remaining names (all 58 records)

After the fixes, none of the 58 About texts names a database or website as the source of a claim. The only matches left are the WEB's name in brackets after its full name, "Upper Mesopotamia" (a place), and scripture references ("per Revelation 1:9", "per Acts 16:9"). Every person, writer and work is introduced or familiar from the Bible. Names kept as written:

- **Familiar from the Bible:** Augustus, Tiberius, Claudius, the Herods (Archelaus, Philip, Agrippa I and II), Pontius Pilate, Quirinius, Gallio, Sergius Paulus, Aretas, Omri, Shalmaneser V and the New Testament people.
- **Introduced by their context:**
  - asia: Attalus III, through "the kingdom that Attalus III of Pergamum left to Rome".
  - pisidia: Amyntas, "the Galatian king".
  - derbe: W. M. Ramsay, among "early explorers".
  - pool-of-siloam: Reich and Shukron, as "Archaeologists".
  - judea-province: Cuspius Fadus, sent "to be procurator".
  - syria: Vitellius, "then governing Syria".
  - media: Vonones, "viceroy of Media".
  - cappadocia: Quintus Veranius, "the governor".
  - Kings named with their titles: Sohaemus, Gotarzes, Artabanus III, Malichus II, Mithridates VI and Archelaus of Cappadocia.
- **Bible translations** (judea): NIV, ESV, NLT, NKJV, CSB and KJV are familiar to Bible readers, so they are left.
- **"Chrestus"** (italy) appears only inside the quotation from Suetonius. Saying who he was would take a side in a scholarly debate, so it is left.
- **The International Standard Bible Encyclopedia** is named in 17 records. It is a work, and its title says what it is. Where sources differ, the text needs to say which source says what. Kept.
- **Dynasties and periods** (Attalid, Ptolemaic, Seleucid, Sasanian, Hellenistic, Crusader, Second Temple) are not people. Kept.

## Validation

- `npm run validate:data`: **0 errors, 107 warnings**. These are the same 107 warnings that were there before this check, about scripture linkage and image width.
- All 620 `bib:` references in `data/locations/` resolve to `data/bibliography.json`.
- `npm test`: **137/137 pass**. `npm run test:app`: **93/93 pass** (14 suites).
- The scope script, run again: no changes outside the scope above, and all 89 records are `verified`.

## Licensing

There is no new upstream publisher. The new entry, `livius-ptolemy-i-soter`, is Livius.org, which is already listed in `ATTRIBUTION.md` and in `docs/LICENSES.md` as cite-only. The World History Encyclopedia (CC BY-NC-SA) and Livius (custom terms) are cited, not quoted, and the new introductions are written in the project's own words, as `docs/LICENSES.md` requires.

## For the PO

1. **UNESCO.** I applied your ruling to "per UNESCO" in `hierapolis` and `tyre`, since the UNESCO World Heritage Centre page is the website cited, and the pattern is the same as "per Pleiades". If you read UNESCO as an organization rather than a website, put those two words back. Sentences in which UNESCO is the subject (for example "UNESCO listed it as a World Heritage Site", in major places) are not affected.
2. **The ISBE by name.** The text names "The International Standard Bible Encyclopedia" in 17 records. It is a work with a self-explaining title, and the text needs it where sources differ, so I kept it. If you want readers told that it dates from the early 20th century, that is a text change for another card.
3. **Candidate `support` text.** These short notes still name datasets ("Pleiades' representative point", "Wikidata's point"). ADR-0033 covers only the About text, and in these notes the dataset is the subject of the sentence (where a coordinate comes from), so I left them.

## Review follow-up

The PR Reviewer (GPT-5.4) found that some role words, such as "the Roman historian Cassius Dio", were supported only by the author's own work (LacusCurtius, CCEL), which doesn't state the author's role. The PO ruled that the introductions stay and must be sourced. I listed every role introduction in the 58 non-major records (55 paragraphs). Wherever no cited source in the paragraph states the role, I cited a biography page that I opened and that states it. The rows above that relied on the author's own work for a role, or on a role the source only implied, are replaced by this section.

| New entry | URL | What it states | Cited in |
|---|---|---|---|
| `worldhistory-cassius-dio` | https://www.worldhistory.org/Cassius_Dio/ | "a Roman politician and historian" | achaia H0, cilicia H0, crete-cyrene H0, egypt S, illyricum H0, italy S, libya S, nicopolis H1, pamphylia H0, perga H0, sicily H1 |
| `worldhistory-strabo` | https://www.worldhistory.org/Strabo_of_Amasia/ | "the author of Geography", of "aristocratic Greek heritage" | achaia H0, crete-cyrene H0, iconium H0, media H0, sicily H1 |
| `worldhistory-tacitus` | https://www.worldhistory.org/tacitus/ | "a Roman historian" | cappadocia H0, cilicia H0, egypt H1, illyricum H0, judea-province H1, media H0, nicopolis H1, pamphylia H0, perga H0 |
| `worldhistory-josephus` | https://www.worldhistory.org/Flavius_Josephus/ | "a 1st-century CE Jewish historian" | bethsaida H0, illyricum H0, judea-province H0, magdala H0, syria H2 |
| `worldhistory-suetonius` | https://www.worldhistory.org/Suetonius/ | "a Roman writer" (so the text now reads "the Roman writer Suetonius", not "historian") | italy H1, pontus H0 |
| `worldhistory-caligula` | https://www.worldhistory.org/Caligula/ | "the third Roman emperor" | caesarea-philippi H0, cilicia H0, judea-province H2, syria H1 |
| `worldhistory-nero` | https://www.worldhistory.org/Nero/ | "the fifth Roman emperor" | judea-province H4, parthian-empire H1 (replaces my earlier Suetonius citation there), pontus H0 |
| `worldhistory-trajan` | https://www.worldhistory.org/trajan/ | "Roman emperor from 98 to 117 CE" | mesopotamia H1, parthian-empire H1, puteoli S |
| `worldhistory-galba` | https://www.worldhistory.org/Galba/ | "Roman emperor from June 68 to January 69 CE" | pamphylia H0, perga H0 |
| `worldhistory-pompey` | https://www.worldhistory.org/pompey/ | "a military leader and politician during the fall of the Roman Republic" | pontus H0, syria H0 |
| `worldhistory-germanicus` | https://www.worldhistory.org/Germanicus/ | "a commander in the Roman Empire" | egypt H1, nicopolis H1 |
| `worldhistory-crassus` | https://www.worldhistory.org/Marcus_Licinius_Crassus/ | one of Sulla's "most able commanders", who led the invasion of Parthia | parthian-empire H1 |
| `bas-siloam-pool` | https://www.biblicalarchaeology.org/daily/biblical-sites-places/biblical-archaeology-sites/the-siloam-pool-where-jesus-healed-the-blind-man/ | "archaeologists Ronny Reich and Eli Shukron" | pool-of-siloam H0 |
| `codexsinaiticus-about` | https://codexsinaiticus.org/en/codex/ | "a manuscript of the Christian Bible written in the middle of the fourth century" | emmaus H0 |

Existing entries are now also cited where they state the role:
- `livius-actium` ("Octavian could start his one-man rule, calling himself Augustus") for "(the future Augustus)" in cilicia H0 and syria H1.
- `worldhistory-cicero` for "the Roman orator Cicero" in cilicia H0.

No new source was needed where a cited source already states the role:
- Livius for Trajan and Pompey in arabia, Vespasian, Antony, Cleopatra, Octavian, Mithradates I and Ptolemy I.
- ISBE for Polemon, Mithridates VI ("king at Amasia"), Amyntas, Artabanus III and Perseus.
- Dio 69 for Hadrian.
- Tacitus for Archelaus, Quintus Veranius, Gotarzes and Vonones.

**Notes:**
- `worldhistory-josephus` and `worldhistory-strabo` use the ids the PO set, although the pages are titled "Flavius Josephus" and "Strabo of Amasia". `worldhistory-crassus` likewise uses the name in the text.
- `bas-siloam-pool` is copied unchanged from M3-16's branch, so that branch and this one share one entry.
- The Codex Sinaiticus Project is a new cite-only publisher. It is covered by the cite-only row in `ATTRIBUTION.md`.
- `pool-of-siloam` is the 39th changed record and is set to `verified` (2026-10-05).

**Checks after the follow-up:**
- A script checked 93 role introductions in the 58 records against the sources confirmed above. Each one is stated by a cited source.
- The scope script still finds only About text, added sources and `lastReviewed` changed, all in non-major records.
- `validate:data`: 0 errors and the same 107 warnings.
- All 673 `bib:` references resolve, with no duplicate ids.
- `npm test`: 137/137. `npm run test:app`: 93/93.
- **Plain wording for readers (PO ruling, 2026-10-05):** the About text no longer refers to the data as "this record" or "the X record". Each such clause now says "this map" or names the place, with no change to the facts or sources: arabia S, bethsaida H2, bithynia H0, illyricum H0, judea-province S, libya S, lycaonia S and H0, pamphylia S and H1, phrygia S and H0, and sicily H0. `phrygia` is now the 40th changed record and is `verified` (2026-10-05). None of the 58 About texts says "Turkey" or "Turkish", so no "Türkiye" change was needed.
