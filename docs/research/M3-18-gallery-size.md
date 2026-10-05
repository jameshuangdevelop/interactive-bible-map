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

## 31-place check (informational)

A check of all 31 major places' media files, after this change, confirms every one has 4–7
images, the AI reconstruction first, and at least one `modern` and one `site` image — **except**
`gethsemane`, which has 6 images but no `site` kind (all `modern` besides the AI reconstruction).
This gap pre-dates this session (Gethsemane isn't one of the seven places in this card's scope,
and its image count was already within range), so it is left for a future card rather than fixed
here.
