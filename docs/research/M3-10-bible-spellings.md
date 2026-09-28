# M3-10 — Bible-version spelling comparison

## Method

For each of the 63 records in `data/locations/`, I looked up the place's name in a verse
that names it (using the record's own `scripture` refs, or its `otConnections` ref where a
place is named only in an Old Testament connection), in six English Bible versions:

- **NIV** — New International Version, 2011 text edition (Biblica)
- **ESV** — English Standard Version, 2016 text edition (Crossway). BibleGateway's live page
  for the ESV currently states "ESV Text Edition: 2025" in its copyright notice; the spelling
  differences this table records (Cenchreae/Cenchrea, Colossae/Colosse) are unaffected by
  that later text-edition update, but this is flagged for the Fact-Checker.
- **NLT** — New Living Translation, 2015 text edition (Tyndale House Foundation / Tyndale
  House Publishers)
- **KJV** — King James Version, 1769 Oxford standard text (the modern standard printing of
  the 1611 Authorized Version; BibleGateway's own version-info page carries no copyright or
  edition statement for the KJV, consistent with its public-domain status)
- **NKJV** — New King James Version, 1982 (Thomas Nelson)
- **CSB** — Christian Standard Bible, 2017 (Holman Bible Publishers)

**Site used:** BibleGateway.com (`https://www.biblegateway.com/passage/?search=<ref>&version=<VERSION>`),
which displays each version's licensed text under its own publisher's terms. BibleGateway
caps combined-version passage lookups at 25 references per request, so the reference list was
split into three batches and each of the six versions was queried once per batch (single-verse,
single-version requests have no such cap).

**Read date:** 2026-09-28.

**The rule (ADR-0026, card "The rule"):** the title (`names.ancient[0]`) is the spelling most
of the six versions agree on; an even split falls back to the WEB's spelling (from the
record's own `textWEB`, or, for the one Old Testament comparison below, the project's
committed WEB snapshot `data/reference/engwebp_vpl.txt`). Every other English spelling any of
the six versions or the WEB uses stays in `names.ancient` or `names.alternate`. Names in other
languages, and ancient-language forms English doesn't use, move to `names.otherLanguages`.

**Never copied:** verse text. The table below records only the spelling of the name in each
version, never the surrounding sentence.

