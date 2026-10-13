import {
  resolveRouteStop,
  routeLineFeatureByStage,
  stageHasDisputedStop
} from "../src/features/routes/routes-data";
import type { PlaceIndexRecord } from "../src/features/map/types";
import type { RouteLinesPayload, RouteStageRecord, RouteStopRecord } from "../src/features/routes/types";

const placeFixture: PlaceIndexRecord = {
  id: "capernaum",
  names: {
    ancient: ["Capernaum"],
    alternate: []
  },
  type: "city",
  zoomTier: "city",
  parentId: null,
  prominence: "standard",
  passageCount: 0,
  candidates: [
    {
      label: "Fixture",
      coordinates: [35.575, 32.88],
      confidence: "high"
    }
  ]
};

const stopFixture: RouteStopRecord = {
  id: "disputed-stop",
  name: "Disputed stop",
  candidates: [
    {
      label: "A",
      coordinates: [35.56, 32.9],
      coordinateSource: "openbible:capernaum",
      confidence: "disputed",
      support: "Fixture",
      sources: ["openbible:capernaum", "wikidata:Q5732"]
    }
  ],
  scripture: [],
  sources: [],
  status: "draft"
};

describe("routes data helpers", () => {
  test("resolves location and route-stop references", () => {
    const placesById = new Map([[placeFixture.id, placeFixture]]);
    const stopsById = new Map([[stopFixture.id, stopFixture]]);

    const location = resolveRouteStop(
      { kind: "location", locationId: "capernaum", candidateIndex: 0 },
      placesById,
      stopsById
    );
    expect(location.kind).toBe("location");
    expect(location.name).toBe("Capernaum");

    const routeStop = resolveRouteStop(
      { kind: "route-stop", stopId: "disputed-stop", candidateIndex: 0 },
      placesById,
      stopsById
    );
    expect(routeStop.kind).toBe("route-stop");
    expect(routeStop.name).toBe("Disputed stop");
  });

  test("detects disputed stage endpoints", () => {
    const stage: RouteStageRecord = {
      id: "stage-01",
      from: { kind: "location", locationId: "capernaum" },
      to: { kind: "route-stop", stopId: "disputed-stop" },
      scripture: [],
      travelMode: "land",
      sources: []
    };
    const stopsById = new Map([[stopFixture.id, stopFixture]]);
    expect(stageHasDisputedStop(stage, stopsById)).toBe(true);
  });

  test("finds line features by route-stage-line key", () => {
    const lines: RouteLinesPayload = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            lineId: "line-1",
            routeId: "paul-1",
            stageId: "stage-01"
          },
          geometry: {
            type: "LineString",
            coordinates: [[35, 32], [36, 33]]
          }
        }
      ]
    };

    const match = routeLineFeatureByStage(lines, "paul-1", "stage-01", "line-1");
    expect(match?.properties.lineId).toBe("line-1");
    expect(routeLineFeatureByStage(lines, "paul-1", "stage-02", "line-1")).toBeNull();
  });
});
