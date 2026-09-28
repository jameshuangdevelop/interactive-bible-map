# M3-08 verification — Neutral modern names

Independent verification of the Research Lead's commit `b4a6a8d` ("data(locations): normalize modern names"), applying the M3-08 rule (`docs/tasks/M3-08-modern-names.md`, confirmed at CP3a) to all 63 `data/locations/*.json` records. Reviewed 2026-09-28. One finding overturned (`malta`); everything else confirmed as written.

## Scope

M3-08's net effect (against the pre-task baseline, `7f01028`) touches only `names.modern`, `candidates[].label`, and the verification field `lastReviewed` — across the 48 changed records, `status` and `verifiedBy` end at the same values they started at, since every changed record was already `verified`/`fact-checker` before this task and is `verified`/`fact-checker` again now. No other field, and no app code.

The Research Lead's intermediate commit (`b4a6a8d`) additionally set `status: "draft"` (removing `verifiedBy`/`lastReviewed`) on all 48 changed records, per the draft workflow, and added `names.alternate: ["Malta"]` to `malta.json` to compensate for removing its `names.modern`. My fact-check overturned the `malta.json` `names.modern` removal (see "Rule decisions" below), which also reverted the alternate addition: net of `7f01028`, `malta.json`'s `names` object is unchanged (`modern: "Malta"`, `alternate: []`); only its `Mljet` candidate label and `lastReviewed` differ.

## Method

**Semantic diff.** A node script parsed every file at `7f01028` (pre-normalization) and the working tree, walked both objects field by field, and reported every path where the two differed, run at two points:

- **Right after the Research Lead's commit (`b4a6a8d`), before my fact-check:** 48 of 63 files changed, and the only paths that ever differed were `names.modern`, `names.alternate` (malta only), `candidates[].label`, `status`, `verifiedBy`, and `lastReviewed` — matching the task's expected scope, with no leakage into `summary`, `history`, `scripture`, `politicalHistory`, `coordinates`, or any other field.
- **After my fact-check (final state, this commit):** still 48 of 63 files changed, but the unique changed paths narrow to `names.modern`, `candidates[].label`, and `lastReviewed`. `names.alternate` no longer appears anywhere in the diff (the malta fix reverted it to its pre-task empty array), and neither do `status`/`verifiedBy` (every changed record's final value matches its pre-task value; only `lastReviewed`'s date moved from 2026-09-2x to 2026-09-28).

The other 15 records (`bethany`, `bethlehem`, `caesarea-philippi`, `capernaum`, `chorazin`, `gethsemane`, `jericho`, `jerusalem`, `magdala`, `mount-of-olives`, `nain`, `nazareth`, `pool-of-bethesda`, `pool-of-siloam`, `sea-of-galilee`) were untouched throughout, and all already carried clean, neutral `names.modern` values (for example `jericho` → `"Jericho"`, `capernaum` → `"Kfar Nahum / Tell Hum"`), confirming they needed no change.

**Sources checked.** For every changed name and label, opened the record's own cited sources (Pleiades, Wikidata, DARE, OpenBible.info, `bib:` entries and `scripture:` text already in the file) directly, rather than trusting the commit message's summary. No new external sources were needed; every change is supported by material already cited in the record.

**Full-corpus scan.** A second script scanned all 63 records' current `names.modern`, `names.alternate` and `candidates[].label` for leftover country/state/province/political words or the word "disputed" (not just the 48 changed files), and cross-checked for label text reused by more than one record id. It found no leftover violations and no problematic collisions (one harmless, pre-existing, out-of-scope overlap: `"Antioch"` appears in both `antioch-pisidia.json`'s and `antioch-syria.json`'s `names.alternate`, unchanged by this task and already `verified`).

## Changed records (old → new)

Straightforward country/province removals (34 records) — the base name is unchanged and was already verified against its cited sources; only the trailing `(Country)`/`(Province, Country)` was dropped. All confirmed:

