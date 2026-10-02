# M3-16 — A longer "About" for the 31 major places

| | |
|---|---|
| Agents, in order | `research-lead` (text) → `fact-checker` (verification), each adding its own commit (ADR-0014), in two halves (below) |
| Models | Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m3-longer-about` (from `main` after CP3.5) |
| Depends on | CP3.5 approved |
| Parallel with | M3-06, M3-14 and M3-15. M3-14 changes the same records' names, so this branch merges after M3-14; the PO resolves any `lastReviewed` conflicts by keeping the later date. |
| Credit target | ~3,000 per Research Lead half, ~5,000 per Fact-Checker half (session guard: 10,000 each; ADR-0025) |

## Goal
Give each major place an "About" that tells a Bible reader what the place was, what happened there in the Bible, and what is there today. The human asked for one that is "much longer and more detailed for important cities" (2026-09-30). Today these texts run from 25 words (Colossae) to 234 (Bethany beyond the Jordan), with a median of 75.

## Places
The 31 records with `prominence: "major"` (ADR-0029 §2), in two halves:
- **Half 1, Jerusalem and the Gospels (13):** `jerusalem`, `temple-mount`, `golgotha`, `gethsemane`, `mount-of-olives`, `bethlehem`, `nazareth`, `capernaum`, `sea-of-galilee`, `cana`, `jericho`, `bethany` and `bethany-beyond-the-jordan`.
- **Half 2, Paul's letters, the capitals and Revelation's churches (18):** `rome`, `corinth`, `galatia`, `ephesus`, `philippi`, `colossae`, `thessalonica`, `crete`, `athens`, `antioch-syria`, `caesarea-maritima`, `damascus`, `smyrna`, `pergamum`, `thyatira`, `sardis`, `philadelphia-lydia` and `laodicea`.

Order: Research Lead half 1, then Fact-Checker half 1; then Research Lead half 2, then Fact-Checker half 2. A new session for each phase.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0017 (every factual clause stated by a cited source; Wikipedia never the only source), ADR-0026 (English names) and ADR-0029 (the "Next, after CP3.5" note)
- `docs/design/VISUAL_SPEC.md` §3 item 6 and §8 (wording)
- Each place's record (`data/locations/<id>.json`) and research brief (`content/image-prompts/<id>.md`), whose cited sections on layout, buildings, landscape and daily life are the starting point
- `data/bibliography.json`
- This card

## The text
- **Length and shape:** 250–450 words in 3–5 short paragraphs. `summary.text` is the first paragraph; the others are `history` entries. Keep the existing entries' facts, and rewrite or merge them into the new text.
- **What it covers, in this order:**
  1. what the place was in the first century: its size, its people, its rulers and why it mattered;
  2. what the Bible reports there, with the passages (cited as `scripture:`), and, for the cities Paul wrote to, the letter and the church;
  3. what happened to it afterwards, briefly;
  4. what a visitor sees today: the modern town and the excavated remains.
- **For Bible readers:** plain English, short sentences, no jargon. Explain any term a general reader wouldn't know in a few words.
- **Neutral:** descriptive and non-devotional (spec §8). Report what a passage says ("According to Acts, Paul stayed …"), not whether it happened. On disputed locations (Golgotha, Cana, Bethany beyond the Jordan), describe every candidate fairly, in the data's order, and favour none. On disputed modern status, describe, don't judge.
- **Sources:** each paragraph's `sources` must state every factual clause in it (ADR-0017): datasets for places and dates, `bib:` entries for history and archaeology, and `scripture:` for what a passage reports. Open every source you cite; add new `bib:` entries to `data/bibliography.json` as needed. Paraphrase; quote only short phrases.

## Scope
1. **Research Lead (each half):** write the text for the half's places, and set them to `status: "draft"`. Run `npm run validate:data`, `npm test` and `npm run test:app`, and a word count per place (250–450). Commit: `data(locations): longer About for <half>`.
2. **Fact-Checker (each half):** check every clause against its cited source, every scripture claim against the WEB text, the neutrality rules and the word counts. Fix or send back every problem. Set the places that pass to `verified`. Add a section for the half to `docs/verification/M3-longer-about.md`. Commit: `docs(verification): verify longer About for <half>`.

## Out of scope
Standard places, images, names and countries (M3-14), and app code. The panel already shows the summary and history notes as the About section.

## Acceptance criteria
- [ ] Each of the 31 major places has 250–450 words of About in 3–5 paragraphs, and each paragraph has sources.
- [ ] The Fact-Checker's report covers all 31, with no open findings.
- [ ] All 31 are `verified` again, and CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's half-2 phase ends the task. PR title: `data: longer About for major places`.
