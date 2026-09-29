# M3-10 verification — English-only names

Independent verification of the Research Lead's commit `aedde04` ("data(locations): make displayed names English") against ADR-0026 and the card (`docs/tasks/M3-10-english-names.md`). The baseline is `016d2cd`, the commit just before the data change. Reviewed 2026-09-28.

**Result:** all 63 records are `verified`, and none failed. This commit fixes 7 records and two bibliography entries: five missing Bible spellings added, one borderline call overturned (Paneas) and one pre-existing misquotation corrected. Magdala's title is confirmed as defensible, but it needs the human's decision (see "Magdala").

## Scope

- All 63 `data/locations/*.json` records and the six new entries in `data/bibliography.json`.
- The spelling table in `docs/research/M3-10-bible-spellings.md`.
- The Research Lead's validator change (`scripts/lib/validator.mjs`, `tests/validator.test.mjs`, `schema/README.md`).
- Licensing of the six Bible versions (`docs/LICENSES.md`, `ATTRIBUTION.md`).

Out of scope, as the card says: `names.modern`, candidate labels, other fields and app code. The one exception is the mount-of-olives quotation fix, explained under "No copied verse text".

## Method

1. **Semantic diff.** A node script parsed every location file and the bibliography at `016d2cd` and in the working tree, then walked both field by field. It ran on the Research Lead's commit and again on the final state.
2. **Every cited verse, in all six versions.** I fetched every verse the 63 records cite (`scripture[]` and `otConnections[]`) from BibleGateway.com in the NIV, ESV, NLT, KJV, NKJV and CSB. That is 703 record-verse pairs and 561 distinct references, in 174 requests of 20 references each, read 2026-09-28. Headings, footnotes and cross-references were stripped. The WEB came from the committed snapshot (`data/reference/engwebp_vpl.txt`) and each record's `textWEB`. The fetched text stayed in a temporary folder outside the repository and was deleted after the session.
   - **The table:** all 462 cells of the Research Lead's table (each version and WEB cell of the 62 rows that have a verse) were checked against the fetched text of the stated verse.
   - **Missing spellings:** for each of the 703 pairs, I checked whether each version's text contains one of the record's `names.ancient` or `names.alternate`, and reviewed every miss. A fuzzy pass (edit distance up to 2) then looked for variant spellings in verses where another name had already matched.
3. **Rule application.** I listed every `ancient`/`alternate` name that appears in no cited verse of any version (15 names on 12 records). I checked each one, and every `otherLanguages` entry, against the record's own sources: Pleiades name records (with their language tags), Wikidata English labels and aliases, DARE, OpenBible.info's ancient and modern data, and the record's `bib:` entries.
4. **Copying.** I built 6-word sequences from all fetched text in the six versions and kept the 46,063 that don't also occur in the WEB. Then I searched all 319 tracked text files for them.
5. **Bibliography and licensing.** I read each version's copyright notice on BibleGateway's passage pages and its version-information page.
6. **Validator.** I read the change against `c0b1718`, its tests and `schema/README.md`, and ran the full test suite.

## Semantic diff

**The Research Lead's commit (`aedde04`) against `016d2cd`: confirmed.**
- 37 of 63 location files changed. The only paths that differ are `names.ancient` (24 files), `names.alternate` (22), `names.otherLanguages` (34), `summary.sources` (36) and `status`/`verifiedBy`/`lastReviewed` (37).
- `summary.sources` gained only the same six `bib:` IDs in every file. Nothing was removed or reordered.
- `temple-mount` changed its names only; the Bible doesn't name it, so no version is cited.
- Bibliography: 31 entries became 37. No existing entry changed or moved.
- Minor: the commit body says 33 records gained `otherLanguages`. Its own list has 34, which matches the data.

