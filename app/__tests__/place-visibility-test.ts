import {
  candidateIndexToLetter,
  getSelectionZoomTarget,
  isAreaLabelType,
  isSelectedRegionPlace,
  isDisputedPlace,
  isZoomTierVisible
} from "../src/features/map/place-visibility";
import type { PlaceIndexRecord } from "../src/features/map/types";

describe("place visibility helpers", () => {
  test("applies zoom-tier rules", () => {
    expect(isZoomTierVisible("region", 4)).toBe(true);
    expect(isZoomTierVisible("region", 9)).toBe(true);
    expect(isZoomTierVisible("region", 9.1)).toBe(false);
    expect(isZoomTierVisible("city", 5.9)).toBe(false);
    expect(isZoomTierVisible("city", 6)).toBe(true);
    expect(isZoomTierVisible("site", 11.9)).toBe(false);
    expect(isZoomTierVisible("site", 12)).toBe(true);
  });

  test("recognizes disputed places by candidate confidence", () => {
    const place: PlaceIndexRecord = {
      id: "emmaus",
      names: {
        ancient: ["Emmaus"],
        alternate: []
      },
      type: "village",
      zoomTier: "city",
      prominence: "standard",
      passageCount: 2,
      parentId: "judea",
      candidates: [
        {
          label: "A",
          coordinates: [35.1, 31.8],
          confidence: "disputed"
        },
        {
          label: "B",
          coordinates: [35.2, 31.7],
          confidence: "low"
        }
      ]
    };

    expect(isDisputedPlace(place)).toBe(true);
  });

  test("maps selection zoom targets by record type", () => {
    const empire: PlaceIndexRecord = {
      id: "roman-empire",
      names: { ancient: ["Roman Empire"], alternate: [] },
      type: "empire",
      zoomTier: "region",
      prominence: "standard",
      passageCount: 2,
      parentId: null,
      candidates: [{ label: "Roman Empire", coordinates: [20, 38], confidence: "high" }]
    };
    const province: PlaceIndexRecord = {
      ...empire,
      id: "achaia",
      names: { ancient: ["Achaia"], alternate: [] },
      type: "province"
    };
    const site: PlaceIndexRecord = {
      ...empire,
      id: "temple-mount",
      names: { ancient: ["Temple Mount"], alternate: [] },
      type: "site",
      zoomTier: "site"
    };
    const city: PlaceIndexRecord = {
      ...empire,
      id: "capernaum",
      names: { ancient: ["Capernaum"], alternate: [] },
      type: "city",
      zoomTier: "city"
    };

    expect(getSelectionZoomTarget(empire)).toBe(4);
    expect(getSelectionZoomTarget(province)).toBe(7);
    expect(getSelectionZoomTarget(site)).toBe(14);
    expect(getSelectionZoomTarget(city)).toBe(11);
  });

  test("marks area-label types and candidate letters", () => {
    expect(isAreaLabelType("empire")).toBe(true);
    expect(isAreaLabelType("province")).toBe(true);
    expect(isAreaLabelType("region")).toBe(true);
    expect(isAreaLabelType("city")).toBe(false);
    expect(candidateIndexToLetter(0)).toBe("A");
    expect(candidateIndexToLetter(3)).toBe("D");
  });

  test("identifies selected-region places across modes and outline ids", () => {
    const outlineIds = new Set(["chios", "cos", "malta", "rhodes", "samos"]);
    const regionPlace: Pick<PlaceIndexRecord, "id" | "type"> = { id: "galilee", type: "region" };
    const provincePlace: Pick<PlaceIndexRecord, "id" | "type"> = { id: "asia", type: "province" };
    const listedNaturalFeature: Pick<PlaceIndexRecord, "id" | "type"> = {
      id: "chios",
      type: "natural-feature"
    };
    const unlistedNaturalFeature: Pick<PlaceIndexRecord, "id" | "type"> = {
      id: "patmos",
      type: "natural-feature"
    };
    const cityPlace: Pick<PlaceIndexRecord, "id" | "type"> = { id: "ephesus", type: "city" };

    expect(
      isSelectedRegionPlace({ mapMode: "ancient", place: regionPlace, regionOutlineIds: outlineIds })
    ).toBe(true);
    expect(
      isSelectedRegionPlace({ mapMode: "modern", place: regionPlace, regionOutlineIds: outlineIds })
    ).toBe(true);
    expect(
      isSelectedRegionPlace({ mapMode: "ancient", place: provincePlace, regionOutlineIds: outlineIds })
    ).toBe(true);
    expect(
      isSelectedRegionPlace({ mapMode: "modern", place: provincePlace, regionOutlineIds: outlineIds })
    ).toBe(true);
    expect(
      isSelectedRegionPlace({
        mapMode: "ancient",
        place: listedNaturalFeature,
        regionOutlineIds: outlineIds
      })
    ).toBe(true);
    expect(
      isSelectedRegionPlace({
        mapMode: "modern",
        place: listedNaturalFeature,
        regionOutlineIds: outlineIds
      })
    ).toBe(false);
    expect(
      isSelectedRegionPlace({
        mapMode: "ancient",
        place: unlistedNaturalFeature,
        regionOutlineIds: outlineIds
      })
    ).toBe(false);
    expect(
      isSelectedRegionPlace({ mapMode: "ancient", place: cityPlace, regionOutlineIds: outlineIds })
    ).toBe(false);
  });
});