| Record | Old → new |
|---|---|
| antioch-pisidia | "Yalvaç (Turkey)" → "Yalvaç" |
| antioch-syria | "Antakya (Turkey)" → "Antakya" |
| athens | "Athens (Greece)" → "Athens" |
| berea | "Veria (Greece)" → "Veria" |
| caesarea-maritima | "Caesarea (Israel)" → "Caesarea" |
| cenchreae | "Kechries (Greece)" → "Kechries" |
| crete | "Crete (Greece)" → "Crete" |
| damascus | "Damascus (Syria)" → "Damascus" |
| ephesus | "Selçuk (Turkey)" → "Selçuk" |
| galilee | "Galilee (Northern Israel)" → "Galilee" |
| hierapolis | "Pamukkale (Turkey)" → "Pamukkale" |
| iconium | "Konya (Turkey)" → "Konya" |
| joppa | "Jaffa (Tel Aviv-Yafo, Israel)" → "Jaffa" |
| laodicea | "Near Denizli (Turkey)" → "Near Denizli" |
| miletus | "Near Balat (Turkey)" → "Near Balat" |
| neapolis-macedonia | "Kavala (Greece)" → "Kavala" |
| nicopolis | "Near Preveza (Greece)" → "Near Preveza" |
| paphos | "Kato Paphos (Cyprus)" → "Kato Paphos" |
| patmos | "Patmos (Greece)" → "Patmos" |
| perga | "Near Antalya (Turkey)" → "Near Antalya" |
| pergamum | "Bergama (Turkey)" → "Bergama" |
| philadelphia-lydia | "Alaşehir (Turkey)" → "Alaşehir" |
| philippi | "Filippoi (near Kavala, Greece)" → "Filippoi" |
| puteoli | "Pozzuoli (Italy)" → "Pozzuoli" |
| rome | "Rome (Italy)" → "Rome" |
| salamis-cyprus | "Near Famagusta (Cyprus)" → "Near Famagusta" (candidate label also dropped "(Cyprus)") |
| sardis | "Sart (Turkey)" → "Sart" |
| smyrna | "İzmir (Turkey)" → "İzmir" |
| sychar | "Tell Balata (Nablus, West Bank)" → "Tell Balata" |
| tarsus | "Tarsus (Mersin Province, Turkey)" → "Tarsus" |
| thessalonica | "Thessaloniki (Greece)" → "Thessaloniki" |
| thyatira | "Akhisar (Turkey)" → "Akhisar" |
| troas | "Near Ezine (Turkey)" → "Near Ezine" |
| tyre | "Sour / Tyre (Lebanon)" → "Sour / Tyre" |

`"Near <town>"` conversions, checked against the record's own candidate support text for accuracy:

| Record | Old → new | Verdict |
|---|---|---|
| colossae | "Honaz (Denizli Province, Turkey)" → "Near Honaz" | **Pass, and a correction.** The candidate's own support text (`pleiades:638811`, `wikidata:Q1001370`) says the site is "the unexcavated tell **near** modern Honaz," not identical with the town. The old value wrongly implied Colossae = Honaz; "Near Honaz" matches the sources better than the value it replaced. |
| lystra | "Hatunsaray (Konya Province, Turkey)" → "Near Hatunsaray" | **Pass, and a correction.** Same pattern: the candidate label is "Tel Lystra, **near** Hatunsaray" and the support text says "this mound **near** Hatunsaray" (`pleiades:648699`). "Near Hatunsaray" is the more accurate form. |
| corinth | "Ancient Corinth / Korinthos (Greece)" → "Ancient Corinth" | **Pass.** The candidate's own support text (`pleiades:570182`, `wikidata:Q1363688`) states the site is "Archaia Korinthos, distinct from the modern city of Corinth a few kilometers away" — "Archaia Korinthos" is literally Greek for "Ancient Corinth," so the English form is the accurate modern name of the village. Dropping the Greek-script alternate "Korinthos" loses nothing required; the rule asks for one modern name, not both language forms. |