**The final state (this commit) against `016d2cd`:**
- 38 files changed; judea is new to the set because of the "Jewry" fix. Changed paths: `names.ancient` (25), `names.alternate` (24), `names.otherLanguages` (34), `summary.sources` (37, `bib:` additions only), `lastReviewed` (11), and one `otConnections` note (mount-of-olives, see "No copied verse text").
- `status` and `verifiedBy` are back to their baseline values: every changed record was `verified`/`fact-checker` before and is again.
- **No name was lost.** Every name at `016d2cd` is still in `ancient`, `alternate` or `otherLanguages`. The only title change is malta ("Melita" → "Malta"). `names.modern` is unchanged everywhere.
- 13 names were added: 8 by the Research Lead ("Pisidian Antioch", "Antioch of Pisidia", "Antioch of Syria", "Cana in Galilee", "Cenchrea", "The Skull", "Pergamos", "Malta") and 5 by this verification (see "Fixes").

## Spelling spot-check

I checked every row of the table, not only a sample. Of the 462 cells, 460 match the version's text. The two that don't are both corrected in the table, and neither changes a title:
- **samaria, NLT, John 4:5:** the NLT doesn't name Samaria in this verse; it says "Samaritan village". Samaria is 5 of the 5 versions that name it, so the title stands.
- **sea-of-galilee, CSB, John 6:1:** the CSB reads "Sea of Galilee (or Tiberias)", not "Sea of Tiberias". It's the same name, and "Sea of Tiberias" stays.

The rows the card requires (the title change, both even splits and Magdala), and 20 unchanged titles:

