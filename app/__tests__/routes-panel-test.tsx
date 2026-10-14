import { renderToStaticMarkup } from "react-dom/server";

import { RoutesPanel } from "../src/features/routes/routes-panel.web";
import type { PlaceIndexRecord } from "../src/features/map/types";
import type { HydratedRoute, LoadedRoutesData, RouteStopRecord } from "../src/features/routes/types";

const placeFixture: PlaceIndexRecord = {
  id: "capernaum",
  names: {
    ancient: ["Capernaum"],
    alternate: []
  },
  type: "city",
  zoomTier: "city",
  parentId: null,
  prominence: "major",
  passageCount: 3,
  candidates: [
    {
      label: "Tell Hum",
      coordinates: [35.575, 32.88],
      confidence: "high"
    }
  ]
};

const routeStopFixture: RouteStopRecord = {
  id: "fixture-stop",
  name: "Fixture stop",
  todayName: "Samandağ",
  candidates: [
    {
      label: "Candidate A",
      coordinates: [35.968, 36.119],
      coordinateSource: "wikidata:Q2207807",
      confidence: "high",
      support: "Fixture support",
      sources: ["wikidata:Q2207807"]
    }
  ],
  scripture: [],
  sources: ["bib:fixture-source"],
  status: "draft"
};

const routeEntries: HydratedRoute[] = [
  {
    route: {
      id: "single-stage",
      title: "Single stage route",
      fromYear: 46,
      toYear: 47,
      yearNote: null,
      structure: "connected",
      note: "Fixture note",
      stageCount: 1,
      sources: ["bib:fixture-source"]
    },
    stages: [
      {
        id: "single-stage-01",
        from: { kind: "location", locationId: "capernaum" },
        to: { kind: "route-stop", stopId: "fixture-stop" },
        scripture: [
          {
            ref: "Acts 2:1",
            book: "Acts",
            textWEB:
              "Now when the day of Pentecost had come, they were all with one accord in one place."
          }
        ],
        travelMode: "land",
        lineId: "single-stage-01",
        sources: ["bib:fixture-source"]
      }
    ]
  },
  {
    route: {
      id: "double-stage",
      title: "Double stage route",
      fromYear: 48,
      toYear: 49,
      yearNote: null,
      structure: "connected",
      note: "Fixture note",
      stageCount: 2,
      sources: ["bib:fixture-source"]
    },
    stages: [
      {
        id: "double-stage-01",
        from: { kind: "location", locationId: "capernaum" },
        to: { kind: "route-stop", stopId: "fixture-stop" },
        scripture: [],
        travelMode: "land",
        sources: ["bib:fixture-source"]
      },
      {
        id: "double-stage-02",
        from: { kind: "route-stop", stopId: "fixture-stop" },
        to: { kind: "location", locationId: "capernaum" },
        scripture: [],
        travelMode: "sea",
        sources: ["bib:fixture-source"]
      }
    ]
  }
];

const routesDataFixture: LoadedRoutesData = {
  index: {
    version: 1,
    routeCount: routeEntries.length,
    routes: routeEntries.map((entry) => entry.route)
  },
  routes: routeEntries,
  stops: {
    version: 1,
    stops: [routeStopFixture]
  },
  lines: {
    type: "FeatureCollection",
    features: []
  },
  bibliographyById: new Map([
    [
      "fixture-source",
      {
        id: "fixture-source",
        type: "book",
        title: "Fixture bibliography",
        authors: ["A. Writer"],
        year: 2026,
        url: "https://example.test/fixture-source"
      }
    ]
  ])
};

const defaultProps = {
  routesLoadState: "ready" as const,
  routesData: routesDataFixture,
  hydratedRoutes: routeEntries,
  selectedRoute: null,
  selectedStageIndex: null,
  selectedRouteStop: null,
  placesById: new Map([[placeFixture.id, placeFixture]]),
  routeStopsById: new Map([[routeStopFixture.id, routeStopFixture]]),
  onRetryLoad: () => {},
  onSelectRoute: () => {},
  onSelectStage: () => {},
  onBackToAllRoutes: () => {},
  onHoverRoute: () => {},
  onClearRouteHover: () => {},
  onRouteStopCardBack: () => {},
  onResolveStopSelection: () => {},
  onHighlightStage: () => {}
};

describe("routes panel", () => {
  test("uses singular and plural stage labels in the route list", () => {
    const markup = renderToStaticMarkup(<RoutesPanel {...defaultProps} />);
    expect(markup).toContain("1 stage");
    expect(markup).toContain("2 stages");
    expect(markup).not.toContain("1 stages");
  });

  test("shows stage-level and route-level sources when a route is selected", () => {
    const markup = renderToStaticMarkup(
      <RoutesPanel {...defaultProps} selectedRoute={routeEntries[0]} />
    );
    const sourcesHeadingsCount = markup.match(/>Sources</gu)?.length ?? 0;
    expect(sourcesHeadingsCount).toBeGreaterThanOrEqual(2);
    expect(markup).toContain("Fixture bibliography");
  });
});
