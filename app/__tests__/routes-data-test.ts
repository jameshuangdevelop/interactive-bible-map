import {
  loadRoutesData,
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

  test("loads routes bibliography into citation map", async () => {
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { hostname: "localhost" } }
    });
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/generated/routes.routes.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            version: 1,
            routeCount: 1,
            routes: [
              {
                id: "paul-1",
                title: "Paul route",
                fromYear: 46,
                toYear: 48,
                structure: "connected",
                summary: "Summary",
                bibleText: "Bible",
                notes: [],
                stageCount: 0,
                sources: ["bib:fixture-source"]
              }
            ],
            bibliography: [
              {
                id: "fixture-source",
                type: "book",
                title: "Fixture bibliography",
                authors: ["A. Writer"],
                year: 2026,
                url: "https://example.test/fixture-source"
              }
            ]
          })
        } as Response);
      }
      if (url.includes("/generated/routes.stages.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ version: 1, routes: [{ id: "paul-1", stages: [] }] })
        } as Response);
      }
      if (url.includes("/generated/routes.stops.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ version: 1, stops: [] })
        } as Response);
      }
      if (url.includes("/generated/routes.lines.geojson")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ type: "FeatureCollection", features: [] })
        } as Response);
      }
      throw new Error(`Unexpected fetch url: ${url}`);
    });

    try {
      const loaded = await loadRoutesData("");
      expect(loaded.bibliographyById.get("fixture-source")?.title).toBe("Fixture bibliography");
    } finally {
      fetchSpy.mockRestore();
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow
      });
    }
  });
});
