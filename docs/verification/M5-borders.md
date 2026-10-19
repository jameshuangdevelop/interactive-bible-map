# M5-10 verification: borders drawn the way Google Maps draws them

**Verifier:** fact-checker (Claude Opus 5.5, Copilot CLI) · **Date:** 2026-10-18 · **Branch:** `feat/m5-borders` at `ea818fb`; the modern styles are built by `aef1453`. `091c30f` (ancient borders) isn't covered.

**Scope:** card M5-10 scope item 7, which covers the modern map only. I checked how each contested line is drawn against Google Maps' international view and the UN's maps, and I checked the undisputed borders that M4-04's masks used to hide, the notice, the licences, VISUAL_SPEC §2 "Modern map" and §8, and ADR-0044 item 7. While I worked, the engineer had uncommitted changes in the worktree (Kokkina, Crimea and Commagene). They aren't verified here, but B3 lists what the Crimea overlay needs.

**Result: needs change.** I checked 16 contested lines:
- **2 match** Google Maps' international view: the West Bank's and Gaza's lines with Israel.
- **8 differ.** The worst isn't a disputed border at all. The rule meant for Cyprus dashes every line the tiles mark as admin level 3, which comes to about 6,500 km across Türkiye's seven regions alone, plus Russia's federal districts and Iraq's Kurdistan Region.
- **6 can't be told** from published sources. The human can check these in Google Maps at MC13.

Of the 8 undisputed borders, 7 are solid at every zoom. Israel–Lebanon is dashed below zoom 5.

The notice is identical in all 8 copies and is neutral, but it isn't accurate yet. P1 proposes tighter wording. The licences pass, and four passages in the attribution documents are out of date.

| Check | Pass / matches | Needs change / differs | Can't tell |
|---|---|---|---|
| Contested lines against Google Maps' international view (16, §1) | 2 | 8 | 6 |
| Undisputed borders that the masks hid (8, §2) | 7 | 1 (Israel–Lebanon below zoom 5) | — |
| Notice: identical copies, neutrality, accuracy (§3) | 2 | 1 (accuracy) | — |
| Licences (5 sources) and attribution text (§4) | 5 | 4 stale passages in the documents | — |
| VISUAL_SPEC §2 and ADR-0044 item 7 (§5) | 3 | 4 | — |

## 1. Contested lines
Below zoom 5, the main map draws Natural Earth's 1:50m lines (NE), and so does the backup at every zoom. From zoom 5 the main map draws the OpenMapTiles lines (tiles). Lengths are measured from decoded tiles (§6). The bracketed sources [G1]–[G4] are listed in §6.