Removed `names.modern` (disputed places — at least one candidate at confidence `disputed`, per `schema/README.md`'s technical definition):

| Record | Candidates checked | Verdict |
|---|---|---|
| bethsaida | et-Tell (`disputed`), el-Araj (`disputed`) | **Pass.** Both candidates are genuinely `disputed`-confidence; the validator requires omission and the record already had no single covering name. |
| cana | Khirbet Qana (`disputed`), Kafr Kanna (`disputed`), Qana (`low`) | **Pass.** Candidate label "Qana, Lebanon" → "Qana" is a correct country-name strip, consistent with every other candidate-label fix in this batch. |
| emmaus | Emmaus Nicopolis (`disputed`), Qaloniya/Motza (`disputed`), El-Qubeibeh (`low`), Abu Ghosh (`low`) | **Pass.** Genuinely disputed at the confidence level the schema uses to trigger omission. |

## Rule decisions (confirm/overturn)

**bethany-beyond-the-jordan — CONFIRMED removed.** Al-Maghtas (Jordan, `medium`) and Qasr al-Yahud (West Bank, `west of the Jordan River`, `low`) are two archaeologically distinct sites on opposite banks of the river, in two different jurisdictions; no single neutral name covers both, so the schema's "one neutral name must cover every candidate" clause correctly applies. The reworded labels — "(east of the Jordan River)" / "(west of the Jordan River)" — are geographically accurate (checked against each candidate's own coordinates: Al-Maghtas sits at a higher longitude, i.e. further east, than Qasr al-Yahud) and avoid naming either the country Jordan or the West Bank, which the old labels ("Jordan, east bank" / "West Bank, opposite bank") did not.

**derbe — CONFIRMED removed.** Kerti Höyük (`high`) and Devri Şehri (`low`) are, per the record's own cited source (`bib:wagner-wilson-why-derbe`), two distinct mounds about four kilometers apart. No sourced name covers both; correctly omitted.

**golgotha — CONFIRMED removed.** The Church of the Holy Sepulchre (`medium`) and the Garden Tomb (`low`) are two separate, well-documented sites within Jerusalem's Old City/vicinity; no single name covers both, and the old value ("Golgotha / Calvary (disputed)") also contained the banned word "disputed." Correctly omitted.

**malta — OVERTURNED; `names.modern` restored to `"Malta"`.** The Research Lead applied the general "several candidates → one neutral name must cover every candidate" clause, reasoning that "Malta" cannot cover the low-confidence Mljet (Croatia) alternative. But `malta` is a **region/island-type record** (`"type": "natural-feature", "zoomTier": "region"`), and the task card's own "The rule" section states a *separate* clause for exactly this case: "For region and island records, use the modern geographic name if there is a neutral one (**for example 'Crete', 'Malta' or 'Sea of Galilee'**)" — the card names Malta itself as the worked example. This matches `schema/README.md`'s own two-track structure (a disputed-confidence rule, a general multi-candidate rule, and a *separate* region/island rule), and matches the CP3a-era ADR that redefined "disputed" narrowly (at least one candidate at confidence `disputed`) specifically to stop this exact over-flagging of Malta and Jericho. Malta's alternate candidate is `low` confidence, not `disputed`; the validator's own test suite includes a case titled "multi-candidate non-disputed record may keep names.modern," confirming the schema was built to allow this. WEB Acts 28:1 itself states "the island was called Malta," so the name is directly scripture-sourced. VISUAL_SPEC §8 also only withholds the modern-name line from *disputed* places, not from every multi-candidate one. **Fix applied:** `malta.json`'s `names` object was restored exactly to its pre-M3-08 (`7f01028`) state — `modern: "Malta"`, `alternate: []` — which reverts both the removal and the Research Lead's `names.alternate: ["Malta"]` addition (added specifically to compensate for the removed modern name; once `names.modern` is restored, that entry would only duplicate it with no added value). The `Mljet (Melite Illyrica), Croatia` → `Mljet (Melite Illyrica)` candidate-label fix stands unchanged, since it correctly strips a country name unrelated to the modern-name question. `npm run validate:data` confirms malta's scripture-linkage warning count is unchanged (3) with `names.modern` restored and the alternate removed — the same count as with the Research Lead's alternate-only fix, since `names.modern: "Malta"` alone already covers Acts 28:1. (`e704813`, committed after this verification, has since recorded this region/island precedence explicitly in `docs/tasks/M3-08-modern-names.md` and `schema/README.md`.)

