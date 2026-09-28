import {
  buildVisiblePlaceEntries,
  isZoomTierVisible,
  shouldExpandCandidatePins
} from "../src/features/map/place-visibility";
import type { PlaceIndexRecord } from "../src/features/map/types";

const disputedPlace: PlaceIndexRecord = {
  id: "emmaus",
  names: {
    ancient: ["Emmaus"],
    alternate: []
  },
  type: "village",
  zoomTier: "city",
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

const nonDisputedMultiCandidatePlace: PlaceIndexRecord = {
  ...disputedPlace,
  id: "jericho",
  names: {
    ancient: ["Jericho"],
    modern: "Jericho",
    alternate: []
  },
  candidates: [
    {
      label: "Tell es-Sultan",
      coordinates: [35.45, 31.87],
      confidence: "high"
    },
    {
      label: "Herodian Jericho",
      coordinates: [35.46, 31.84],
      confidence: "medium"
    }
  ]
};

describe("place visibility", () => {
  test("applies zoom-tier rules", () => {
    expect(isZoomTierVisible("region", 4)).toBe(true);
    expect(isZoomTierVisible("region", 9)).toBe(true);
    expect(isZoomTierVisible("region", 9.1)).toBe(false);
    expect(isZoomTierVisible("city", 3.9)).toBe(false);
    expect(isZoomTierVisible("city", 4)).toBe(true);
    expect(isZoomTierVisible("site", 11.9)).toBe(false);
    expect(isZoomTierVisible("site", 12)).toBe(true);
  });

  test("shows one pin with a question badge for disputed multi-candidate places below zoom 8", () => {
    const entries = buildVisiblePlaceEntries([disputedPlace], 7.9, null);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe("pin");
    expect(entries[0]).toMatchObject({
      kind: "pin",
      showQuestionBadge: true
    });
  });

  test("does not show a question badge for non-disputed multi-candidate places", () => {
    const entries = buildVisiblePlaceEntries([nonDisputedMultiCandidatePlace], 7.9, null);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: "pin",
      showQuestionBadge: false
    });
  });

  test("expands to lettered candidate pins at zoom 8+", () => {
    const entries = buildVisiblePlaceEntries([disputedPlace], 8, null);
    expect(entries).toHaveLength(2);
    expect(entries.every((entry) => entry.kind === "candidate-pin")).toBe(true);
    expect(
      entries.map((entry) =>
        entry.kind === "candidate-pin" ? entry.candidateLetter : "?"
      )
    ).toEqual(["A", "B"]);
  });

  test("expands to lettered candidate pins when selected below zoom 8", () => {
    expect(shouldExpandCandidatePins(disputedPlace, 6, null)).toBe(false);
    expect(
      shouldExpandCandidatePins(disputedPlace, 6, {
        placeId: disputedPlace.id,
        candidateIndex: 1
      })
    ).toBe(true);

    const entries = buildVisiblePlaceEntries([disputedPlace], 6, {
      placeId: disputedPlace.id,
      candidateIndex: 1
    });

    expect(entries).toHaveLength(2);
    expect(entries[1]).toMatchObject({
      kind: "candidate-pin",
      candidateLetter: "B",
      selected: true
    });
  });
});
