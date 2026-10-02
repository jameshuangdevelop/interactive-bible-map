# M3-13 — Bible-version spelling comparison (well-known areas and "Judah"/"Greece")

## Method

For each new area record, and for the two name additions, I looked up the name in one or more
representative verses (using the record's own `scripture` refs) in the same six English Bible
versions M3-10 and M3-11 used, at the same site and edition:

- **NIV** — New International Version, 2011 text edition (Biblica)
- **ESV** — English Standard Version, 2025 text edition (Crossway)
- **NLT** — New Living Translation, 2015 text edition (Tyndale House Foundation / Tyndale
  House Publishers)
- **KJV** — King James Version, 1987 printing (public domain in the United States)
- **NKJV** — New King James Version, 1982 (Thomas Nelson)
- **CSB** — Christian Standard Bible, 2017 (Holman Bible Publishers)

**Site used:** BibleGateway.com (`https://www.biblegateway.com/passage/?search=<ref>&version=<VERSION>`).
Five versions (NIV, ESV, NLT, KJV, NKJV) were requested together per verse; CSB was requested
separately, as in M3-10 and M3-11.

**Read date:** 2026-09-30.

**The rule (ADR-0026, unchanged):** the title (`names.ancient[0]`) is the spelling most of the six
versions agree on; an even split falls back to the WEB. Every other English spelling any of the six
versions or the WEB uses stays in `names.ancient` or `names.alternate`.

**Never copied:** verse text. The table below records only the spelling of the name in each version,
never the surrounding sentence.

## New area records

Acts 2:9-10 alone gives a spelling check for nine of the sixteen new records (all six versions
agree on every name in both verses):

| record | verse | NIV | ESV | NLT | KJV | NKJV | CSB | chosen title | note |
|---|---|---|---|---|---|---|---|---|---|
| egypt | Acts 2:10 | Egypt | Egypt | Egypt | Egypt | Egypt | Egypt | Egypt | Unchanged (6/6). |
| cappadocia | Acts 2:9 | Cappadocia | Cappadocia | Cappadocia | Cappadocia | Cappadocia | Cappadocia | Cappadocia | Unchanged (6/6). |
| pontus | Acts 2:9 | Pontus | Pontus | Pontus | Pontus | Pontus | Pontus | Pontus | Unchanged (6/6). |
| phrygia | Acts 2:10 | Phrygia | Phrygia | Phrygia | Phrygia | Phrygia | Phrygia | Phrygia | Unchanged (6/6). |
| pamphylia | Acts 2:10 | Pamphylia | Pamphylia | Pamphylia | Pamphylia | Pamphylia | Pamphylia | Pamphylia | Unchanged (6/6). |
| libya | Acts 2:10 | Libya | Libya | Libya | Libya | Libya | Libya | Libya | Unchanged (6/6). Every version reads "Libya," not "Lybia." |
| mesopotamia | Acts 2:9 | Mesopotamia | Mesopotamia | Mesopotamia | Mesopotamia | Mesopotamia | Mesopotamia | Mesopotamia | Unchanged (6/6). |
| parthian-empire | Acts 2:9 | Parthians | Parthians | Parthians | Parthians | Parthians | Parthians | Parthian Empire | **Not Bible-named as a phrase**, like `roman-empire` in M3-11: no verse names "the Parthian Empire." All six versions agree on the demonym "Parthians" (kept as an alternate); "Parthian Empire" is the standard English name in the sources (Wikidata, ISBE, Livius.org). |
| media | Acts 2:9 | Medes | Medes | Medes | Medes | Medes | Medes | Media | **Demonym, not a place name, in the verse.** All six versions read "Medes." The record's title, "Media," is the standard English place name (ISBE, Wikidata); "Medes" is kept as an alternate so a reader searching the Pentecost list can still find the record. |

**Elam removed.** The Research Lead also checked "Elamites" (Acts 2:9; 6/6 versions) for an Elam record. The PO removed that record on 2026-09-30, because no source gave its status in about AD 50 (see `docs/verification/M3-well-known-areas.md`).

The remaining seven new records were checked against their own verses:

| record | verse | NIV | ESV | NLT | KJV | NKJV | CSB | chosen title | note |
|---|---|---|---|---|---|---|---|---|---|
| arabia | Galatians 1:17 | Arabia | Arabia | Arabia | Arabia | Arabia | Arabia | Arabia | Unchanged (6/6). |
| bithynia | Acts 16:7 | Bithynia | Bithynia | Bithynia | Bithynia | Bithynia | Bithynia | Bithynia | Unchanged (6/6). |
| cilicia | Acts 15:41 | Cilicia | Cilicia | Cilicia | Cilicia | Cilicia | Cilicia | Cilicia | Unchanged (6/6). |
| lycaonia | Acts 14:6 | Lycaonian (adj.) | Lycaonia | Lycaonia | Lycaonia | Lycaonia | Lycaonian (adj.) | Lycaonia | NIV and CSB both use the adjective "Lycaonian cities/towns" rather than the noun "Lycaonia"; ESV, NLT, KJV and NKJV use the noun directly. Not a spelling difference — the WEB and the majority use the noun, so the title is unaffected. |
| pisidia | Acts 14:24 | Pisidia | Pisidia | Pisidia | Pisidia | Pisidia | Pisidia | Pisidia | Unchanged (6/6). |
| mysia | Acts 16:7 | Mysia | Mysia | Mysia | Mysia | Mysia | Mysia | Mysia | Unchanged (6/6). |
| illyricum | Romans 15:19 | Illyricum | Illyricum | Illyricum | Illyricum | Illyricum | Illyricum | Illyricum | Unchanged (6/6). "Dalmatia" (2 Timothy 4:10, checked separately below) is kept as an alternate, since the International Standard Bible Encyclopedia identifies both names with the same province (see the record's own history note). |

And the alternate name "Dalmatia" (2 Timothy 4:10):

| record | verse | NIV | ESV | NLT | KJV | NKJV | CSB | note |
|---|---|---|---|---|---|---|---|---|
| illyricum (alternate) | 2 Timothy 4:10 | Dalmatia | Dalmatia | Dalmatia | Dalmatia | Dalmatia | Dalmatia | Unchanged (6/6). |

## Names task

**"Judah" (Matthew 2:6), alternate name of `judea`:**

| verse | NIV | ESV | NLT | KJV | NKJV | CSB | note |
|---|---|---|---|---|---|---|---|
| Matthew 2:6 | Judah | Judah | Judah | **Juda** | Judah | Judah | 5 of 6 versions read "Judah"; only the KJV reads "Juda." The WEB itself reads "Judah" at both Matthew 2:6 and Luke 1:39 (the record's own scripture entries). Both "Judah" and "Juda" are added as alternates on `judea`, so a reader searching either spelling finds the district. |

**"Greece" (Acts 20:2), alternate name of `achaia`:** already present. M3-11's own spelling
table (`docs/research/M3-11-bible-spellings.md`) recorded this exactly: "'Greece' (Acts 20:2) kept
as an alternate, per ADR-0027's own worked example." `achaia.json`'s `names.alternate` already
contains `"Greece"`, and its `summary` already explains, citing `bib:isbe-achaia`, that "In Ac 20:2
'Greece' means Achaia." No data change was needed for this half of the task; this document records
that the check was made and the existing record already satisfies it.

## Existing records reparented (not re-checked for spelling)

The Research Lead's commit changed `parentId` on seven existing city records. After the Fact-Checker applied the PO's ruling on regions that cross province lines (`docs/verification/M3-well-known-areas.md`), four of them keep their earlier parent:

- `lystra` and `derbe` are under the new `lycaonia` record (was `galatia`);
- `perga` is under the new `pamphylia` record (was `galatia`);
- `antioch-pisidia` and `iconium` stay under `galatia`, because Phrygia was split between Asia and Galatia;
- `tarsus` stays under `syria`, because Cilicia was split between Syria and a client king;
- `troas` stays under `asia`, because the sources count the Troad as part of Mysia only in some authors.

None of these records' titles or alternate names changed in this batch, so their spellings were not re-checked; M3-10 and M3-11 already verified them.