**Table legend:** "chosen title" is the current `names.ancient[0]` after this pass. "note"
says whether the title changed, and lists any name moved to `otherLanguages` or newly added
for search. Borderline calls (per the card's own examples: "Judaea", "Pergamon") are marked
**borderline** with the reasoning. Places the Bible does not name by a proper name of their
own (only the Temple Mount, in this dataset) are marked **not Bible-named**.

## Table

| record | verse | NIV | ESV | NLT | KJV | NKJV | CSB | WEB | chosen title | note |
|---|---|---|---|---|---|---|---|---|---|---|
| antioch-pisidia | Acts 13:14 | Pisidian Antioch | Antioch in Pisidia | Antioch of Pisidia | Antioch in Pisidia | Antioch in Pisidia | Pisidian Antioch | Antioch of Pisidia | Antioch in Pisidia | Unchanged (3/6: ESV, KJV, NKJV). Added "Pisidian Antioch" and "Antioch of Pisidia" as alternates so NIV/CSB and NLT/WEB readers can search the phrase they know. Moved "Colonia Caesarea" (Latin) to otherLanguages. |
| antioch-syria | Acts 11:19 | Antioch | Antioch | Antioch of Syria | Antioch | Antioch | Antioch | Antioch | Antioch on the Orontes | Unchanged; the Bible just says "Antioch," so the scholarly disambiguator stays from the record's own sources. Added "Antioch of Syria" (NLT) as alternate. Moved "Theoupolis" (Byzantine Greek) and "Antiochia" (Latin/Greek) to otherLanguages. |
| athens | Acts 18:1 | Athens | Athens | Athens | Athens | Athens | Athens | Athens | Athens | Unchanged (6/6). Moved "Athenae" (Latin) to otherLanguages. |
| berea | Acts 17:10 | Berea | Berea | Berea | Berea | Berea | Berea | Beroea | Berea | Unchanged (6/6); WEB's "Beroea" stays (ADR-0026's own example). |
| bethany-beyond-the-jordan | John 1:28 | Bethany | Bethany | Bethany | Bethabara | Bethabara | Bethany | Bethany | Bethany beyond the Jordan | Unchanged (4/6). "Bethabara" (KJV/NKJV) stays, explicitly authorized by the card. |
| bethany | Matthew 21:17 | Bethany | Bethany | Bethany | Bethany | Bethany | Bethany | Bethany | Bethany | Unchanged (6/6). No other-language names present. |
| bethlehem | Matthew 2:1 | Bethlehem | Bethlehem | Bethlehem | Bethlehem | Bethlehem | Bethlehem | Bethlehem | Bethlehem | Unchanged (6/6). Moved "Beit Lahm" (Arabic) to otherLanguages. |
| bethsaida | Matthew 11:21 | Bethsaida | Bethsaida | Bethsaida | Bethsaida | Bethsaida | Bethsaida | Bethsaida | Bethsaida | Unchanged (6/6). Moved "Julias" (the Herodian Greek/Latin honorific renaming) to otherLanguages, per the card's own example. |
| caesarea-maritima | Acts 10:1 | Caesarea | Caesarea | Caesarea | Caesarea | Caesarea | Caesarea | Caesarea | Caesarea Maritima | Unchanged; the Bible just says "Caesarea" — "Maritima" is the record's own scholarly disambiguator from Caesarea Philippi. No other-language names present. |
| caesarea-philippi | Matthew 16:13 | Caesarea Philippi | Caesarea Philippi | Caesarea Philippi | Caesarea Philippi | Caesarea Philippi | Caesarea Philippi | Caesarea Philippi | Caesarea Philippi | Unchanged (6/6). **Borderline:** kept "Paneas" (the standard English form used by Pleiades and general scholarship for the pre-Roman sanctuary name). Moved "Panias" (a less-standard transliteration) to otherLanguages. |
| cana | John 2:1 | Cana in Galilee | Cana in Galilee | Cana in Galilee | Cana of Galilee | Cana of Galilee | Cana of Galilee | Cana of Galilee | Cana | Unchanged. Added "Cana in Galilee" (NIV/ESV/NLT) as alternate alongside the existing "Cana of Galilee." |
| capernaum | Matthew 4:13 | Capernaum | Capernaum | Capernaum | Capernaum | Capernaum | Capernaum | Capernaum | Capernaum | Unchanged (6/6). Moved "Kfar Nahum" (Hebrew) and "Talhum" (Arabic) to otherLanguages — the card's own lead example. |
| cenchreae | Acts 18:18 | Cenchreae | Cenchreae | Cenchrea | Cenchrea | Cenchrea | Cenchreae | Cenchreae | Cenchreae | Even split (3/3); WEB tiebreak keeps "Cenchreae." Added "Cenchrea" (NLT/KJV/NKJV) as alternate. **Borderline:** moved "Kenchreai" (a Greek transliteration not used by English reference works, which say "Cenchreae") to otherLanguages. |
| chorazin | Matthew 11:21 | Chorazin | Chorazin | Korazin | Chorazin | Chorazin | Chorazin | Chorazin | Chorazin | Unchanged (5/6). "Korazin" (NLT) stays — an English Bible spelling, not moved. |
| colossae | Colossians 1:2 | Colossae | Colossae | Colosse | Colosse | Colosse | Colossae | Colossae | Colossae | Even split (3/3); WEB tiebreak keeps "Colossae." "Colosse" (NLT/KJV/NKJV) already present, no change. |
| corinth | Acts 18:1 | Corinth | Corinth | Corinth | Corinth | Corinth | Corinth | Corinth | Corinth | Unchanged (6/6). Moved "Korinthos" (Greek) to otherLanguages — the card's own example. |
| crete | Acts 27:7 | Crete | Crete | Crete | Crete | Crete | Crete | Crete | Crete | Unchanged (6/6). Moved "Creta" (Latin) and "Kriti" (Greek) to otherLanguages. |
| damascus | Acts 9:2 | Damascus | Damascus | Damascus | Damascus | Damascus | Damascus | Damascus | Damascus | Unchanged (6/6). Moved "Darmeseq" (Hebrew) to otherLanguages. |
| derbe | Acts 14:6 | Derbe | Derbe | Derbe | Derbe | Derbe | Derbe | Derbe | Derbe | Unchanged (6/6). Moved "Claudioderbe" (the city's Latin honorific name) to otherLanguages. |
| emmaus | Luke 24:13 | Emmaus | Emmaus | Emmaus | Emmaus | Emmaus | Emmaus | Emmaus | Emmaus | Unchanged (6/6). No other-language names present. |
| ephesus | Acts 18:19 | Ephesus | Ephesus | Ephesus | Ephesus | Ephesus | Ephesus | Ephesus | Ephesus | Unchanged (6/6). Moved "Arsinoeia" (the city's brief Hellenistic Greek renaming) to otherLanguages. |
| galatia | Galatians 1:2 | Galatia | Galatia | Galatia | Galatia | Galatia | Galatia | Galatia | Galatia | Unchanged (6/6). No other-language names present. |
| galilee | Matthew 4:12 | Galilee | Galilee | Galilee | Galilee | Galilee | Galilee | Galilee | Galilee | Unchanged (6/6). No other-language names present. |
| gethsemane | Matthew 26:36 | Gethsemane | Gethsemane | Gethsemane | Gethsemane | Gethsemane | Gethsemane | Gethsemane | Gethsemane | Unchanged (6/6). No other-language names present. |
| golgotha | Matthew 27:33; Luke 23:33 | Golgotha / the Skull | Golgotha / The Skull | Golgotha / The Skull | Golgotha / Calvary | Golgotha / Calvary | Golgotha / The Skull | Golgotha / The Skull | Golgotha | Unchanged (6/6 on "Golgotha"). Added "The Skull" (Luke 23:33; WEB and 4/6 versions) as alternate — a name this record already cites via `scripture:Luke 23:33` but had not yet listed. "Calvary" (KJV/NKJV, from the same verse) was already present. |
| hierapolis | Colossians 4:13 | Hierapolis | Hierapolis | Hierapolis | Hierapolis | Hierapolis | Hierapolis | Hierapolis | Hierapolis | Unchanged (6/6). No other-language names present. |
| iconium | Acts 13:51 | Iconium | Iconium | Iconium | Iconium | Iconium | Iconium | Iconium | Iconium | Unchanged (6/6). Moved "Claudiconium" (the city's Latin honorific name) to otherLanguages. |
| jericho | Luke 19:1 | Jericho | Jericho | Jericho | Jericho | Jericho | Jericho | Jericho | Jericho | Unchanged (6/6). Moved "Hierichous" (a Greek transliteration) and "Ariha" (Arabic) to otherLanguages. |
| jerusalem | Matthew 2:1 | Jerusalem | Jerusalem | Jerusalem | Jerusalem | Jerusalem | Jerusalem | Jerusalem | Jerusalem | Unchanged (6/6). Moved "Hierosolyma" and "Ierusalem" (Latin/Greek forms) and "Yerushalayim" (Hebrew) and "Al-Quds" (Arabic) to otherLanguages. |
| joppa | Acts 9:36 | Joppa | Joppa | Joppa | Joppa | Joppa | Joppa | Joppa | Joppa | Unchanged (6/6). Moved "Yafo" and "Iafo" (Hebrew transliterations) to otherLanguages. |
| judea | Matthew 2:1 | Judea | Judea | Judea | Judaea | Judea | Judea | Judea | Judea | Unchanged (5/6). **Borderline** (the card's own example): kept "Judaea" (KJV) — a standard English Bible spelling still in wide scholarly use, not moved. |
| laodicea | Colossians 4:13 | Laodicea | Laodicea | Laodicea | Laodicea | Laodicea | Laodicea | Laodicea | Laodicea | Unchanged (6/6). Kept "Laodicea on the Lycus" (standard English scholarly form). Moved "Laodicea ad Lycum" (the Latin form of the same name) to otherLanguages. |
| lystra | Acts 14:6 | Lystra | Lystra | Lystra | Lystra | Lystra | Lystra | Lystra | Lystra | Unchanged (6/6). **Borderline:** moved "Khatun Serai" (an older transliteration of the modern Turkish village Hatunsaray, already covered by `names.modern`) to otherLanguages. Kept "Tel Lystra" (used in the record's own English-language candidate label). |
| magdala | Matthew 15:39; Mark 8:10 | Magadan / Dalmanutha | Magadan / Dalmanutha | Magadan / Dalmanutha | Magdala / Dalmanutha | Magdala / Dalmanutha | Magadan / Dalmanutha | Magdala / Dalmanutha | Magdala | **Flagged, not a simple vote:** 4 of 6 versions (NIV, ESV, NLT, CSB) render Matthew 15:39 as "Magadan," following the modern critical Greek text; KJV and NKJV follow the Byzantine tradition's "Magdala," matching the WEB. This is a manuscript-tradition variant, not a spelling difference the rule was written to arbitrate. I kept "Magdala" as the title because it anchors the record's identification with the modern town Migdal and the "Magdalene" epithet (both cited in the record's own summary), and flag this call for the PO/Fact-Checker to confirm. "Dalmanutha" (Mark 8:10, 6/6) is unaffected and stays. Moved "Taricheae" (Josephus' Greek name for the town) to otherLanguages. |
| malta | Acts 28:1 | Malta | Malta | Malta | Melita | Malta | Malta | Malta | **Malta** | **Changed** from "Melita" to "Malta" (5/6 plus WEB; only the KJV has "Melita") — this is the card's own worked example. Kept "Melita" (KJV). Moved "Melite" (attested by none of the six versions or the WEB) to otherLanguages. |
| miletus | Acts 20:15 | Miletus | Miletus | Miletus | Miletus | Miletus | Miletus | Miletus | Miletus | Unchanged (6/6). Moved "Milawanda" (the Bronze Age Hittite-era name) to otherLanguages. |
| mount-of-olives | Luke 19:29 | Mount of Olives | Olivet | Mount of Olives | the mount of Olives | Olivet | Mount of Olives | Olivet | Mount of Olives | Unchanged (4/6). "Olivet" (ESV/NKJV, matching the WEB) stays. Moved "Jabal at-Tur" (Arabic) to otherLanguages. |
| nain | Luke 7:11 | Nain | Nain | Nain | Nain | Nain | Nain | Nain | Nain | Unchanged (6/6). No other-language names present. |
| nazareth | Matthew 2:23 | Nazareth | Nazareth | Nazareth | Nazareth | Nazareth | Nazareth | Nazareth | Nazareth | Unchanged (6/6). Moved "an-Nasira" (Arabic) to otherLanguages. Kept "Nazarene" (an English New Testament demonym for a person from Nazareth, not a foreign-language name). |
| neapolis-macedonia | Acts 16:11 | Neapolis | Neapolis | Neapolis | Neapolis | Neapolis | Neapolis | Neapolis | Neapolis | Unchanged (6/6). No other-language names present. |
| nicopolis | Titus 3:12 | Nicopolis | Nicopolis | Nicopolis | Nicopolis | Nicopolis | Nicopolis | Nicopolis | Nicopolis | Unchanged (6/6). No other-language names present. |
| paphos | Acts 13:13 | Paphos | Paphos | Paphos | Paphos | Paphos | Paphos | Paphos | Paphos | Unchanged (6/6). **Borderline:** kept "Nea Paphos" (the standard English/UNESCO scholarly name for the Hellenistic city) and "New Paphos" (its English translation). |
| patmos | Revelation 1:9 | Patmos | Patmos | Patmos | Patmos | Patmos | Patmos | Patmos | Patmos | Unchanged (6/6). No other-language names present. |
| perga | Acts 13:13 | Perga | Perga | Perga | Perga | Perga | Perga | Perga | Perga | Unchanged (6/6). **Borderline** (the card's own example): kept "Perge" — the standard English archaeological-site name. |
| pergamum | Revelation 2:12 | Pergamum | Pergamum | Pergamum | Pergamos | Pergamos | Pergamum | Pergamum | Pergamum | Unchanged (4/6). Added "Pergamos" (KJV/NKJV) as alternate. **Borderline** (the card's own example): kept "Pergamon" — the standard English archaeological/museum name (for example, Berlin's Pergamon Museum). |
| philadelphia-lydia | Revelation 3:7 | Philadelphia | Philadelphia | Philadelphia | Philadelphia | Philadelphia | Philadelphia | Philadelphia | Philadelphia | Unchanged (6/6). **Borderline:** moved "Philadelpheia" (a Greek New Testament transliteration with no independent English usage, unlike "Pergamon"/"Perge"/"Paneas") to otherLanguages. |
| philippi | Acts 16:12 | Philippi | Philippi | Philippi | Philippi | Philippi | Philippi | Philippi | Philippi | Unchanged (6/6). Moved "Krenides" (the pre-Roman Thracian/Greek name) and "Colonia Iulia Augusta Philippensis" (the full Latin colonial name) to otherLanguages. |
| pool-of-bethesda | John 5:2 | Bethesda | Bethesda | Bethesda | Bethesda | Bethesda | Bethesda | Bethesda | Bethesda | Unchanged (6/6). **Borderline:** moved "Bezetha" (Josephus' Greek name for the nearby Jerusalem quarter, not itself a name for the pool) to otherLanguages. |
| pool-of-siloam | John 9:7 | Siloam | Siloam | Siloam | Siloam | Siloam | Siloam | Siloam | Siloam | Unchanged (6/6). Kept "Shelah" (the pool's Old Testament English name, Nehemiah 3:15). Moved "Silwan" (the Arabic name of the adjoining modern village) to otherLanguages. |
| puteoli | Acts 28:13 | Puteoli | Puteoli | Puteoli | Puteoli | Puteoli | Puteoli | Puteoli | Puteoli | Unchanged (6/6). Moved "Dikaiarcheia" (the city's earlier Greek name) to otherLanguages. |
| rome | Acts 18:2 | Rome | Rome | Rome | Rome | Rome | Rome | Rome | Rome | Unchanged (6/6). Moved "Roma" (Latin/Italian) to otherLanguages. |
| salamis-cyprus | Acts 13:5 | Salamis | Salamis | Salamis | Salamis | Salamis | Salamis | Salamis | Salamis | Unchanged (6/6). No other-language names present. |
| samaria | John 4:5 | Samaria | Samaria | Samaria | Samaria | Samaria | Samaria | Samaria | Samaria | Unchanged (6/6). Moved "Shomron" (Hebrew) to otherLanguages. |
| sardis | Revelation 3:1 | Sardis | Sardis | Sardis | Sardis | Sardis | Sardis | Sardis | Sardis | Unchanged (6/6). No other-language names present. |
| sea-of-galilee | Matthew 4:18; John 6:1; Numbers 34:11 | Sea of Galilee / Sea of Tiberias / Sea of Galilee | Sea of Galilee / Sea of Tiberias / Sea of Chinnereth | Sea of Galilee / Sea of Tiberias / Sea of Galilee | sea of Galilee / sea of Tiberias / sea of Chinnereth | Sea of Galilee / Sea of Tiberias / Sea of Chinnereth | Sea of Galilee / Sea of Tiberias / Sea of Chinnereth | sea of Galilee / Sea of Tiberias / sea of Chinnereth | Sea of Galilee | Unchanged (6/6 on the main name). Kept "Sea of Tiberias" (John 6:1, 6/6) and "Sea of Chinnereth" (Numbers 34:11, 4/6 plus WEB). "Lake of Gennesaret" was already present and is authorized directly by ADR-0026's own text. Moved "Yam Kinneret" (Hebrew) to otherLanguages. |
| smyrna | Revelation 2:8 | Smyrna | Smyrna | Smyrna | Smyrna | Smyrna | Smyrna | Smyrna | Smyrna | Unchanged (6/6). No other-language names present. |
| sychar | John 4:5 | Sychar | Sychar | Sychar | Sychar | Sychar | Sychar | Sychar | Sychar | Unchanged (6/6). No other-language names present. |
| tarsus | Acts 9:11 | Tarsus | Tarsus | Tarsus | Tarsus | Tarsus | Tarsus | Tarsus | Tarsus | Unchanged (6/6). No other-language names present. |
| temple-mount | — | — | — | — | — | — | — | — | The Temple | **Not Bible-named.** The Gospels and Acts call this place "the temple," a common noun, never a proper name resembling "Temple Mount." No version comparison applies; "The Temple" and "Herod's Temple" are the standard English names from the record's own sources (Ritmeyer; Wikidata). Moved "Har haBayit" (Hebrew) to otherLanguages. |
| thessalonica | Acts 17:1 | Thessalonica | Thessalonica | Thessalonica | Thessalonica | Thessalonica | Thessalonica | Thessalonica | Thessalonica | Unchanged (6/6). No other-language names present. |
| thyatira | Revelation 2:18 | Thyatira | Thyatira | Thyatira | Thyatira | Thyatira | Thyatira | Thyatira | Thyatira | Unchanged (6/6). No other-language names present. |
| troas | Acts 16:8 | Troas | Troas | Troas | Troas | Troas | Troas | Troas | Troas | Unchanged (6/6). "Alexandria Troas" stays — explicitly authorized by ADR-0026's own text. |
| tyre | Matthew 11:21 | Tyre | Tyre | Tyre | Tyre | Tyre | Tyre | Tyre | Tyre | Unchanged (6/6). Kept "Tyrus" (the King James Old Testament spelling, for example Ezekiel 26). Moved "Sour" (Arabic) to otherLanguages. |

## Records with no table row needed

None. Every one of the 63 records has a row above; `temple-mount` is the only place the Bible
does not name directly, and is marked accordingly.
