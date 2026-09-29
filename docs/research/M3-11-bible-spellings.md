# M3-11 — Bible-version spelling comparison (ancient empire and provinces)

## Method

For each new area record that the New Testament names, I looked up the name in one
representative verse (using the record's own `scripture` refs) in the same six English Bible
versions M3-10 used, at the same site and edition:

- **NIV** — New International Version, 2011 text edition (Biblica)
- **ESV** — English Standard Version, 2025 text edition (Crossway)
- **NLT** — New Living Translation, 2015 text edition (Tyndale House Foundation / Tyndale
  House Publishers)
- **KJV** — King James Version, 1987 printing (public domain in the United States)
- **NKJV** — New King James Version, 1982 (Thomas Nelson)
- **CSB** — Christian Standard Bible, 2017 (Holman Bible Publishers)

**Site used:** BibleGateway.com (`https://www.biblegateway.com/passage/?search=<ref>&version=<VERSION>`).
Five versions (NIV, ESV, NLT, KJV, NKJV) were requested together per verse; CSB was requested
separately, since it did not consistently render in the combined request.

**Read date:** 2026-09-28.

**The rule (ADR-0026, unchanged from M3-10):** the title (`names.ancient[0]`) is the spelling
most of the six versions agree on; an even split falls back to the WEB. Every other English
spelling any of the six versions or the WEB uses stays in `names.ancient` or `names.alternate`.

**Never copied:** verse text. The table below records only the spelling of the name in each
version, never the surrounding sentence.

## Table

| record | verse | NIV | ESV | NLT | KJV | NKJV | CSB | chosen title | note |
|---|---|---|---|---|---|---|---|---|---|
| achaia | Acts 18:12 | Achaia | Achaia | Achaia | Achaia | Achaia | Achaia | Achaia | Unchanged (6/6). "Greece" (Acts 20:2) kept as an alternate, per ADR-0027's own worked example. |
| macedonia | Acts 16:9 | Macedonia | Macedonia | Macedonia | Macedonia | Macedonia | Macedonia | Macedonia | Unchanged (6/6). |
| asia | Acts 19:10 | Asia (NIV/NLT both add "the province of") | Asia | Asia | Asia | Asia | Asia | Asia | Unchanged (6/6). NIV and NLT both gloss the word as "the province of Asia," an internal confirmation of this record's `type: "province"`. |
| syria | Galatians 1:21 | Syria | Syria | Syria (NLT: "the provinces of Syria and Cilicia") | Syria | Syria | Syria | Syria | Unchanged (6/6). |
| cyprus | Acts 4:36 | Cyprus | Cyprus | Cyprus | Cyprus | Cyprus | Cyprus | Cyprus | Unchanged (6/6). |
| italy | Acts 18:2 | Italy | Italy | Italy | Italy | Italy | Italy | Italy | Unchanged (6/6). |
| sicily | Acts 28:12 | — | — | — | — | — | — | Sicily | **Not Bible-named.** Acts 28:12 names only the city "Syracuse," not the island or province; no version comparison applies. "Sicily" is the standard English name for the island and Roman province, per this record's own sources (Wikidata, World History Encyclopedia). |
| crete-cyrene | (no single verse) | — | — | — | — | — | — | Crete and Cyrene | **Scholarly disambiguating title, not a version vote.** The Bible names "Crete" (an existing, separate record) and "Cyrene" (Matthew 27:32; Acts 11:20) individually, but never the combined Roman province by one name. This record's title joins the two Biblical place names, following the province's own scope (Crete plus the Cyrenaica region of North Africa), rather than the Latin scholarly form "Creta et Cyrenaica" (kept as an alternate). |
| judea-province | (no single verse) | — | — | — | — | — | — | Province of Judea | **Scholarly disambiguating title, not a version vote.** The Bible never distinguishes the district of Judea (this project's existing `judea` record) from the larger Roman province of the same name; both are just "Judea" in every version. Modern reference works (for example Wikipedia's own infobox) give the province the conventional long name "Province of Judaea"; this record uses the project's own spelling of "Judea" (per ADR-0026, the spelling most of the six versions use for the word itself) with that same disambiguating pattern, and keeps "Judaea (Roman province)" as an alternate. |
| roman-empire | (no single verse) | — | — | — | — | — | — | Roman Empire | **Not Bible-named**, like `temple-mount` in M3-10: no New Testament verse names "the Roman Empire" as a phrase. "Roman Empire" is the standard English name in the sources (Wikidata, Cassius Dio, Suetonius). Related NT terms ("Caesar," "Rome") are cited in the record's own `scripture` entries but are not alternate names for the empire itself. |

## Existing records whose spelling was not re-checked

`galatia` (title unchanged; only `type` and `parentId` change in this batch) and `crete` (only
`parentId` changes) both keep the titles M3-10 already set and verified; this batch did not
re-run their version comparison.
