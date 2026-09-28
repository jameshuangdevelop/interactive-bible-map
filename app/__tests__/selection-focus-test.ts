import { planSelectionFocus } from "../src/features/map/selection-focus";
import type { PlaceIndexRecord, PlaceSelection } from "../src/features/map/types";

const multiCandidatePlace: PlaceIndexRecord = {
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

const singleCandidatePlace: PlaceIndexRecord = {
  id: "capernaum",
  names: {
    ancient: ["Capernaum"],
    alternate: []
  },
  type: "city",
  zoomTier: "city",
  parentId: "galilee",
  candidates: [
    {
      label: "Traditional",
      coordinates: [35.57, 32.88],
      confidence: "high"
    }
  ]
};

describe("planSelectionFocus", () => {
  test("fits all candidates when selecting the place without a candidate letter", () => {
    const selection: PlaceSelection = {
      placeId: multiCandidatePlace.id,
      candidateIndex: null
    };

    const focusPlan = planSelectionFocus(multiCandidatePlace, selection);

    expect(focusPlan).toEqual({
      kind: "fit-bounds",
      coordinates: [
        [35.1, 31.8],
        [35.2, 31.7]
      ],
      zoom: 11
    });
  });

  test("centers on the selected candidate when a candidate letter is provided", () => {
    const selection: PlaceSelection = {
      placeId: multiCandidatePlace.id,
      candidateIndex: 1
    };

    const focusPlan = planSelectionFocus(multiCandidatePlace, selection);

    expect(focusPlan).toEqual({
      kind: "center",
      coordinates: [35.2, 31.7],
      zoom: 11
    });
  });

  test("centers the only candidate for single-candidate places", () => {
    const selection: PlaceSelection = {
      placeId: singleCandidatePlace.id,
      candidateIndex: null
    };

    const focusPlan = planSelectionFocus(singleCandidatePlace, selection);

    expect(focusPlan).toEqual({
      kind: "center",
      coordinates: [35.57, 32.88],
      zoom: 11
    });
  });
});
