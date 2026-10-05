# M3-18 — Trimming the seven 8-image galleries to 7

ADR-0029's 2026-10-05 update sets major places to 4–7 images, counting the AI reconstruction. Of
the 31 major places, seven had 8: Corinth, Damascus, Galatia, Laodicea, Pergamum, Philippi and
Rome. For each, every Commons image (a 330px thumbnail, downloaded one at a time) was viewed
alongside its caption and `kind` before choosing what to drop. The AI reconstruction (`<id>-ai-01`)
was kept first throughout and was never a candidate for removal.

## Corinth

**Removed:** `corinth-08`, *Η_κρήνη_Πειρήνη.jpg* (`site`) — excavated foundation walls near the
Peirene spring-house, a close, fragment-like shot with no view of the spring itself, redundant
with the general ruin views already in `corinth-02` and `corinth-03`.

- **Kinds before:** ai-reconstruction, site, site, modern, site, site, modern, site (5 site, 2 modern)
- **Kinds after:** ai-reconstruction, site, site, modern, site, site, modern (4 site, 2 modern)
- Removed from the end, so no other ids changed.

## Damascus

**Removed:** `damascus-07`, *Damascus_Azem_Palace_large_courtyard_5103.jpg* (`modern`) — an
enclosed courtyard of one palace, the weakest of five `modern` images and the least
representative of the city's overall feel next to its mosque, river and skyline views.

- **Kinds before:** ai-reconstruction, site, modern, modern, historical, modern, modern, modern (1 site, 5 modern, 1 historical)
- **Kinds after:** ai-reconstruction, site, modern, modern, historical, modern, modern (1 site, 4 modern, 1 historical)
- Renumbered: `damascus-08` → `damascus-07`.

## Galatia

**Removed:** `galatia-03`, *Antioch_in_Pisida_Decumanus_Maximus_047.jpg* (`site`) — a ground-level
view of the Decumanus Maximus dominated by a large foreground paving block, a near-duplicate of
`galatia-02`'s wider aerial view of the same Temple of Augustus precinct.

- **Kinds before:** ai-reconstruction, site, site, site, reconstruction, site, modern, modern (4 site, 1 reconstruction, 2 modern)
- **Kinds after:** ai-reconstruction, site, site, reconstruction, site, modern, modern (3 site, 1 reconstruction, 2 modern)
- Renumbered: `galatia-04` → `galatia-03`, `galatia-05` → `galatia-04`, `galatia-06` → `galatia-05`, `galatia-07` → `galatia-06`, `galatia-08` → `galatia-07`.

## Laodicea

**Removed:** `laodicea-04`, *Laodicea_Ancient_City_2026,_15.jpg* (`site`) — a generically captioned
colonnaded street, a near-duplicate of `laodicea-05`'s more specifically identified Stadium Street,
the same subject (a paved, column-lined street with the valley beyond) shot from a similar angle.

- **Kinds before:** ai-reconstruction, site, historical, site, site, site, site, modern (5 site, 1 historical, 1 modern)
- **Kinds after:** ai-reconstruction, site, historical, site, site, site, modern (4 site, 1 historical, 1 modern)
- Renumbered: `laodicea-05` → `laodicea-04`, `laodicea-06` → `laodicea-05`, `laodicea-07` → `laodicea-06`, `laodicea-08` → `laodicea-07`.

## Pergamum

**Removed:** `pergamum-05`, *Temple_of_Trajan,_Pergamon_01.jpg* (`site`) — standing columns shot
close, with rubble filling the foreground, redundant with `pergamum-04`'s wider view that already
includes the Temple of Trajan above the theatre.

- **Kinds before:** ai-reconstruction, modern, reconstruction, site, site, site, site, modern (4 site, 2 modern, 1 reconstruction)
- **Kinds after:** ai-reconstruction, modern, reconstruction, site, site, site, modern (3 site, 2 modern, 1 reconstruction)
- Renumbered: `pergamum-06` → `pergamum-05`, `pergamum-07` → `pergamum-06`, `pergamum-08` → `pergamum-07`.

## Philippi

**Removed:** `philippi-05`, *Archaeological_site_of_Philippi_BW_2017-10-05_12-47-21.jpg* (`site`) —
two Ionic columns filling most of the frame, the clearest close-up/fragment shot of the gallery
(ADR-0029 item 5) and the weakest of four `site` images.

- **Kinds before:** ai-reconstruction, site, site, site, site, modern, modern, modern (4 site, 3 modern)
- **Kinds after:** ai-reconstruction, site, site, site, modern, modern, modern (3 site, 3 modern)
- Renumbered: `philippi-06` → `philippi-05`, `philippi-07` → `philippi-06`, `philippi-08` → `philippi-07`.

## Rome

**Removed:** `rome-04`, *Appian_Way.jpg* (`site`) — a tree-lined paved road, biblically relevant
(Acts 28:15) but visually the most generic of five `site` images, with no distinctive Roman
structure in frame next to the Forum, Palatine, Circus Maximus and Colosseum views.

- **Kinds before:** ai-reconstruction, site, site, site, site, reconstruction, modern, site (5 site, 1 reconstruction, 1 modern)
- **Kinds after:** ai-reconstruction, site, site, site, reconstruction, modern, site (4 site, 1 reconstruction, 1 modern)
- Renumbered: `rome-05` → `rome-04`, `rome-06` → `rome-05`, `rome-07` → `rome-06`, `rome-08` → `rome-07`.