| # | Line | Google Maps, international view | UN maps | Our map | Verdict |
|---|---|---|---|---|---|
| 1 | Kosovo–Serbia | Dashed. Kosovo's other borders are solid (the human's observation in ADR-0044). Google says it shows disputes with "a dashed gray border line" [G2] | Plain dashed line. Kosovo's other borders use the international-boundary symbol (Map 4069 Rev. 7, 2020) | From zoom 5: dashed (the XKK–SRB rule, 330–360 km). About 14 km is drawn **solid** around a small disputed pocket at Pančić's Peak (20.77–20.83°E, 43.24–43.27°N), where the tiles give one side no country code. Below zoom 5 and on the backup: **solid**, because NE `1746706755` is "International boundary (verify)". Shots: dashed at zoom 7, solid at zoom 4 | **Differs** below zoom 5, on the backup, and at Pančić's Peak (B4) |
| 2 | Israel–West Bank (the 1949 line) | Dashed. Google "includes labels and dashed lines for the Gaza Strip and West Bank" [G3] | Armistice Demarcation Line, dashed (Map 3584 Rev. 2, 2004) | Dashed at every zoom: NE `1746709121` "Disputed", and from zoom 5 the Israeli side with no code on the other side (330–340 km). The West Bank–Jordan line is solid at every zoom; the UN draws it with a boundary symbol | **Matches** on the Israeli side. West Bank–Jordan: can't tell |
| 3 | Israel–Gaza | Dashed [G3] | Armistice Demarcation Line, dashed | Dashed at every zoom: NE `1746705323`, and from zoom 5 the same Israeli-side rule as row 2. Gaza–Egypt is solid; the UN draws it as the boundary of the former Palestine Mandate | **Matches** |
| 4 | Golan Heights | Not published. Google's general rule is a dashed grey line for disputes [G1, G2] | Shown as part of Syria, with the former Palestine Mandate boundary between Israel and the Golan. The 1974 line isn't drawn as a boundary; the UNDOF zone is shaded (Map 3584 Rev. 2) | From zoom 5: the 1974 cease-fire line is dashed (`claimed_by` IL, 80 km) and Golan–Jordan is dashed (`claimed_by` SY, 30 km). Lebanon–Golan is **solid**: its 18 km is part of the tiles' Lebanon–Israel feature. No Israel–Golan line is drawn. Below zoom 5: the 1974 line is dashed, Lebanon–Golan is dashed (NE `1746705371`), Golan–Jordan is **solid** (NE `1746707901`), and there's no Israel–Golan line. The zoom 7.5 shot shows all of this | **Differs.** Two lines change style at zoom 5 (B5), and the west line is missing (P3) |
| 5 | Northern Cyprus (the Green Line) | Not published. Users in Türkiye see the TRNC; other users don't [G2] | Two cease-fire lines, drawn in dashed blue (Map 4038, 2019) | Dashed at every zoom (NE `1746708491` "Line of control"; the tiles' admin-level-3 rule, about 205 km). Two more dashed lines run 20–25 km out to sea from Kokkina (zoom 8 shot) | **Differs:** Kokkina's sea lines (B1). The Green Line's own dashes match the UN's style; Google can't tell |
| 6 | British Sovereign Base Areas | Not published | Shaded areas marked "S.B.A." (Map 4038) | From zoom 5: solid outlines (Cyprus on one side, no code on the other; about 145 km). Below zoom 5: none, because they're too small for NE 1:50m | **Can't tell** (P4) |
| 7 | Western Sahara–Morocco | Shown. "People using Maps outside of Morocco see Western Sahara and a dotted line to represent its disputed border" [G4]. The line is "the northern border with Morocco" [G2] | The 27°40′N line uses the international-boundary symbol. Western Sahara is marked as a Non-Self-Governing Territory, and the berm isn't drawn (Map 4669, 2023; world map 4651) | **The 27°40′N line isn't drawn at any zoom.** NE 1:50m land lines don't include it, and the tiles have only a 5 km piece at 8.8°W. The Moroccan berm is dashed at every zoom (NE "Line of control"; flagged disputed in the tiles, about 1,300 km). Zoom 5 shot | **Differs** (B2, P2) |
| 8 | Crimea | "Ukrainians and others see a dotted-line border" [G2] | Inside Ukraine, bounded by the Autonomous Republic's internal boundary. Nothing is drawn in the Kerch Strait (Map 3773 Rev. 6, 2014) | Below zoom 5: the isthmus line (NE `1746708787`) and a Kerch Strait line (`1746708837`) are dashed. From zoom 5, as committed: only about 28 km of fragments near Perekop, and nothing shows in the zoom 6 shot | **Differs** from zoom 5 (B3, in progress) |
| 9 | Abkhazia and South Ossetia | Not published | Abkhazia has an autonomous-republic boundary; South Ossetia has no line; Russia–Georgia is international (Map 3780 Rev. 6, 2015) | From zoom 5: Abkhazia is dashed, but only because of the admin-level-3 rule. South Ossetia is dashed (disputed flag, about 440 km). Russia–Georgia is solid. Below zoom 5: no line for either | **Can't tell** (P4). B1 removes Abkhazia's line unless it's kept on purpose |
| 10 | Transnistria | Not published | No line (Map 3759 Rev. 5, 2013) | From zoom 5: dashed (about 500 km), only because of the admin-level-3 rule. Below zoom 5: no line | **Can't tell** (P4). B1 removes it unless it's kept on purpose |
| 11 | Nagorno-Karabakh, and Armenia–Azerbaijan | Not published | International boundary, including the exclaves. No Karabakh line (Map 3761 Rev. 10.1, 2024) | No Karabakh line. Armenia–Azerbaijan is solid, including Artsvashen's ring (checked at zoom 10). At zoom 10 the tiles draw no ring around the Azerbaijani exclaves, and below zoom 5 NE's two exclave rings shrink to zero length in the 0.25° simplification. One 5.5 km disputed piece near 46.2°E 39.6°N is dashed | **Can't tell.** Consistent with the UN, except that the UN also draws the exclaves |
| 12 | Russia–Georgia (M4-04's pair rule hid it) | Not published | International | Solid at every zoom | **Can't tell.** Consistent with the UN |
| 13 | Halaib Triangle and Bir Tawil | Not published | 22°N is the international boundary. The 1902 administrative lines around Halaib and Bir Tawil are dashed (Map 4458 Rev. 2, 2012) | From zoom 5: 22°N is dashed east of 33.17°E (about 400 km: Bir Tawil's north edge and Halaib's south edge). Bir Tawil's south line is dashed. There's no line north of Halaib, so Halaib reads as part of Egypt. 22°N is solid west of 33.17°E, except 9 km at the Wadi Halfa salient. Below zoom 5: 22°N is **solid** all along (NE `1746709045`) and no other line is drawn | **Differs:** 22°N changes style at zoom 5 (P4, then B5) |
| 14 | Algeria–Morocco south of Figuig (found in the scan) | Not published | Not checked | Below zoom 5: **dashed** (NE `1746708045` "Indefinite"). From zoom 5: solid (DZA–MAR) | **Differs:** the style changes at zoom 5 (B5) |
| 15 | Admin-level-3 lines: Türkiye's seven regions, Russia's federal districts, Iraq's Kurdistan Region and Mount Athos (found in the scan) | Not borders | Not boundaries | **Dashed from zoom 5:** about 6,540 km in Türkiye (zoom 6), 1,020 km in Iraq, 1,290 km of Russian district lines in the North Caucasus, and 11 km across the Athos peninsula. The zoom 5 scan of 20°W–60°E, 10–55°N found 13,100 km. The Caucasus zoom 6.5 shot shows dashes past Armavir and Cherkessk, north of Grozny, and across north-east Türkiye | **Differs** (B1, high) |
| 16 | Other lines the tiles flag as disputed: Olivenza (Spain–Portugal, about 72 km), Ceuta and Melilla (about 16 km), Gibraltar (1 km), Mont Blanc (about 8 km), Croatia–Serbia on the Danube (about 150 km), Piran Bay (7 km), Sudan–South Sudan at 10.17°N (about 128 km) | Not published | The world map notes that the Sudan–South Sudan boundary "has not yet been determined". The others weren't checked | Dashed from zoom 5; solid or absent below zoom 5 | **Can't tell** (P4) |

## 2. Undisputed borders that the masks used to hide

| Border | From zoom 5 (tiles) | Below zoom 5 and backup (NE) | Shots | Result |
|---|---|---|---|---|
| Albania–Kosovo | Solid (XKK–ALB, 107–112 km) | Solid (`1746705565`) | Zoom 7: solid | Pass |
| Albania–North Macedonia | Solid | Solid (`1746705551`) | Zoom 7: solid | Pass |
| Albania–Montenegro | Solid | Solid (`1746707111`) | Zoom 7: solid | Pass |
| Kosovo–North Macedonia | Solid (149–164 km) | Solid (`1746706649`) | Zoom 7: solid | Pass |
| Kosovo–Montenegro | Solid (72–77 km) | Solid (`1746706769`) | Zoom 7: solid | Pass |
| Israel–Egypt | Solid (206–211 km) | Solid (`1746707915`) | Zoom 7.5: solid | Pass |
| Israel–Jordan | Solid | Solid (`1746707335`) | Zoom 7.5: solid | Pass |
| Israel–Lebanon | Solid. The same feature continues 18 km along the Golan's edge (§1, row 4) | **Dashed**: NE `1746705327` is "Disputed (please verify)" | Zoom 7.5: solid. Zoom 4: dashed | **Needs change** (B5) |

## 3. The notice
- **Identical in every copy: pass.** There are 8 copies, all from the script constant:
  - `liberty-modern/style.json` metadata and `LICENSE.txt` part (a);
  - `versatiles-colorful-modern/style.json` metadata and `NOTICE.txt`;
  - `docs/LICENSES.md`: drawer string 2, string 4 and backup string 3;
  - `sources-credits-content.ts`.

  `ATTRIBUTION.md` has no copy, and it didn't have the old sentence either. The backup's drawer says only "with disputed borders dashed", which agrees with the notice.
- **Says what a dashed line means, without claiming who governs a place: pass.** It names no party and takes no side (spec §8).
- **Accurate: needs change.**
  1. "Disputed borders are drawn as dashed lines" isn't true yet. Western Sahara's border isn't drawn, Kosovo–Serbia is solid below zoom 5, and Crimea isn't drawn from zoom 5. Meanwhile, about 10,000 km of dashed lines aren't disputed borders (B1).
  2. "A dashed line marks a border that is disputed" doesn't fit several dashed lines that are cease-fire or armistice lines: the Cyprus line, the Golan's 1974 line, the 1949 line and the berm. The UN's maps label them that way (Maps 3584 Rev. 2 and 4038).
  3. "As Google Maps' default view draws them" reads as a line-by-line claim about Google, which our sources can't support (rows 4, 7 and 13). Google's own statements describe what people "outside" a country see [G2, G4], which is its international view.

  P1 proposes new wording.

## 4. Licences and attribution
| Source | Read at the source on 2026-10-18 | Result |
|---|---|---|
| Natural Earth | "All versions of Natural Earth raster + vector map data … are in the public domain"; "No permission is needed … Crediting the authors is unnecessary." The one file still used, `ne_50m_admin_0_boundary_lines_land` v5.1.2, matches its pinned SHA-256 (`2faac4f6…fa48`). The countries and disputed-areas files and the masks file are gone. `styles/shared/` holds only Natural Earth geometry, so the ODbL doesn't apply to it | Pass |
| OpenMapTiles schema and style | `LICENSE.md`: code BSD 3-Clause, design CC BY 4.0 | Pass |
| OpenStreetMap data | ODbL 1.0 (copyright page). All rendering is in the style, and no tile data is changed | Pass |
| Liberty lineage | `liberty-modern/LICENSE.txt` parts (b)–(e) are byte-identical to the four upstream files today, and part (a) equals the style's metadata | Pass |
| VersaTiles Colorful | `metadata.license` is CC0 1.0, both upstream and in our copy | Pass |

The attribution on the map is unchanged and correct for the committed build. Four passages in the documents are out of date (B10):
- `docs/LICENSES.md`, "Ruling: the modern map's borders (M4-04)", still describes masks, pair filters, three Natural Earth files and "missing lines".
- Its table row says "cut and simplified".
- `ATTRIBUTION.md`'s Natural Earth row doesn't list the "Indeterminant frontier" class, which the build draws dashed.
- The drawer string for fallback A (Protomaps) still says "disputed boundary lines hidden", which contradicts F1. Fallback A isn't built.

## 5. VISUAL_SPEC §2 "Modern map" and ADR-0044 item 7
| Statement | Built | Result |
|---|---|---|
| Dashed `[4, 2]`, in the colour and width of the country border | The tiles' dashed layer copies `boundary_2`'s paint and adds `[4, 2]`. Natural Earth's dashed layer has `[4, 2]` | Pass |
| Solid lines in Liberty's `hsl(248, 1%, 41%)` | Pass on the tiles. Natural Earth's solid lines are `hsl(0, 0%, 50%)` | Needs change (B9) |
| "No mask hides lines" | Neither style uses `within`, the masks file is deleted, and no rule is `hidden`. The dead mask code is still in the script (B8) | Pass |
| "Disputed status follows the data's own flags" | The build adds pair and missing-side rules. The admin-level-3 rule isn't a dispute flag at all | Needs change (P5, B1) |
| Natural Earth's "disputed, indefinite and line-of-control classes dashed" | "Indeterminant frontier" is dashed too (it occurs only in Kashmir) | Needs change (P5) |
| "Every country border is drawn"; the spec's examples include Western Sahara and Crimea | Western Sahara's 27°40′N line and the Israel–Golan line aren't drawn, and Crimea isn't drawn from zoom 5 | Needs change (B2, B3, P3) |
| The backup draws no tile boundaries | The backup keeps upstream's `boundary-country-disputed:outline`, a light casing along Shortbread's disputed lines. M4-04 had removed it | Pass with a fix (B7) |

## 6. Method and sources
- **Tiles.**
  - I wrote scripts outside the repository that decode OpenFreeMap's tiles (planet build `20261011_080001_pt`, from the current TileJSON) and run the committed `boundary_2` and `ibm-modern-boundary-disputed` filters on every boundary feature, using MapLibre's style-spec `featureFilter` at the tile's zoom.
  - I ran them at zooms 5–8 for each place, at zoom 10 for the Armenia–Azerbaijan exclaves, and over 20°W–60°E, 10–55°N at zoom 5. I counted a segment only when its midpoint fell inside its own tile.
  - Overpass shows the admin-level-3 relations behind row 15:
    - Türkiye: 1726294, 2092903, 2094154, 2094155, 2094170, 2094193 and 2094194;
    - Russia's federal districts: for example 389344 and 1059500;
    - Kurdistan Region: 5392650;
    - Pridnestrovie: 65335;
    - Abkhazia: 1152720;
    - South Ossetia: 1152717;
    - Mount Athos: 2135921.
- **Natural Earth.** I sorted every feature of the pinned 1:50m file by `FEATURECLA` and checked its location. I also read its worldview columns, for example `FCLASS_ISO`, and the 1:10m land and disputed-areas lines (v5.1.2; disputed areas SHA-256 `69f19da7…c30b`).
- **Screenshots.** I looked at the PO's `/tmp/mc13-shots/borders/modern-*-after.png` (Balkans at zooms 7 and 4, Levant at 7.5, Cyprus at 8, Caucasus at 6.5, Crimea at 6, Western Sahara at 5) and at crops of them. The engineer's `fix-*` shots didn't exist yet. As instructed, I ran no build, tests or browser.
- **Google** (Google draws by viewer; these sources describe the international view):
  - [G1] Google, ["Learn how borders are labeled in Google Earth"](https://developers.google.com/maps/documentation/earth/border-labels): "Solid gray lines show undisputed international boundaries"; "Dotted lines show treaty and provisional boundaries"; "Dashed gray lines show disputed boundaries".
  - [G2] G. Bensinger, "Google redraws the borders on maps depending on who's looking", *The Washington Post*, 14 February 2020 (read through the Internet Archive). It quotes Google: "make every effort to objectively display the dispute in our maps using a dashed gray border line". It covers Crimea, Western Sahara and Northern Cyprus.
  - [G3] N. Lomeli, "Fact check: Google does not have a Palestine label on its maps", *USA Today*, 22 May 2021 (via Yahoo News).
  - [G4] AFP, "Borderline ambiguity: How Google Maps removes disputed Western Sahara border for Morocco users", *The Guardian*, 11 November 2025. It quotes a Google spokesperson.

  I found no published description of Google's lines for rows 4–6 and 9–16.
- **UN** (all from [un.org/geospatial](https://www.un.org/geospatial), read 2026-10-18; each carries the "do not imply official endorsement or acceptance" disclaimer):
  - Map of the World No. 4651 (Oct 2022);
  - Kosovo Region No. 4069 Rev. 7 (Jul 2020);
  - Israel No. 3584 Rev. 2 (Jan 2004);
  - Cyprus No. 4038 (Feb 2019);
  - Western Sahara No. 4669 (2023);
  - Ukraine No. 3773 Rev. 6 (Mar 2014);
  - Georgia No. 3780 Rev. 6 (Sep 2015);
  - Republic of Moldova No. 3759 Rev. 5 (Feb 2013);
  - Azerbaijan No. 3761 Rev. 10.1 (Apr 2024);
  - Sudan No. 4458 Rev. 2 (Mar 2012).

## Fixes for the engineer
- **B1 (high): narrow `cyprus-buffer-line`.**
  - **Problem:** it dashes every admin-level-3 land line that has no country codes (row 15), and it draws Kokkina's sea lines. Nothing in the tiles separates Cyprus's line from the others.
  - **Fix:** remove the rule. Draw Cyprus's line instead from Natural Earth's "Line of control" (`1746708491`, already in the shared file), in its dashed style from zoom 5. For that, use geometry without the 0.25° simplification, or the 1:10m "Line of control" features.
  - **Abkhazia and Transnistria:** keep them only if the PO decides to (P4). In that case, take them from the 1:10m disputed-areas lines ("Georgian claim" and "Moldovan claim", class "Breakaway").
  - **Test:** add a check on decoded tiles from central Anatolia, for example 6/37/24, showing that admin-level-3 features draw nothing.
- **B2 (high): draw Western Sahara's 27°40′N line dashed at every zoom, on both maps.**
  - The source is Natural Earth 5.1.2's `ne_10m_admin_0_boundary_lines_disputed_areas`, feature "Western Saharan claim", class "Elusive frontier", from 13.18°W to 8.82°W.
  - Pin that file by URL and SHA-256, the way the 1:50m file is pinned, and add the feature with `lineStyle: "dashed"`.
- **B3 (high, in progress): Crimea from zoom 5.** If the uncommitted overlay of NE `1746708787` stays:
  - (a) Use unsimplified geometry. The shared file keeps vertices at least 0.25° apart, so from about zoom 8 the line will cut across the Syvash.
  - (b) Use the country border's width (1 → 1.2 → 3), not a constant 1.
  - (c) MapLibre credits a source while any of its layers is in its zoom range, so "Natural Earth" will show in the attribution control at every zoom. Update `docs/LICENSES.md` L1, the note under string 1 ("From zoom 5 … the control reads as on the ancient map"), and the Playwright check that expects no Natural Earth credit from zoom 5.
  - (d) The Kerch Strait line is drawn only below zoom 5. Draw it at every zoom or at none, as the PO rules (P4).
- **B4 (medium): Kosovo–Serbia.**
  - Draw NE `1746706755` dashed, as an override by NE id, recorded in the rule table.
  - From zoom 5, dash the non-maritime, admin-level-2 lines that have XKK or SRB on one side and no code on the other. This is the about 14 km at Pančić's Peak. The same rule also dashes about 11 km beside the Croatia–Serbia pockets, which the tiles already flag as disputed.
- **B5 (medium): make Natural Earth agree with the tile rules for the same lines,** using id overrides recorded in the rule table:
  - Israel–Lebanon `1746705327`: solid.
  - Golan–Jordan `1746707901`: dashed.
  - Algeria–Morocco `1746708045`: solid. Make it dashed at both zoom ranges instead if the human sees Google dash it.
  - Halaib, Bir Tawil and Lebanon–Golan: follow the PO's ruling (P3, P4).
- **B6:** Kokkina's sea lines. Covered by B1.
- **B7 (low):** remove `boundary-country-disputed:outline` from the backup modern style.
- **B8 (low):** remove dead code:
  - the Shortbread `boundary_labels` filter added by `updateVersaTilesModernBoundaryFilters`, which matches nothing;
  - the mask code and empty arrays: `libertyContestedMaskRectangles`, `hiddenBoundaryAdm0Pairs`, `appendContestedMaskExclusion`, `appendAdm0PairExclusions`, `appendArmeniaAzerbaijanMissingSideCodeExclusion`, the mask-polygon and clipping helpers, and the country-pair inference;
  - the stale comment above `modernNoBorderLineStatement`.
- **B9 (low):** draw Natural Earth's solid lines in `hsl(248, 1%, 41%)`, as spec §2 says.
- **B10 (docs, in the same commit as the fixes):**
  - **`docs/LICENSES.md`:** rewrite the M4-04 ruling to: "From zoom 5 the modern Liberty copy draws the tiles' country lines solid or dashed through style filters, and never changes the tile data. The other lines come from pinned Natural Earth files (public domain). `app/public/styles/shared/` holds only Natural Earth geometry, so the ODbL does not apply to it."
  - **The table row:** change "cut and simplified" to "simplified", and add "and on the backup at every zoom".
  - **`ATTRIBUTION.md`:** in the Natural Earth row, add the "indeterminate frontier" class, and the 1:10m file if B2 lands.
  - **Fallback A drawer:** change "disputed boundary lines hidden" to "disputed borders dashed".
  - **The notice:** if the PO adopts P1, replace all 8 copies.

## Items for the PO
- **P1, the notice.** My proposed wording: "Disputed borders, and cease-fire and armistice lines, are drawn as dashed lines, following the convention of Google Maps' international view. A dashed line marks a line whose status is disputed; it is not a claim about where a border runs or who governs a place." It describes the convention without claiming that each line matches Google's, and it covers the dashed lines that aren't borders (§3).
- **P2, the Moroccan berm.** Google's statement mentions only the line for Western Sahara's disputed border [G4], and the UN doesn't draw the berm. Our map dashes it at every zoom. Ask the human to look at Google around Smara and Awsard at zoom 5–6, then keep or drop the berm.
- **P3, the Golan.** No source says which Golan lines Google draws.
  - There's no Israel–Golan line, because the tiles have none. Natural Earth 1:10m has it as "Syrian claim".
  - The 18 km Lebanon–Golan line can't be separated from Lebanon–Israel by any property. It would take a geometry rule or a Natural Earth overlay drawn over a hole in the solid line.
  - Ask the human to look at zoom 8 around Banias and Quneitra.
- **P4, lines only a look at Google can settle at MC13.** For each, the human notes solid, dashed or none:
  - the Green Line, and the Sovereign Base Areas at zoom 8;
  - Abkhazia and South Ossetia at zoom 6;
  - Transnistria at zoom 6;
  - the Armenia–Azerbaijan exclaves at zoom 10;
  - Halaib and Bir Tawil at zoom 6, including whether a line runs north of Halaib;
  - Algeria–Morocco at zoom 5;
  - the Kerch Strait;
  - row 16's lines.

  Unless they're kept on purpose, B1 removes the lines for Abkhazia and Transnistria.
- **P5, ADR-0044 item 7 and spec §2.** Change "follows the data's own flags" to "follows the data's flags, plus the per-case rules listed in the build script's rule table, each checked by the Fact-Checker". Add "indeterminate frontier" to spec §2's Natural Earth classes.
- **P6, re-check.** After B1–B5 I'll re-run the tile and Natural Earth checks. For that, please have the engineer save fix shots of central Anatolia at zooms 5–7, Western Sahara at zooms 4 and 6, Crimea at zooms 6 and 9, Cyprus at zoom 8, and Kosovo and the Levant at zoom 4.
- **P7 (outside this card, from M4-04).** The backup draws Natural Earth 1:50m lines, simplified to 0.25°, at every zoom up to 14, so its lines can be several kilometres off at high zoom.

## Re-check (phase 2), 2026-10-18
**Commit:** `5251b96`, with the PO's rulings P1–P5 (P4 defaults: Abkhazia and South Ossetia dashed; no line for Transnistria or the Kerch Strait; Halaib and Bir Tawil dashed at both zoom ranges; Algeria–Morocco solid at both; the Sovereign Base Areas and row 16 unchanged). Method as in §6:
- I ran the same tile build (`20261011_080001_pt`) through the committed filters, with a zoom 5 scan of the reach and zooms 5–8 for each place.
- I rebuilt `modern-neutral-boundaries.geojson` myself from the two pinned Natural Earth files (both SHA-256s match). My copy is byte-identical to the committed file: 391 features.
- I compared the 1:50m overlay lines with Natural Earth's 1:10m lines.
- I looked at the 10 modern `fix2-*` shots. The 3 ancient ones are outside this check.

I ran no build, tests or browser.

**Result: needs change.** 9 of the 16 lines pass, 3 need change and 4 still wait for a look at Google:
- the Moroccan berm is still dashed from zoom 5;
- South Ossetia has no line below zoom 5 or on the backup;
- below zoom 5 and on the backup, the whole Egypt–Sudan border is dashed.

Several documents still say that Natural Earth is drawn and credited only below zoom 5. The notice (P1) is identical in all 8 copies.

| Item | Verdict | Evidence |
|---|---|---|
| B1 | Pass | The admin-level-3 rule is gone. The zoom 5 scan finds no admin-level-3 line except South Ossetia's disputed one, and the Anatolia shots at zooms 5–7 are clean. Cyprus's line now comes from NE `1746708491`, unsimplified. A unit test and a Playwright check were added. One low note (C5) |
| B2 | Needs change | The 27°40′N line comes from the pinned 1:10m file (`69f19da7…c30b`, which matches) and is dashed at every zoom on both maps (zoom 4 and 6 shots). The berm is still dashed from zoom 5 (C1) |
| B3 | Needs change (documents) | (a) unsimplified 1:50m line with 15 vertices; (b) the country border's width; (d) the Kerch line hidden: all pass. (c) The control now shows "Natural Earth" at every zoom (the shots at zooms 6, 8 and 9), but the documents haven't caught up (C4) |
| B4 | Pass | NE `1746706755` is dashed (zoom 4 shot). The missing-side rule dashes the Pančić's Peak pocket (14.5 km at zoom 8) and, as expected, about 10 km beside the Croatia–Serbia pockets |
| B5 | Needs change | Israel–Lebanon is solid (zoom 4 shot), Golan–Jordan dashed and Algeria–Morocco solid, at both zoom ranges. Halaib and Bir Tawil are wrong below zoom 5 (C3) |
| B6 | Pass | Kokkina's sea lines are gone (tiles at zoom 8; zoom 8 shot) |
| B7 | Pass | The backup no longer has `boundary-country-disputed:outline` |
| B8 | Pass | The Shortbread filter, the mask code and the stale comment are gone. Three unused helpers and one dead override remain (C5) |
| B9 | Pass | Natural Earth's solid lines are `hsl(248, 1%, 41%)` |
| B10 | Needs change (documents) | The M4-04 ruling is rewritten, the fallback A drawer is fixed, `ATTRIBUTION.md` lists the indeterminate-frontier class, and P5 is in ADR-0044 and spec §2. The "below zoom 5" passages remain (C4) |

| # | Line | Now: below zoom 5 and backup / from zoom 5 | Verdict |
|---|---|---|---|
| 1 | Kosovo–Serbia | Dashed at every zoom, including the pocket at Pančić's Peak | Pass |
| 2 | Israel–West Bank | Unchanged: dashed at every zoom | Pass |
| 3 | Israel–Gaza | Unchanged: dashed at every zoom | Pass |
| 4 | Golan Heights | The 1974 line, Golan–Jordan and the new west line (NE 1:10m "Syrian claim") are dashed at every zoom. Lebanon–Golan is dashed below zoom 5 and solid from zoom 5, as the PO ruled (P3) | Pass on the PO's ruling; Google not yet confirmed |
| 5 | Northern Cyprus | The Green Line is dashed at every zoom, and Kokkina's sea lines are gone | Pass (C5) |
| 6 | Sovereign Base Areas | Unchanged | Can't tell |
| 7 | Western Sahara–Morocco | 27°40′N dashed at every zoom. The berm is hidden below zoom 5 and on the backup but **still dashed from zoom 5**: 1,276–1,313 km at zooms 5–7, plainly visible in the zoom 6 shot | Needs change (C1) |
| 8 | Crimea | The isthmus is dashed at every zoom (zoom 6 shot). No Kerch Strait line | Pass (C5) |
| 9 | Abkhazia and South Ossetia | Abkhazia is dashed at every zoom. South Ossetia is dashed from zoom 5 only, **with no line below zoom 5 or on the backup** | Needs change (C2) |
| 10 | Transnistria | No line at any zoom | Pass on the PO's default |
| 11 | Nagorno-Karabakh, Armenia–Azerbaijan | Unchanged | Can't tell |
| 12 | Russia–Georgia | Unchanged: solid | Can't tell |
| 13 | Halaib Triangle and Bir Tawil | Below zoom 5 and on the backup, **the whole 22°N line is dashed** (NE `1746709045`, from Libya to the Red Sea), including 893 km west of Bir Tawil that the tiles draw solid from zoom 5. Bir Tawil's south line isn't drawn there. From zoom 5: unchanged | Needs change (C3, P9) |
| 14 | Algeria–Morocco | Solid at both zoom ranges | Pass on the PO's default |
| 15 | Admin-level-3 lines | None drawn | Pass |
| 16 | Other flagged lines | Unchanged | Can't tell |

### Fixes for the engineer (phase 2)
- **C1 (P2): hide the berm from zoom 5.**
  - Add a `hidden` rule: `["==", ["get", "disputed_name"], "Murdesécuritémarocainالجدارالأمنيالمغربي"]`. OpenMapTiles stores `disputed_name` without spaces.
  - Also make the `dashed` branch of `appendModernTileRenderFilter` exclude the hidden rules, as the `solid` branch already does. As it stands, a hidden rule can't remove a line that the disputed flag dashes.
  - Test it on the decoded berm feature.
  - After the fix, about 35 km of unnamed disputed pieces would stay dashed: a 27 km spur at 8.8°W, from 27.67°N to 27.42°N, and about 8 km at Guerguerat (P8).
- **C2 (P4): South Ossetia below zoom 5 and on the backup.** Add NE 1:10m `1746705385` ("Georgian claim", class "Breakaway") to the shared file as a dashed line. Don't add it as an overlay from zoom 5, because the tiles already draw it there.
- **C3 (P4): Egypt–Sudan.**
  - In the build, split `1746709045` at 33.17°E: solid to the west (893 km), dashed to the east (372 km).
  - Add NE 1:10m `1746705805` ("Bir Tawil", class "Elusive frontier") so that Bir Tawil's south line also shows below zoom 5 and on the backup.
  - Halaib's north line (NE 1:10m `1746705785`, "Sudanese claim") isn't drawn at any zoom (P9).
- **C4 (documents): Natural Earth is now drawn, and credited, at every zoom on the main modern map,** because five overlays start at zoom 5. Update:
  - `docs/LICENSES.md`: L1 ("only while that source's layer is drawn (below zoom 5)"), the note under string 1 ("From zoom 5 … reads as on the ancient map"), and the table rows on lines 13, 125 and 301;
  - the Natural Earth row in `ATTRIBUTION.md`: "below zoom 5 on the main map", and "then simplifies the result", although the Cyprus, Crimea and 1:10m lines aren't simplified;
  - string 4 and `LICENSE.txt` part (a): "below zoom 5 Natural Earth's boundary lines" and "Country borders below zoom 5: Natural Earth".
- **C5 (low).**
  - **Geometry:** the Cyprus and Crimea overlays use 1:50m lines. Natural Earth's own 1:10m lines lie up to 4.9 km from them (mean 1.5 km) for Cyprus and up to 2.5 km (mean 0.7 km) for Crimea, which shows from about zoom 8–9. Near Perekop at high zoom, the tiles' exact Crimea fragments also draw beside the overlay. The 1:10m features ("Line of control"; "Disputed (please verify)" for Crimea) would fit better; the 1:10m land file would need its own pin.
  - **Dead code:** remove `appendDisputedFilterExclusion`, `normalizeDisputedAreaName` and `asPolygonCoordinates`, and the override for `1746705379`, which no rule loads.

### Items for the PO (phase 2)
- **P8:** after C1, decide whether to keep or hide the unnamed disputed pieces in Western Sahara. A rule on their properties (disputed, with no name and no claimant) would also hide a 5.5 km piece on the Armenia–Azerbaijan border near 46.2°E 39.6°N.
- **P9:** decide on Halaib's north line: add it at every zoom, as the UN draws Halaib's administrative line (Map 4458 Rev. 2), or leave Halaib inside Egypt's outline, as the tiles draw it.
- **P7** isn't in `BACKLOG.md` on this branch yet.
- **At MC13:** besides the lines marked "Can't tell", the human should also check the lines that rest on PO defaults (rows 4, 10 and 14) in Google Maps.

## Re-check (phase 3), 2026-10-19
**Commit:** `1165c51` (the branch is rebased onto M5-09). Method as in phase 2:
- I ran the same tile build through the committed filters.
- I rebuilt `modern-neutral-boundaries.geojson` myself from the three pinned Natural Earth files: 1:50m land lines, 1:10m disputed areas, and the newly pinned 1:10m land lines `74d9c162…0f4a`. All three SHA-256s match. My copy is byte-identical to the committed file: 397 features.
- I looked at the six `fix3-*` shots.

The style filters match the rule table, and neither style uses `within`.

**Result: needs change.** Two problems remain:
- **Doubled lines (C5).** Cyprus's Green Line and Crimea's border are each drawn twice, at every zoom.
- **Leftover stubs (C1, low).** Short unnamed pieces of the Moroccan berm are still dashed.

| Fix | Verdict | Evidence |
|---|---|---|
| C1 | Needs change (low) | The named berm is hidden: 0 km from zoom 5 in the tiles, and gone from the zoom 4 and 6 shots. The dashed filter now excludes hidden rules. But the rule for unnamed stubs requires MAR or ESH on one side, and these features carry no country codes at all. So about 35 km stay dashed: a 27 km spur at 8.8°W (visible in the zoom 6 shot) and about 8 km at Guerguerat |
| C2 | Pass | South Ossetia's line (`1746705385`) is dashed below zoom 5 and on the backup (zoom 4 shot). From zoom 5 the tiles draw it, as before (zoom 6 shot), and no second copy is drawn |
| C3 | Pass | `1746709045` is split at 33.17°E: the west part is solid (including the Wadi Halfa bump), the east part dashed. Bir Tawil's south line (`1746705805`) is dashed below zoom 5 and on the backup. Halaib's north line (`1746705785`) is dashed at every zoom (P9). The zoom 4 and 6 shots match the tiles |
| C4 | Pass | `docs/LICENSES.md` (rows on lines 13, 125 and 301, L1, the note under string 1, string 4), `ATTRIBUTION.md` and `LICENSE.txt` part (a) are updated; part (a) equals the style's metadata. The notice is identical in all 8 copies |
| C5 | **Needs change (new problem)** | The 1:10m Cyprus and Crimea lines were added, but the 1:50m features with the same ids are still in the file, now simplified to 7 and 6 vertices. Both copies are dashed and both match the overlays' id filters, so **two dashed lines are drawn at every zoom**. They lie up to 9.9 km apart in Cyprus (mean 2.4 km) and 10.8 km apart in Crimea (mean 2.9 km). The coarse Cyprus copy alone covers 33.68–34.00°E. The three unused helpers and the override for `1746705379` also remain |

**No other regressions:**
- **Kosovo:** unchanged in the tiles at zoom 8 (Kosovo–Serbia and the Pančić's Peak pocket dashed; Kosovo's other borders solid), and dashed in Natural Earth.
- **Levant:** every tile line at zoom 8 is unchanged from phase 2, and so are the Natural Earth lines.
- **Cyprus:** the tiles are unchanged (only the solid base outlines), but Natural Earth's Green Line is doubled (C5).
- **Elsewhere:** the zoom 5 scan of the reach matches phase 2, less the berm.

**The 16 lines now:**
- **Pass (9):**
  - on published evidence: rows 1–3 and 15;
  - on the PO's rulings or defaults: rows 4, 9, 10, 13 and 14.
- **Need change (3):**
  - rows 5 and 8, the doubled lines (C5);
  - row 7, the berm stubs (C1, low).
- **Can't tell until MC13 (4):** rows 6, 11, 12 and 16.

### Fixes for the engineer (phase 3)
- **D1 (C5):** add `1746708491` and `1746708787` to `naturalEarthBoundaryIdOverrides` as `hidden`. Those overrides apply only to the 1:50m pass, so the 1:10m copies stay. Also add the 1:10m Green Line's east piece, `1746708483` (33.91–34.01°E), to the Cyprus rule, so the line still reaches the coast south of Famagusta.
- **D2 (C1, low):** drop the MAR/ESH condition from the unnamed-stub rule. That would also hide the 5.5 km unnamed piece on the Armenia–Azerbaijan border (P8's caveat), and the 9 km unnamed piece of the 27°40′N line at the Algerian border. To fill that last gap, add the 1:10m land line `1746708721` (8.82–8.68°W) to the Western Sahara rule. Alternatively, the PO accepts the stubs.