| Record | Verse | NIV | ESV | NLT | KJV | NKJV | CSB | WEB | Title | Result |
|---|---|---|---|---|---|---|---|---|---|---|
| malta | Acts 28:1 | Malta | Malta | Malta | Melita | Malta | Malta | Malta | Malta | Match. **Title change confirmed** (5/6). |
| cenchreae | Acts 18:18; Romans 16:1 | Cenchreae | Cenchreae | Cenchrea | Cenchrea | Cenchrea | Cenchreae | Cenchreae | Cenchreae | Match, in both verses. **Even split confirmed** (3/3); the WEB tiebreak gives "Cenchreae". |
| colossae | Colossians 1:2 | Colossae | Colossae | Colosse | Colosse | Colosse | Colossae | Colossae | Colossae | Match. **Even split confirmed** (3/3); the WEB tiebreak gives "Colossae". |
| magdala | Matthew 15:39; Mark 8:10 | Magadan / Dalmanutha | Magadan / Dalmanutha | Magadan / Dalmanutha | Magdala / Dalmanutha | Magdala / Dalmanutha | Magadan / Dalmanutha | Magdala / Dalmanutha | Magdala | Match. The title is discussed under "Magdala". |
| antioch-pisidia | Acts 13:14 | Pisidian Antioch | Antioch in Pisidia | Antioch of Pisidia | Antioch in Pisidia | Antioch in Pisidia | Pisidian Antioch | Antioch of Pisidia | Antioch in Pisidia | Match (plurality 3/6). |
| antioch-syria | Acts 11:19 | Antioch | Antioch | Antioch of Syria | Antioch | Antioch | Antioch | Antioch | Antioch on the Orontes | Match. "Antioch" is kept in the title with its disambiguator and is searchable on its own. |
| berea | Acts 17:10 | Berea | Berea | Berea | Berea | Berea | Berea | Beroea | Berea | Match (6/6). |
| bethany-beyond-the-jordan | John 1:28 | Bethany | Bethany | Bethany | Bethabara | Bethabara | Bethany | Bethany | Bethany beyond the Jordan | Match (4/6). |
| cana | John 2:1 | Cana in Galilee | Cana in Galilee | Cana in Galilee | Cana of Galilee | Cana of Galilee | Cana of Galilee | Cana of Galilee | Cana | Match. |
| capernaum | Matthew 4:13 | Capernaum | Capernaum | Capernaum | Capernaum | Capernaum | Capernaum | Capernaum | Capernaum | Match (6/6). |
| chorazin | Matthew 11:21 | Chorazin | Chorazin | Korazin | Chorazin | Chorazin | Chorazin | Chorazin | Chorazin | Match (5/6). |
| golgotha | Matthew 27:33; Luke 23:33 | Golgotha / the Skull | Golgotha / The Skull | Golgotha / The Skull | Golgotha / Calvary | Golgotha / Calvary | Golgotha / The Skull | Golgotha / The Skull | Golgotha | Match (6/6). "Place of the Skull" was missing; added (see "Fixes"). |
| jerusalem | Matthew 2:1 | Jerusalem | Jerusalem | Jerusalem | Jerusalem | Jerusalem | Jerusalem | Jerusalem | Jerusalem | Match (6/6). |
| judea | Matthew 2:1 | Judea | Judea | Judea | Judaea | Judea | Judea | Judea | Judea | Match (5/6). The KJV's "Jewry" was missing; added. |
| mount-of-olives | Luke 19:29 | Mount of Olives | Olivet | Mount of Olives | the mount of Olives | Olivet | Mount of Olives | Olivet | Mount of Olives | Match (4/6). |
| perga | Acts 13:13 | Perga | Perga | Perga | Perga | Perga | Perga | Perga | Perga | Match (6/6). |
| pergamum | Revelation 2:12 | Pergamum | Pergamum | Pergamum | Pergamos | Pergamos | Pergamum | Pergamum | Pergamum | Match (4/6). |
| philadelphia-lydia | Revelation 3:7 | Philadelphia | Philadelphia | Philadelphia | Philadelphia | Philadelphia | Philadelphia | Philadelphia | Philadelphia | Match (6/6). |
| pool-of-bethesda | John 5:2 | Bethesda | Bethesda | Bethesda | Bethesda | Bethesda | Bethesda | Bethesda | Bethesda | Match (6/6). |
| pool-of-siloam | John 9:7 | Siloam | Siloam | Siloam | Siloam | Siloam | Siloam | Siloam | Siloam | Match (6/6). The KJV's "Siloah" (Nehemiah 3:15) was missing; added. |
| samaria | John 4:5 | Samaria | Samaria | — (not named) | Samaria | Samaria | Samaria | Samaria | Samaria | Table cell corrected (NLT). |
| sea-of-galilee | Matthew 4:18; John 6:1; Numbers 34:11 | Sea of Galilee / Sea of Tiberias / Sea of Galilee | Sea of Galilee / Sea of Tiberias / Sea of Chinnereth | Sea of Galilee / Sea of Tiberias / Sea of Galilee | sea of Galilee / sea of Tiberias / sea of Chinnereth | Sea of Galilee / Sea of Tiberias / Sea of Chinnereth | Sea of Galilee / (or) Tiberias / Sea of Chinnereth | sea of Galilee / Sea of Tiberias / sea of Chinnereth | Sea of Galilee | Table cell corrected (CSB, John 6:1). |
| troas | Acts 16:8 | Troas | Troas | Troas | Troas | Troas | Troas | Troas | Troas | Match (6/6). |
| tyre | Matthew 11:21 | Tyre | Tyre | Tyre | Tyre | Tyre | Tyre | Tyre | Tyre | Match (6/6). |

**Every title follows the rule** except where a disambiguator or the Temple Mount case applies, and Magdala:
- **Disambiguators (confirmed):** antioch-syria, caesarea-maritima, bethany-beyond-the-jordan and antioch-pisidia add a qualifier to the spelling the versions share, to tell two same-named records apart. The Bible's spelling is kept inside the title. M3-05's word-start matching finds "Bethany", and "Antioch" and "Caesarea" are alternates of their own.
- **temple-mount (confirmed):** every version calls it "the temple", a common noun, so the card's "not named in the Bible" case applies.

**Missing spellings.** The table compares one verse per record, but the rule asks for every spelling the versions use. Across all 703 cited verses, five versions use a spelling of the same place that the record lacked. All five are added (see "Fixes"). The other misses are verses that don't name the place, or demonyms ("Galileans", "Samaritan", "Laodiceans", "Cretians", "Berean", "Judean"), which are not place names.

