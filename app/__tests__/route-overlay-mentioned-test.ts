import { buildMentionedPointFeatures } from "../src/features/routes/overlay-mentioned";
import type { PlaceIndexRecord } from "../src/features/map/types";
import type { RouteStageRecord, RouteStopRecord } from "../src/features/routes/types";

const placeFixture: PlaceIndexRecord = {
  id: "sidon",
  names: {
    ancient: ["Sidon"],
    alternate: []
  },
  type: "city",
  zoomTier: "city",
  parentId: null,
  prominence: "standard",
  passageCount: 0,
  candidates: [
    {
      label: "Sidon",
      coordinates: [35.37, 33.56],
      confidence: "high"
    }
  ]
};

const secondPlaceFixture: PlaceIndexRecord = {
  id: "tyre",
  names: {
    ancient: ["Tyre"],
    alternate: []
  },
  type: "city",
  zoomTier: "city",
  parentId: null,
  prominence: "standard",
  passageCount: 0,
  candidates: [
    {
      label: "Tyre",
      coordinates: [35.19, 33.27],
      confidence: "high"
    }
  ]
};

const thirdPlaceFixture: PlaceIndexRecord = {
  id: "byblos",
  names: {
    ancient: ["Byblos"],
    alternate: []
  },
  type: "city",
  zoomTier: "city",
  parentId: null,
  prominence: "standard",
  passageCount: 0,
  candidates: [
    {
      label: "Byblos",
      coordinates: [35.65, 34.12],
      confidence: "high"
    }
  ]
};

const routeStopFixture: RouteStopRecord = {
  id: "stop-1",
  name: "Stop 1",
  candidates: [
    {
      label: "Stop 1 A",
      coordinates: [35.37, 33.56],
      coordinateSource: "wikidata:Q1",
      confidence: "high",
      support: "Fixture",
      sources: ["wikidata:Q1"]
    },
    {
      label: "Stop 1 B",
      coordinates: [35.4, 33.6],
      coordinateSource: "wikidata:Q2",
      confidence: "medium",
      support: "Fixture",
      sources: ["wikidata:Q2"]
    }
  ],
  scripture: [],
  sources: [],
  status: "draft"
};

describe("route mentioned overlay features", () => {
  test("deduplicates mentioned places across stages and keeps highlight state", () => {
    const stages: RouteStageRecord[] = [
      {
        id: "stage-1",
        from: { kind: "location", locationId: "sidon" },
        to: { kind: "location", locationId: "tyre" },
        scripture: [],
        travelMode: "land",
        mentioned: [{ kind: "location", locationId: "byblos" }],
        sources: []
      },
      {
        id: "stage-2",
        from: { kind: "location", locationId: "tyre" },
        to: { kind: "location", locationId: "tyre" },
        scripture: [],
        travelMode: "land",
        mentioned: [{ kind: "location", locationId: "byblos" }],
        sources: []
      }
    ];

    const features = buildMentionedPointFeatures({
      routeId: "jesus",
      stages,
      selectedStageId: "stage-2",
      highlightedStageId: "stage-1",
      emphasizedStageId: "stage-1",
      placesById: new Map([
        [placeFixture.id, placeFixture],
        [secondPlaceFixture.id, secondPlaceFixture],
        [thirdPlaceFixture.id, thirdPlaceFixture]
      ]),
      routeStopsById: new Map([[routeStopFixture.id, routeStopFixture]])
    });

    expect(features).toHaveLength(1);
    expect(features[0].properties.isSelectedStage).toBe(true);
    expect(features[0].properties.isHighlightedStage).toBe(true);
    expect(features[0].properties.isDimmed).toBe(false);
  });

  test("keeps route-stop mentioned candidates separate by candidate index", () => {
    const stages: RouteStageRecord[] = [
      {
        id: "stage-1",
        from: { kind: "location", locationId: "sidon" },
        to: { kind: "location", locationId: "tyre" },
        scripture: [],
        travelMode: "land",
        mentioned: [{ kind: "route-stop", stopId: "stop-1", candidateIndex: 0 }],
        sources: []
      },
      {
        id: "stage-2",
        from: { kind: "location", locationId: "tyre" },
        to: { kind: "location", locationId: "sidon" },
        scripture: [],
        travelMode: "land",
        mentioned: [{ kind: "route-stop", stopId: "stop-1", candidateIndex: 1 }],
        sources: []
      }
    ];

    const features = buildMentionedPointFeatures({
      routeId: "paul-1",
      stages,
      selectedStageId: null,
      highlightedStageId: null,
      emphasizedStageId: null,
      placesById: new Map([
        [placeFixture.id, placeFixture],
        [secondPlaceFixture.id, secondPlaceFixture],
        [thirdPlaceFixture.id, thirdPlaceFixture]
      ]),
      routeStopsById: new Map([[routeStopFixture.id, routeStopFixture]])
    });

    expect(features).toHaveLength(2);
  });

  test("does not include mentioned places that are route stops in another stage", () => {
    const stages: RouteStageRecord[] = [
      {
        id: "stage-1",
        from: { kind: "location", locationId: "sidon" },
        to: { kind: "location", locationId: "tyre" },
        scripture: [],
        travelMode: "land",
        sources: []
      },
      {
        id: "stage-2",
        from: { kind: "location", locationId: "tyre" },
        to: { kind: "location", locationId: "tyre" },
        scripture: [],
        travelMode: "land",
        mentioned: [{ kind: "location", locationId: "sidon" }],
        sources: []
      }
    ];

    const features = buildMentionedPointFeatures({
      routeId: "jesus",
      stages,
      selectedStageId: null,
      highlightedStageId: null,
      emphasizedStageId: null,
      placesById: new Map([
        [placeFixture.id, placeFixture],
        [secondPlaceFixture.id, secondPlaceFixture],
        [thirdPlaceFixture.id, thirdPlaceFixture]
      ]),
      routeStopsById: new Map([[routeStopFixture.id, routeStopFixture]])
    });

    expect(features).toHaveLength(0);
  });
});
