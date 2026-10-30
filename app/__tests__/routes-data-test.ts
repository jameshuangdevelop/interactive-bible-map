import {
  linelessStagePillCoordinate,
  loadRoutesData,
  resolveRouteStop,
  routeLineFeatureByStage,
  stageHasDisputedStop
} from "../src/features/routes/routes-data";
import type { PlaceIndexRecord } from "../src/features/map/types";
import type { RouteLinesPayload, RouteStageRecord, RouteStopRecord, RouteStopRef } from "../src/features/routes/types";

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

  describe("where a stage without a line shows its number", () => {
    const place = (id: string, coordinates: [number, number][]): PlaceIndexRecord => ({
      ...placeFixture,
      id,
      names: { ancient: [id], alternate: [] },
      candidates: coordinates.map((point, index) => ({
        label: `${id} ${index}`,
        coordinates: point,
        confidence: "high" as const
      }))
    });
    const twoSiteStop: RouteStopRecord = {
      ...stopFixture,
      id: "two-site-stop",
      candidates: [
        { ...stopFixture.candidates[0], coordinates: [35.55, 31.84] },
        { ...stopFixture.candidates[0], label: "B", coordinates: [35.6, 32.1] }
      ]
    };
    const placesById = new Map([
      ["nazareth", place("nazareth", [[35.3, 32.7]])],
      ["capernaum", place("capernaum", [[35.575, 32.88]])],
      ["cana", place("cana", [[35.34, 32.75], [35.28, 32.78]])]
    ]);
    const stopsById = new Map([[twoSiteStop.id, twoSiteStop]]);
    const at = (from: RouteStopRef, to: RouteStopRef) =>
      linelessStagePillCoordinate({ from, to }, placesById, stopsById);
    const nazareth: RouteStopRef = { kind: "location", locationId: "nazareth" };
    const capernaum: RouteStopRef = { kind: "location", locationId: "capernaum" };
    const cana: RouteStopRef = { kind: "location", locationId: "cana" };
    const twoSites: RouteStopRef = { kind: "route-stop", stopId: "two-site-stop" };

    test("uses the end whose site isn't disputed, else the destination", () => {
      expect(at(cana, nazareth)).toEqual([35.3, 32.7]);
      expect(at(nazareth, cana)).toEqual([35.3, 32.7]);
      expect(at(twoSites, cana)).toEqual([35.34, 32.75]);
      expect(at(twoSites, { ...cana, candidateIndex: 1 })).toEqual([35.28, 32.78]);
      expect(at(capernaum, nazareth)).toEqual([35.3, 32.7]);
      expect(at(nazareth, nazareth)).toEqual([35.3, 32.7]);
    });

    test("falls back to the other end, or null, when a record is missing", () => {
      expect(at(nazareth, { kind: "location", locationId: "nowhere" })).toEqual([35.3, 32.7]);
      expect(at({ kind: "route-stop", stopId: "no-such-stop" }, cana)).toEqual([35.34, 32.75]);
      expect(at({ kind: "location", locationId: "nowhere" }, { kind: "route-stop", stopId: "no-such-stop" })).toBeNull();
    });
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