Two cases are **not** added, because they are different names rather than spellings, and adding them is an editorial call:
- **judea:** "Judah" (ESV, NKJV, CSB and WEB in Luke 1:39; NIV, ESV, NLT, CSB and WEB in Ezra 5:8) and the KJV's "Juda" (Luke 1:39). These render the name Judah (Greek *Iouda*, Aramaic *Yehud*), which the other versions translate "Judea". "Judah" is also the tribe, the kingdom and the patriarch, used hundreds of times in the Old Testament, so adding it would make the Roman-era region the search result for all of them.
- **bethlehem:** "Ephrathah", or the KJV's "Ephratah", used alone in Ruth 4:11, in parallel with Bethlehem. Whether Ephrathah is another name for the town or its clan district is a research question.

**The WEB still matches.** `npm run validate:data` gives the same 98 WEB-linkage warnings, all pre-existing. No cited WEB verse matches its record only through `names.modern` or `names.otherLanguages`, so moving names out of search didn't cost any WEB match.

## Rule application: English names, and names in other languages

Fifteen kept names appear in no cited verse of any version. Each one was checked against the record's own sources, and so were "Judaea" (a KJV spelling) and "Panias" (a moved transliteration):

| Name | Record | Research Lead | Fact-Checker | Reason |
|---|---|---|---|---|
| Judaea | judea | kept | **Confirmed** | The KJV's spelling (Matthew 2:1 and every other KJV verse the record cites). The rule requires every version's spelling. |
| Perge | perga | kept | **Confirmed** | Wikidata's English label for Q719815 and DARE's name. It's the English name of the archaeological site (the record's candidate label is "Perge archaeological site"). |
| Pergamon | pergamum | kept | **Confirmed** | Wikidata's English label for Q18986, DARE, and the title of the record's UNESCO source. The Research Lead's Pergamon Museum example is not among the record's sources, but the name is supported without it. |
| Paneas | caesarea-philippi | kept | **Overturned: moved to `otherLanguages`** | Paneas is the city's Greek name. That is the category of the card's own `otherLanguages` example "Julias" (Bethsaida's Greek name), and of "Krenides", "Dikaiarcheia", "Arsinoeia" and "Taricheae", which the Research Lead moved. No English Bible uses it. The record's sources give "Banias" as the site's English name: Pleiades tags "Banias" as English, OpenBible uses it for the modern site, and `names.modern` is "Banias". So Paneas is not the English name of the site, unlike Perge, Pergamon, Nea Paphos and Alexandria Troas. The Research Lead's reason ("Pleiades' … standard English form") is not what Pleiades says: its "Paneas" name record has no English language tag. |
| Panias | caesarea-philippi | moved | **Confirmed** | None of the record's sources gives it as a name on its own; Wikidata has only "Caesareia Panias". |
| Nea Paphos | paphos | kept | **Confirmed, different reason** | Pleiades 707586 lists "Nea Paphos" and its title is "(Nea) Paphos"; it's also a Wikidata alias and the record's candidate label. It's the English name of the archaeological site. UNESCO, the Research Lead's reason, isn't among this record's sources. |
| New Paphos | paphos | kept | **Confirmed** | OpenBible's name for the site (`openbible:paphos`), and a plain English translation. |
| Alexandria Troas | troas | kept | **Confirmed** | Named in ADR-0026; also Wikidata's English label and DARE's name. |
| Laodicea on the Lycus | laodicea | kept | **Confirmed** | Wikidata's English label. Its Latin form, "Laodicea ad Lycum" (DARE), was correctly moved. |
| Tel Lystra | lystra | kept | **Confirmed** | OpenBible's English name for the mound (`openbible:lystra`). |
| Caesarea Maritima; Strato's Tower; Straton's Tower | caesarea-maritima | kept | **Confirmed** | "Caesarea Maritima" is Latin in origin (Pleiades tags it Latin), but it's the standard English name of the site. "Strato's Tower" is named in ADR-0026; "Straton's Tower" is the same English translation. |
| Antioch on the Orontes; Nicopolis in Epirus; Herod's Temple; Lake of Gennesaret | antioch-syria; nicopolis; temple-mount; sea-of-galilee | kept | **Confirmed** | English phrases. "Lake of Gennesaret" is named in ADR-0026. |

The other borderline moves in the commit:

| Name | Record | Research Lead | Fact-Checker | Reason |
|---|---|---|---|---|
| Kenchreai | cenchreae | moved | **Confirmed** | Wikidata's English label is "Cenchreae", with "Kenchreai" only as an alias, and Pleiades tags Kenchreai as Greek. English excavation reports do use "Kenchreai", so this is close, but the record's sources support the move. |
| Khatun Serai | lystra | moved | **Confirmed** | A transliteration of the Turkish village name Hatunsaray. Note for the Research Lead: the record's source, OpenBible, spells it "Khatum Serai". Since `otherLanguages` is never shown or searched, this is low priority. |
| Philadelpheia | philadelphia-lydia | moved | **Confirmed** | Pleiades' Greek-transliteration title. It isn't used in English Bibles or English prose. |
| Bezetha | pool-of-bethesda | moved | **Confirmed** | All six versions read "Bethesda" at John 5:2. Bezetha is the Greek form of the name of a nearby city quarter. Whether it belongs in this record at all is outside M3-10's scope. |
| Taricheae | magdala | moved | **Confirmed** | Josephus' Greek name for the town, the same category as "Julias". |

**Every other `otherLanguages` move is confirmed.** Each is a Hebrew, Aramaic, Greek, Latin, Arabic, Turkish or Hittite form that none of the six versions or the WEB uses:

- Latin: "Colonia Caesarea", "Antiochia", "Athenae", "Creta", "Claudioderbe", "Claudiconium", "Colonia Iulia Augusta Philippensis", "Roma", "Laodicea ad Lycum".
- Greek: "Theoupolis", "Julias", "Korinthos", "Kriti", "Arsinoeia", "Hierichous", "Hierosolyma", "Ierusalem", "Melite", "Krenides", "Dikaiarcheia".
- Hebrew: "Kfar Nahum", "Darmeseq", "Yerushalayim", "Yafo", "Iafo", "Shomron", "Yam Kinneret", "Har haBayit".
- Arabic: "Beit Lahm", "Talhum", "Ariha", "Al-Quds", "Jabal at-Tur", "an-Nasira", "Silwan", "Sour".
- Hittite: "Milawanda".

None of these names appears in any version's text or the WEB's text of the verses the record cites. For the moved names that Pleiades tags with a language, the tag matches the classification.

**English names that stay are confirmed.** Every name left in `ancient`/`alternate` is used by one of the six versions or the WEB in a verse the record cites, or is in the table above: "Olivet", "Calvary", "Bethabara", "Korazin", "Tyrus", "Shelah", "Sea of Chinnereth", "Pergamos", "Cenchrea", "Colosse", "Beroea", "Melita" and "Magadan". "Nazarene" is a demonym, but it's English and the WEB's Matthew 2:23 uses it.

## Magdala

**The facts**
- In Matthew 15:39, the NIV, ESV, NLT and CSB read "Magadan"; the KJV, NKJV and WEB read "Magdala". The WEB is the text the panel shows.
- In the parallel, Mark 8:10, all seven read "Dalmanutha".
- No other verse names the town. Luke 8:2 and the other Gospel verses give only the epithet "Magdalene".
- Magadan against Magdala is a difference between Greek manuscripts, not between spellings.

**What the sources say about Magadan**
- OpenBible.info, which the record cites (`openbible:magdala`), gives "another name for Magdala" as its leading identification of Magadan (22 votes). A minority vote places it "along the eastern side of the Sea of Galilee".
- OpenBible's own "Magdala" entry has no verses, because its verse data follows the ESV.
- Wikidata Q4880851 is "Magdala", with the alias "Migdal" and no "Magadan".
- The record is inconsistent (this predates M3-10). Its summary calls Magadan and Dalmanutha "a place … in the same general area", but its `names.ancient` lists both as names of Magdala.

**Does the rule, applied honestly, give "Magadan"?** Read literally, yes:
- Matthew 15:39 is the only verse that names the place, and 4 of the 6 versions read "Magadan".
- The rule makes no exception for manuscript differences, and M3-10 already applied it to one without an exception: John 1:28, where the majority "Bethany" beat the KJV/NKJV's "Bethabara".
- The card's fallback ("Where the Bible doesn't name the place…") applies only if Magadan is a different place. The record's summary suggests that, but its names list and its main source do not.

**Is the verse about the same place?** Probably, but not certainly. The leading view in the record's source says yes, and the minority view and the record's summary leave it open. So this is not clear-cut, and **I have not changed the title**.

**Recommendation for the PO to put to the human.**

- **Option A (recommended): keep "Magdala".** The names stay `ancient: ["Magdala", "Magadan", "Dalmanutha"]` and `otherLanguages: ["Taricheae"]`.
  - For: the WEB verse the panel quotes says "Magdala". The record is about Mary Magdalene's town, and every source names it Magdala. NIV, ESV, NLT and CSB readers still find it by searching "Magadan" ("Magdala — also: Magadan"). No other field needs to change.
  - Against: it departs from the literal 4-of-6 count, so the exception should be recorded, for example in ADR-0026: "A manuscript difference that may name a different place does not set the title."
- **Option B: retitle "Magadan".** `names.ancient` becomes `["Magadan", "Magdala", "Dalmanutha"]`.
  - For: it follows the literal count.
  - Against: the panel title "Magadan" would sit above a WEB verse that says "Magdala". The summary opens "Magdala, on the western shore…" and calls Magadan "a place … in the same general area", so it would contradict the title and need rewording. That is outside M3-10's fields, so it would need a follow-up card. Readers who know "Magdalene" still find the record under "Magdala".

**Either way:** a follow-up for the Research Lead should make the record consistent. Either the summary says that the leading identification treats Magadan (and, in OpenBible, Dalmanutha) as this place, or the names list stops implying it. OpenBible's leading identification of Dalmanutha is "another name for Magadan".

**Status:** magdala's M3-10 changes pass (the "Taricheae" move and the version citations), so it is `verified`. If the human picks Option B, the follow-up card returns it to `draft`.

## Validator change by the Research Lead

**Finding: correct, tested, and documented. It departs from the card's wording, and there are two small follow-ups.**

- **What changed.** `collectLocationNameEntries` no longer adds `names.modern`, so the duplicate-name error (which applies only when `names.otherLanguages` has entries) compares `ancient`, `alternate` and `otherLanguages` only. The error message changed to match. `splitModernNameVariants` is still used by the scripture-linkage check, so no code became dead, and the linkage check still uses all four fields, as `schema/README.md` says.
- **Why it's right.** With `names.modern` included, as in `c0b1718`, 13 of the final records would fail. The modern name repeats an ancient name in athens, bethlehem, crete, damascus, jericho, jerusalem, malta, mount-of-olives, nazareth, rome, sea-of-galilee and tyre, and repeats an `otherLanguages` name in capernaum ("Kfar Nahum") and tyre ("Sour"). Capernaum is the card's own lead example. Before this task, an existing test ("duplicate-name error is skipped when names.otherLanguages is absent") already let `modern` equal `ancient`.
- **Tests.** The new test ("names.modern repeating an ancient or otherLanguages name is not a duplicate error") covers `modern` equal to `otherLanguages`, and the existing test still shows a real duplicate across `alternate` and `otherLanguages` failing. All 60 tests pass.
  - Gap: no test covers `modern` equal to `ancient` while `otherLanguages` is present, the Rome case the new test's own comment names. The real data covers it (13 records pass `validate:data`), but a unit test would guard it.
- **`schema/README.md`** matches the code: "raises an error if any name appears more than once across `names.ancient`, `names.alternate`, and `names.otherLanguages` … `names.modern` is intentionally excluded".
- **Follow-ups, not blocking:**
  1. The card's Scope 1 still lists `modern` in the check. The PO should amend the card or record the change.
  2. The PR Reviewer should review this code change, which was outside the Research Lead's nominal scope.
  3. Optionally, the GIS Engineer can add the Rome-case test. The fixture workarounds from `c0b1718` (Galilee's modern name "Galilee Region", Capernaum's "Tell Hum") are no longer needed and can be reverted.

## Bibliography entries

- **Cite-only:** yes. Each is a `web` entry pointing to the version's page on BibleGateway, and no verse text is stored. `docs/LICENSES.md` and `ATTRIBUTION.md` had no rows for these versions; both now do.
- **Format:** the entries use the same fields in the same order as the file's other `web` entries. All six URLs resolve (HTTP 200), and the schema validates.
- **Accuracy**, checked against each version's copyright notice and version page on BibleGateway:
  - **NIV** (Biblica, © 1973–2011), **NLT** (Tyndale House Foundation, used by permission of Tyndale House Publishers, © 1996, 2004, 2015), **NKJV** (Thomas Nelson, © 1982) and **CSB** (Holman Bible Publishers, © 2017): correct.
  - **ESV: wrong edition, fixed.** BibleGateway serves "ESV Text Edition: 2025", not 2016. The spellings in the table are what that text reads.
  - **KJV: wrong edition, fixed.** BibleGateway's page says its KJV "matches the 1987 printing" and that "the KJV is public domain in the United States", and it lists "Publisher: Public Domain". It says nothing about a 1769 Oxford text. The entry's UK clause ("Crown copyright applies within the United Kingdom") isn't on the cited page. I couldn't check it at the source either, because cambridge.org (the Crown's printer) returned HTTP 403. The publisher field now says only what the page says. The author, "Church of England", is left unchanged: the page names no author, and the author doesn't affect a spelling citation.
  - Both IDs are renamed to match (`esv-2016-biblegateway` → `esv-2025-biblegateway`, `kjv-1769-biblegateway` → `kjv-1987-biblegateway`), in the bibliography and the 37 records that cite them. These entries are new on this branch, so nothing else refers to them.

## No copied verse text

- **Nothing M3-10 added contains verse text.** The research doc and the bibliography have no 6-word sequence in common with any version (apart from sequences also in the WEB), and every name is a name.
- **Pre-existing matches** (from M2 and the M3-01 wireframes): 32 six-word sequences in 15 files. Almost all are ordinary English phrases, such as "shore of the Sea of Galilee".
  - **mount-of-olives: fixed.** Its `otConnections` note put *'his feet will stand on the Mount of Olives'* in quotation marks. That is the NIV's wording of Zechariah 14:4; the WEB reads "His feet will stand in that day on the Mount of Olives". The project quotes only the WEB, exactly, so the quotation is now the WEB's words (commit `76d0389` introduced it). This is the one field I changed outside the card's name fields. Leaving it would have broken the card's criterion that no verse text from these versions is in the repository.
  - **salamis-cyprus** ("they proclaimed the word of God in the Jewish synagogues", the NIV's wording of Acts 13:5) and **cenchreae** ("a servant of the church at Cenchreae", the ESV's wording of Romans 16:1): unquoted, ordinary restatements of 7–9 words, not quotations. They are not failures. For salamis-cyprus, the Research Lead may optionally switch to the WEB's "God's word" in a later task.
  - `docs/verification/M2-batch-3.md` quotes an NKJV-matching misquotation that the M2 Fact-Checker caught and had fixed. It is a record of that error, not reused text.

## Fixes in this commit

| Record or file | Fix | Source |
|---|---|---|
| `data/bibliography.json` | ESV entry: 2016 → 2025 text edition. ID renamed `esv-2025-biblegateway`. | BibleGateway's ESV copyright notice |
| `data/bibliography.json` | KJV entry: "1769 Oxford standard text" → "1987 printing". Publisher → "Public domain in the United States". ID renamed `kjv-1987-biblegateway`. | BibleGateway's KJV version page |
| 37 records | Updated the two renamed `bib:` IDs in `summary.sources`. | — |
| golgotha | Added alternate "Place of the Skull". | NIV, NLT, CSB: Matthew 27:33, Mark 15:22, John 19:17 |
| miletus | Added alternate "Miletum". | KJV: 2 Timothy 4:20 |
| pool-of-siloam | Added alternate "Siloah". | KJV: Nehemiah 3:15 |
| bethlehem | Added alternate "Bethlehem Ephratah". | KJV: Micah 5:2 |
| judea | Added alternate "Jewry", and cited the six version entries in `summary.sources`, like the other changed records. | KJV: Luke 23:5, John 7:1 |
| caesarea-philippi | Moved "Paneas" from `ancient` to `otherLanguages` (overturned; see above). | Pleiades 678324; OpenBible |
| mount-of-olives | Made the Zechariah 14:4 quotation exact WEB. | `data/reference/engwebp_vpl.txt` |
| `docs/research/M3-10-bible-spellings.md` | Corrected the ESV and KJV edition lines, two table cells (samaria NLT, sea-of-galilee CSB) and the Paneas note. Added "Additions from verification". | as above |
| `docs/LICENSES.md`, `ATTRIBUTION.md` | Added rows for the six versions (cite-only, spellings only). | BibleGateway copyright notices |

Every added name comes from a verse the record already cites, and the record cites the version's `bib:` entry.

## Verdicts

| Category | Records |
|---|---|
| Changed by the Research Lead, pass as committed | 31 |
| Changed by the Research Lead, fixed here | 6 (bethlehem, caesarea-philippi, golgotha, miletus, mount-of-olives, pool-of-siloam) |
| Unchanged by the Research Lead, fixed here | 1 (judea) |
| Unchanged, confirmed (title and names checked against all cited verses) | 25 |
| Failed | 0 |
| **Now `verified`** | **63 of 63** |

The 38 records changed on this branch are now `status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-09-28"`. The other 25 were already `verified` and are unchanged.

## Validation

- `npm run validate:data`: **0 errors, 98 warnings.** The warnings are the same pre-existing WEB-linkage ones as before this task, less golgotha's Luke 23:33, which the Research Lead's "The Skull" resolved.
- `npm test`: **60/60 pass.**
- `npm run build:data`: **63 places built.** The index contains no `otherLanguages`. "Paneas" and "Kfar Nahum" still appear in it, but only through capernaum's `names.modern` and caesarea-philippi's candidate label ("Banias (Paneas)"), which ADR-0026 keeps and which search doesn't cover.

## For the PO and the human

1. **Magdala:** choose Option A ("Magdala", recommended) or Option B ("Magadan"); see "Magdala".
2. **Paneas overturned:** it's now in `otherLanguages`, on the strength of the card's own "Julias" example. If the human wants former Greek and Latin city names to be searchable, the rule for Julias, Krenides, Taricheae and the others should change with it.
3. **Judah and Ephrathah:** should "Judah" find the judea record, and "Ephrathah" find bethlehem? Both are left out for now, as editorial calls.
4. **Validator:** the card's Scope 1 wording should be updated, and the PR Reviewer should review the `scripts/lib/validator.mjs` change. A Rome-case test and the fixture clean-up are optional.
5. **Research Lead follow-ups (small):**
   - make magdala's names and summary consistent;
   - lystra's "Khatun Serai" against the source's "Khatum Serai";
   - optionally, salamis-cyprus's "the word of God" → "God's word".
