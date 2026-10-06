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
  prominence: "standard",
  passageCount: 3,
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
  prominence: "standard",
  passageCount: 21,
  parentId: "galilee",
  candidates: [
    {
      label: "Traditional",
      coordinates: [35.57, 32.88],
      confidence: "high"
    }
  ]
};

const sitePlace: PlaceIndexRecord = {
  id: "temple-mount",
  names: {
    ancient: ["Temple Mount"],
    alternate: []
  },
  type: "site",
  zoomTier: "site",
  prominence: "standard",
  passageCount: 9,
  parentId: "jerusalem",
  candidates: [
    {
      label: "Temple Mount / Haram al-Sharif",
      coordinates: [35.235556, 31.777778],
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

  test("uses zoom 14 for site-level selections", () => {
    const focusPlan = planSelectionFocus(sitePlace, {
      placeId: sitePlace.id,
      candidateIndex: null
    });

    expect(focusPlan).toEqual({
      kind: "center",
      coordinates: [35.235556, 31.777778],
      zoom: 14
    });
  });

  test("reselecting the same disputed place still reuses fit-all-sites framing", () => {
    const initialPlaceFocus = planSelectionFocus(multiCandidatePlace, {
      placeId: multiCandidatePlace.id,
      candidateIndex: null
    });
    expect(initialPlaceFocus).toEqual({
      kind: "fit-bounds",
      coordinates: [
        [35.1, 31.8],
        [35.2, 31.7]
      ],
      zoom: 11
    });

    const candidateFocus = planSelectionFocus(multiCandidatePlace, {
      placeId: multiCandidatePlace.id,
      candidateIndex: 1
    });
    expect(candidateFocus).toEqual({
      kind: "center",
      coordinates: [35.2, 31.7],
      zoom: 11
    });

    const repeatedPlaceFocus = planSelectionFocus(multiCandidatePlace, {
      placeId: multiCandidatePlace.id,
      candidateIndex: null
    });
    expect(repeatedPlaceFocus).toEqual(initialPlaceFocus);
  });
});