**jericho — CONFIRMED kept as "Jericho" (unchanged).** Both candidates (Tell es-Sultan, Tulul Abu al-'Alayiq) are `high` confidence and sit within the same modern city, about 2 km apart; one neutral name correctly covers both.

**galatia, judea, samaria — CONFIRMED removed.**
- `galatia`: no neutral sourced modern geographic name exists for the ancient/Roman province; the old value ("North-central Turkey (around Ankara)") was a country-anchored description, not a place name, and is correctly excluded by the rule.
- `judea` / `samaria`: unlike `galilee` (a region name in ordinary, uncontested modern use), "Judea and Samaria" is itself the Israeli government's specific administrative designation for the West Bank, and "West Bank" is the competing designation — there is no neutral modern equivalent available for either region, so omitting `names.modern` is the correct application of the rule rather than a gap. (Recorded in the commit message as "PO guidance"; I did not find a separate written record of that specific instruction, but the substance is sound and consistent with VISUAL_SPEC §8's neutrality principle, so I confirm the outcome rather than treat it as a documentation defect.)

**crete, galilee, patmos, sea-of-galilee — CONFIRMED kept (unchanged).** Each is a region/island/natural-feature record with a single, unambiguous, already-neutral modern name (`"Crete"`, `"Galilee"`, `"Patmos"`, `"Sea of Galilee / Lake Kinneret"`), correctly left untouched.

## Nicopolis candidate label — KEPT as "Nicopolis archaeological site (Epirus)"

Flagged by the Research Lead: Epirus is both the ancient region name and a modern Greek administrative region ("periphery"). Decision: **keep it.**
- Unlike every country name stripped elsewhere in this batch (Turkey, Israel, Cyprus, Croatia, Lebanon), Epirus is not a sovereign state, and Greece's administration of it is not contested territory — the neutrality rule's purpose (not taking a side in a live territorial dispute, per VISUAL_SPEC §8 and the Judea/Samaria reasoning above) does not apply here.
- It is not new information bolted on for geographic orientation (the pattern the rule targets); the record's own `names.ancient` already reads `"Nicopolis in Epirus"`, so the label is reusing the record's own established ancient toponym, the same convention this dataset already uses for `antioch-pisidia`/`antioch-syria` and `caesarea-maritima` (kept distinct via a place-of-origin qualifier).
- It is load-bearing: `emmaus.json` has its own candidate labeled `"Emmaus Nicopolis (Imwas)"`, a completely different site. Without a qualifier, "Nicopolis archaeological site" alone would collide with that name in search and in the panel. "(Epirus)" resolves the collision using the same historical convention already in the record, rather than inventing a new modern administrative tag.

## Verdicts

| Category | Count |
|---|---|
| Pass as committed | 47 records |
| Fixed (malta) | 1 record |
| Failed | 0 records |
| **Total records now `verified`** | **63 of 63** |

All 48 changed records (including the corrected `malta`) are now `status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-09-28"`. The other 15 records were already `verified` and untouched.

## Validation

- `npm run validate:data`: **0 errors, 99 warnings** (same 99 warnings as before this task, all pre-existing categories — mostly demonyms and narrative-continuation verses the substring matcher can't see, none newly introduced by this batch; malta's own count is unchanged at 3, confirming the `names.modern` restoration didn't regress the scripture-linkage check the Research Lead had fixed).
- `npm test`: **50/50 pass**, including the schema tests added for this task (`names.modern cannot contain the word disputed`, `names.modern must be omitted when a disputed-confidence candidate exists`, `disputed multi-candidate record may omit names.modern`, `multi-candidate non-disputed record may keep names.modern` — the last of which is the direct schema-level confirmation behind the malta ruling above).

## For the PO / CP3b

- One rule-application finding was overturned (malta) with a one-line data fix; everything else in the Research Lead's commit stood as written.
- The "PO guidance" cited in the commit message for removing `judea`/`samaria`'s modern names could not be traced to a written record as of this commit; `e704813` (on top of this one) has since recorded it in `docs/tasks/M3-08-modern-names.md` and `schema/README.md`, along with the region/island-precedence rule this report's malta ruling relies on, so no further action is needed.
