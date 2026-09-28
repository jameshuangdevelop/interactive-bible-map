# M3-08 — Neutral modern names

| | |
|---|---|
| Agents, in order | `gis-engineer` (schema) → `research-lead` (data) → `fact-checker` (verification), each adding its own commit (ADR-0014) |
| Models | GPT-5.3-Codex → Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m3-modern-names` |
| Depends on | CP3a approved, including CP3a decision 3 |
| Parallel with | M3-02 (scaffold), M3-07 (basemap attribution) |
| Credit target | ~150 schema, ~400 data, ~400 verification |

## Goal
Make `names.modern` consistent and neutral across all 63 records, so the place panel can display it as stored (`docs/design/VISUAL_SPEC.md` §8).

Today the field mixes several styles:
- some names include a country ("Yalvaç (Turkey)") and some don't ("Bethlehem");
- some carry political descriptors ("Tell Balata (Nablus, West Bank)", "Judea (historical region, West Bank / Israel)");
- disputed places use placeholder text ("Disputed (see candidates)", "Golgotha / Calvary (disputed)").

## The rule (confirmed at CP3a)
- `names.modern` is the **modern place name only**: no country, state, province or political descriptor, and no editorial notes. Examples: "Yalvaç", "Antakya", "Tell Balata", "Kfar Nahum / Tell Hum".
- For **disputed places** (at least one candidate with confidence `disputed`), leave out `names.modern`. The candidates' `label` fields already name the modern sites.
- For **other places with several candidates** (for example Jericho, Derbe or Golgotha), give a modern name only if one neutral name covers every candidate; otherwise leave it out.
- For **region and island records**, use the modern geographic name if there is a neutral one (for example "Crete", "Malta" or "Sea of Galilee"); otherwise leave it out. This rule takes precedence over the one above, because it names the record's own geography rather than picking one candidate site. So Malta keeps "Malta" even though a low-confidence candidate is Mljet. Judea and Samaria have no modern name, because every modern name in use for these areas carries a political meaning. Galatia has no modern name either, because no modern region matches it.
- When an ancient site has no modern settlement of its own, **"Near *town*"** is allowed (for example "Near Denizli"). It locates the site without a political descriptor.
- **Candidate `label` fields** follow the same rule, because the panel and search show them: no country, state or political descriptor. Geography stays, in neutral words; for example "Qasr al-Yahud (West Bank, opposite bank)" becomes "Qasr al-Yahud (west of the Jordan River)".
- The wording stays sourced: a modern name must be one the record's sources support.

## Scope
1. **GIS Engineer:**
   - Make `names.modern` optional in `schema/location.schema.json`.
   - Add a validator error when `names.modern` contains the word "disputed", or is present on a disputed record (at least one candidate with confidence `disputed`). Add tests. The "one neutral name covers every candidate" rule for other multi-candidate places needs judgement, so the Fact-Checker checks it instead.
   - Document the rule in `schema/README.md`.
   - Commit: `feat(schema): make modern names optional and neutral`.
2. **Research Lead:** apply the rule to every record, changing only `names.modern`, candidate `label` fields, and any modern-name mentions in the same record that repeat a country or descriptor. Keep the changed records at `status: "draft"`. Commit: `data(locations): normalize modern names`.
3. **Fact-Checker:** check each changed name against its sources, and check that nothing else changed (use a semantic diff). Re-set `verified` on the records that pass. Add a section to `docs/verification/M3-modern-names.md`. Commit: `docs(verification): verify modern-name normalization`.

## Out of scope
Any other field, and app code.

## Acceptance criteria
- [ ] No `names.modern` value or candidate `label` contains a country, state or political descriptor, and no `names.modern` contains the word "disputed".
- [ ] Disputed records (at least one candidate with confidence `disputed`) have no `names.modern`.
- [ ] The validator enforces the machine-checkable parts, and has tests for them.
- [ ] All 63 records are `verified` again.
- [ ] CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: neutral modern names`.
