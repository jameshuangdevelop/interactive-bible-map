/** @jest-environment jsdom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

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
  scripture: [{ ref: "Acts 13:4", book: "Acts", textWEB: "So, being sent out by the Holy Spirit..." }],
  sources: ["bib:fixture-source"],
  status: "draft"
};

const selectedRoute: HydratedRoute = {
  route: {
    id: "double-stage",
    title: "Double stage route",
    fromYear: 48,
    toYear: 49,
    structure: "connected",
    summary: "Fixture summary",
    bibleText: "Fixture bible text",
    notes: ["Fixture note"],
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
};

const routesDataFixture: LoadedRoutesData = {
  index: {
    version: 1,
    routeCount: 1,
    routes: [selectedRoute.route],
    bibliography: [
      {
        id: "fixture-source",
        type: "book",
        title: "Fixture bibliography",
        authors: ["A. Writer"],
        year: 2026
      }
    ]
  },
  routes: [selectedRoute],
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
        year: 2026
      }
    ]
  ])
};

describe("routes panel stage scrolling", () => {
  test("scrolls only for map-originated stage selection", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoViewMock = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    let selectedStageIndex: number | null = null;
    const render = () =>
      root.render(
        <RoutesPanel
          hydratedRoutes={[selectedRoute]}
          onBackToAllRoutes={() => {}}
          onHighlightStage={() => {}}
          onResolveStopSelection={() => {}}
          onRetryLoad={() => {}}
          onSelectRoute={() => {}}
          onSelectStage={(index) => {
            selectedStageIndex = index;
          }}
          placesById={new Map([[placeFixture.id, placeFixture]])}
          routeStopsById={new Map([[routeStopFixture.id, routeStopFixture]])}
          routesData={routesDataFixture}
          routesLoadState="ready"
          selectedRoute={selectedRoute}
          selectedRouteBorderYear={selectedRoute.route.fromYear}
          selectedStageIndex={selectedStageIndex}
        />
      );

    try {
      await act(async () => {
        render();
      });
      await act(async () => {
        selectedStageIndex = 1;
        render();
      });
      expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);

      scrollIntoViewMock.mockClear();
      const stageTwo = container.querySelector("[data-route-stage-index='2']");
      if (!(stageTwo instanceof HTMLElement)) {
        throw new Error("Missing stage row for stage 2.");
      }
      await act(async () => {
        stageTwo.click();
      });
      await act(async () => {
        render();
      });
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView;
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});