## Reference check

A repository-wide search (excluding `node_modules`, `app/dist`, `app/public/generated` and
`docs/verification/`) for every removed or renumbered id found no references outside the seven
`data/media/<id>.json` files themselves — `ATTRIBUTION.md` lists sources and licenses by upstream
provider, not by image id, and no test, script or app fixture hardcodes one of these ids. No other
file needed a change.

## Credit fixes (scope item 3, added 2026-10-05)

M3-19's Fact-Checker found 12 `author` values that don't use the attribution form their Commons
file page requests. Ids may have moved after the trims above, so each is identified by its file.
Each page's raw wikitext (`action=raw`) was read one at a time (~1 s apart, descriptive User-Agent)
and the exact requested credit copied into `author`; nothing else changed.

| id (current) | file | old `author` | new `author` | What the page asks |
|---|---|---|---|---|
| `rome-07` | *Colosseum_in_Rome,_Italy_-_April_2007.jpg* | `Diliff` | `David Iliff` | `User:Diliff/Licensing` (linked from the file's `permission` field): "Attribution of this image to the author (DAVID ILIFF) is also required... Suggested attribution: 'Photo by DAVID ILIFF. License: ...'". |
| `mount-of-olives-02` | *2013-Aerial-Mount_of_Olives.jpg* | `Godot13` | `Andrew Shiva / Wikipedia` | `{{Credit line\|Author=Andrew Shiva\|Other=Wikipedia\|License=CC-BY-SA-4.0}}` and `{{Attribution\|...\|text=Use or reproduction of this image outside of Wikipedia must give the original photographer (Andrew Shiva) credit.}}` |
| `temple-mount-02` | *Jerusalem-2013(2)-Aerial-Temple_Mount-(south_exposure).jpg* | `Godot13` | `Andrew Shiva / Wikipedia` | Same `Credit line`/`Attribution` templates as `mount-of-olives-02`. |
| `joppa-01` | *ISR-2013-Aerial-Jaffa-Port_of_Jaffa.jpg* | `Godot13` | `Andrew Shiva / Wikipedia` | Same `Credit line`/`Attribution` templates as above. |
| `ephesus-06` | *Model_of_the_Artemisium_-_Ephesus_Museum.JPG* | `José Luiz` | `José Luiz Bernardes Ribeiro` | `{{Credit line\|Author=© José Luiz Bernardes Ribeiro\|License=CC-BY-SA-3.0}}` |
| `tyre-02` | *Roman_Hippodrome,_Tyre,_Lebanon.jpg* | `Vyacheslav Argenberg` | `Vyacheslav Argenberg / www.vascoplanet.com` | `{{self\|cc-by-4.0\|author=Vyacheslav Argenberg\|attribution=© Vyacheslav Argenberg / http://www.vascoplanet.com/}}` |
| `bethany-beyond-the-jordan-02` | *127027_qasr_al-yahud_-_baptismal_site_in_jordan_PikiWiki_Israel.jpg* | `שלמה רודד` | `שלמה רודד (PikiWiki Israel)` | `{{cc-by-2.5\|Roded Shlomo Pikiwiki Israel}}`; matches the house style already used in `data/media/chorazin.json` ("Zeev Stein (PikiWiki Israel)"). |
| `bethany-beyond-the-jordan-07` | *PikiWiki_Israel_30075_-_Qasr_el_Yahud_baptism_site,_2013-01.jpg* | `אילת לב ארי שלי` | `אילת לב ארי שלי (PikiWiki Israel)` | `{{cc-by-2.5\|אילת לב ארי שלי Pikiwiki Israel}}` |
| `caesarea-maritima-04` | *92300_ancient_theater_in_caesarea_PikiWiki_Israel.jpg* | `מיכל פריימן` | `מיכל פריימן (PikiWiki Israel)` | `{{cc-by-2.5\|michal freiman Pikiwiki Israel}}` |
| `caesarea-maritima-06` | *124996_caesarea_national_park_PikiWiki_Israel.jpg* | `מיכל פריימן` | `מיכל פריימן (PikiWiki Israel)` | `{{cc-by-2.5\|michal freiman Pikiwiki Israel}}` |
| `nazareth-05` | *127767_nazareth-synagogue_church_PikiWiki_Israel.jpg* | `Shlomo Roded` | `Shlomo Roded (PikiWiki Israel)` | `{{cc-by-2.5\|Roded Shlomo Pikiwiki Israel}}` |
| `nazareth-06` | *PikiWiki_Israel_28738_Mount_of_Precipice.JPG* | `Dr. Avishai Teicher` | `Dr. Avishai Teicher (PikiWiki Israel)` | `{{cc-by-2.5\|Dr. Avishai Teicher Pikiwiki Israel}}` |

No other field changed on any of these 12 images (license, `licenseUrl`, `sourcePage`, caption and
`kind` all stay as they were). `npm run validate:data` (0 errors, 107 warnings, unchanged),
`npm test` (140/140) and `npm run test:app` (93/93) all pass after this change.

## 31-place check (informational)

A check of all 31 major places' media files, after this change, confirms every one has 4–7
images, the AI reconstruction first, and at least one `modern` and one `site` image — **except**
`gethsemane`, which has 6 images but no `site` kind (all `modern` besides the AI reconstruction).
This gap pre-dates this session (Gethsemane isn't one of the seven places in this card's scope,
and its image count was already within range), so it is left for a future card rather than fixed
here.
