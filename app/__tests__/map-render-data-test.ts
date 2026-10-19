import {
  areaLabelSpecForType,
  buildPlaceRenderData,
  candidateIconId,
  routePriorityPlaceIdsKeyFromOverlay
} from "../src/features/map/map-render-data";
import type { PlaceIndexRecord } from "../src/features/map/types";
import type { RouteMapOverlayData } from "../src/features/routes/map-overlay";

const fixtures: PlaceIndexRecord[] = [
  {
    id: "roman-empire",
    names: { ancient: ["Roman Empire"], alternate: [] },
    type: "empire",
    zoomTier: "region",
    prominence: "standard",
    passageCount: 0,
    parentId: null,
    candidates: [{ label: "Roman Empire", coordinates: [19.5, 40], confidence: "high" }]
  },
  {
    id: "achaia",
    names: { ancient: ["Achaia"], alternate: [] },
    type: "province",
    zoomTier: "region",
    prominence: "standard",
    passageCount: 0,
    parentId: "roman-empire",
    candidates: [{ label: "Achaia", coordinates: [22.2, 37.9], confidence: "high" }]
  },
  {
    id: "galilee",
    names: { ancient: ["Galilee"], alternate: [] },
    type: "region",
    zoomTier: "region",
    prominence: "standard",
    passageCount: 1,
    parentId: null,
    candidates: [{ label: "Galilee", coordinates: [35.3, 33], confidence: "high" }]
  },
  {
    id: "capernaum",
    names: { ancient: ["Capernaum"], modern: "Kfar Nahum", alternate: [] },
    type: "city",
    zoomTier: "city",
    prominence: "standard",
    passageCount: 21,
    parentId: "galilee",
    candidates: [{ label: "Tell Hum", coordinates: [35.575, 32.881111], confidence: "high" }]
  },
  {
    id: "emmaus",
    names: { ancient: ["Emmaus"], alternate: [] },
    type: "village",
    zoomTier: "city",
    prominence: "standard",
    passageCount: 3,
    parentId: "judea",
    candidates: [
      { label: "Emmaus A", coordinates: [34.989458, 31.8393], confidence: "disputed" },
      { label: "Emmaus B", coordinates: [35.163889, 31.793917], confidence: "low" }
    ]
  }
];

describe("map render data", () => {
  test("keeps major city-tier pins separate from standard clustered city pins", () => {
    const places: PlaceIndexRecord[] = [
      {
        id: "nazareth",
        names: { ancient: ["Nazareth"], alternate: [] },
        type: "city",
        zoomTier: "city",
        prominence: "major",
        passageCount: 37,
        parentId: "galilee",
        candidates: [{ label: "Nazareth", coordinates: [35.301, 32.699], confidence: "high" }]
      },
      {
        id: "sea-of-galilee",
        names: { ancient: ["Sea of Galilee"], alternate: [] },
        type: "natural-feature",
        naturalFeatureKind: "water",
        zoomTier: "city",
        prominence: "major",
        passageCount: 9,
        parentId: "galilee",
        candidates: [{ label: "Sea of Galilee", coordinates: [35.59, 32.82], confidence: "high" }]
      },
      {
        id: "mount-carmel",
        names: { ancient: ["Mount Carmel"], alternate: [] },
        type: "natural-feature",
        zoomTier: "city",
        prominence: "standard",
        passageCount: 3,
        parentId: "galilee",
        candidates: [{ label: "Mount Carmel", coordinates: [35.05, 32.73], confidence: "high" }]
      },
      {
        id: "troas",
        names: { ancient: ["Troas"], alternate: [] },
        type: "city",
        zoomTier: "city",
        prominence: "standard",
        passageCount: 2,
        parentId: "asia",
        candidates: [{ label: "Troas", coordinates: [26.15, 39.8], confidence: "high" }]
      }
    ];

    const renderData = buildPlaceRenderData(places, null);
    const majorIds = renderData.majorCityPins.features.map((feature) => feature.properties.placeId);
    const standardIds = renderData.clusteredCityPins.features.map(
      (feature) => feature.properties.placeId
    );
    const seaOfGalileePin = renderData.majorCityPins.features.find(
      (feature) => feature.properties.placeId === "sea-of-galilee"
    );

    expect(majorIds).toEqual(expect.arrayContaining(["nazareth", "sea-of-galilee"]));
    expect(standardIds).toContain("troas");
    expect(standardIds).not.toContain("nazareth");
    expect(standardIds).not.toContain("sea-of-galilee");
    expect(seaOfGalileePin?.properties.labelText).toBe("Sea of Galilee");
    expect(seaOfGalileePin?.properties.naturalFeatureKind).toBe("water");
    const troasPin = renderData.clusteredCityPins.features.find(
      (feature) => feature.properties.placeId === "troas"
    );
    expect(troasPin?.properties.minZoom).toBe(6);
    expect(troasPin?.properties.naturalFeatureKind).toBeUndefined();
    // A natural feature without the field is on land.
    const carmelPin = renderData.clusteredCityPins.features.find(
      (feature) => feature.properties.placeId === "mount-carmel"
    );
    expect(carmelPin?.properties.naturalFeatureKind).toBe("land");
  });

  test("builds area labels for empire, province, and region ranges", () => {
    const renderData = buildPlaceRenderData(fixtures, null);
    const byId = new Map(
      renderData.areaLabels.features.map((feature) => [feature.properties.placeId, feature.properties])
    );

    expect(byId.get("roman-empire")).toMatchObject({
      areaKind: "empire",
      areaFontSize: 15,
      minZoom: 3,
      maxZoom: 5.01
    });
    expect(byId.get("achaia")).toMatchObject({
      areaKind: "province",
      areaFontSize: 13,
      minZoom: 4,
      maxZoom: 8.01
    });
    expect(byId.get("galilee")).toMatchObject({
      areaKind: "region",
      areaFontSize: 12,
      minZoom: 6,
      maxZoom: 9.01
    });
  });

  test("delays overcrowded overview province labels until after the default overview zoom", () => {
    const renderData = buildPlaceRenderData(
      [
        {
          id: "judea-province",
          names: { ancient: ["Province of Judea"], alternate: [] },
          type: "province",
          zoomTier: "region",
          prominence: "standard",
          passageCount: 0,
          parentId: "roman-empire",
          candidates: [{ label: "Judea", coordinates: [35.22, 31.76], confidence: "high" }]
        },
        {
          id: "judea",
          names: { ancient: ["Judea"], alternate: [] },
          type: "region",
          zoomTier: "region",
          prominence: "standard",
          passageCount: 0,
          parentId: "judea-province",
          candidates: [{ label: "Judea", coordinates: [35.306389, 31.698889], confidence: "high" }]
        },
        {
          id: "italy",
          names: { ancient: ["Italy"], alternate: [] },
          type: "province",
          zoomTier: "region",
          prominence: "standard",
          passageCount: 0,
          parentId: "roman-empire",
          candidates: [{ label: "Italy", coordinates: [12.4964, 41.9028], confidence: "high" }]
        }
      ],
      null
    );

    const judeaProvinceLabel = renderData.areaLabels.features.find(
      (feature) => feature.properties.placeId === "judea-province"
    );

    expect(judeaProvinceLabel).toBeDefined();
    expect(judeaProvinceLabel?.properties.minZoom).toBe(5);

    const judeaRegionLabel = renderData.areaLabels.features.find(
      (feature) => feature.properties.placeId === "judea"
    );

    expect(judeaRegionLabel).toBeDefined();
    expect(judeaRegionLabel?.properties.minZoom).toBe(8);

    const italyRegionLabel = renderData.areaLabels.features.find(
      (feature) => feature.properties.placeId === "italy"
    );

    expect(italyRegionLabel).toBeDefined();
    expect(italyRegionLabel?.properties.minZoom).toBe(5);
  });

  test("keeps selected multi-candidate places in labels and adds candidate icons", () => {
    const renderData = buildPlaceRenderData(fixtures, {
      placeId: "emmaus",
      candidateIndex: 1
    });

    const clusteredPlaceIds = renderData.clusteredCityPins.features.map(
      (feature) => feature.properties.placeId
    );
    expect(clusteredPlaceIds).toContain("emmaus");

    const emmausCandidates = renderData.candidatePins.features.filter(
      (feature) => feature.properties.placeId === "emmaus"
    );
    expect(emmausCandidates).toHaveLength(2);
    expect(emmausCandidates[1].properties).toMatchObject({
      candidateIndex: 1,
      candidateLetter: "B",
      isSelectedPlace: true,
      isSelectedCandidate: true,
      minZoom: 6
    });
  });

  test("exports stable icon IDs and area defaults", () => {
    expect(candidateIconId("#C5221F", "A", false)).toBe("candidate-c5221f-default-a");
    expect(candidateIconId("#C5221F", "B", true)).toBe("candidate-c5221f-selected-b");
    expect(areaLabelSpecForType("city")).toEqual({
      minZoom: 6,
      maxZoom: 9.01,
      fontSize: 12
    });
  });

  test("keeps all candidates neutral when no candidate letter is selected", () => {
    const renderData = buildPlaceRenderData(fixtures, {
      placeId: "emmaus",
      candidateIndex: null
    });

    const emmausCandidates = renderData.candidatePins.features.filter(
      (feature) => feature.properties.placeId === "emmaus"
    );
    expect(emmausCandidates).toHaveLength(2);
    expect(emmausCandidates[0].properties).toMatchObject({
      isSelectedPlace: true,
      isSelectedCandidate: false,
      iconId: "candidate-c5221f-default-a"
    });
    expect(emmausCandidates[1].properties).toMatchObject({
      isSelectedPlace: true,
      isSelectedCandidate: false,
      iconId: "candidate-c5221f-default-b"
    });
  });

  test("marks highlighted pins for single-candidate places", () => {
    const renderData = buildPlaceRenderData(fixtures, null, "capernaum");
    const capernaumPin = renderData.clusteredCityPins.features.find(
      (feature) => feature.properties.placeId === "capernaum"
    );

    expect(capernaumPin).toBeDefined();
    expect(capernaumPin?.properties).toMatchObject({
      isSelectedPlace: false,
      isHighlightedPlace: true
    });
  });

  test("supports switching pin label source without changing render structure", () => {
    const renderData = buildPlaceRenderData(fixtures, null, null, {
      pinLabelSource: "modern"
    });
    const capernaumPin = renderData.clusteredCityPins.features.find(
      (feature) => feature.properties.placeId === "capernaum"
    );

    expect(capernaumPin).toBeDefined();
    expect(capernaumPin?.properties.labelText).toBe("Kfar Nahum");
  });

  test("does not render candidate icons for unselected multi-candidate places", () => {
    const renderData = buildPlaceRenderData(fixtures, null, "emmaus");
    const emmausCandidates = renderData.candidatePins.features.filter(
      (feature) => feature.properties.placeId === "emmaus"
    );

    expect(emmausCandidates).toHaveLength(0);
  });

  test("keeps an area label renderable when it shares coordinates with a city pin", () => {
    const overlapFixtures: PlaceIndexRecord[] = [
      {
        id: "syria-province",
        names: { ancient: ["Syria"], alternate: [] },
        type: "province",
        zoomTier: "region",
        prominence: "standard",
        passageCount: 0,
        parentId: "roman-empire",
        candidates: [{ label: "Syria", coordinates: [36.181667, 36.204722], confidence: "high" }]
      },
      {
        id: "antioch-syria",
        names: { ancient: ["Antioch on the Orontes"], modern: "Antakya", alternate: [] },
        type: "city",
        zoomTier: "city",
        prominence: "standard",
        passageCount: 20,
        parentId: "syria-province",
        candidates: [
          {
            label: "Antakya",
            coordinates: [36.181667, 36.204722],
            confidence: "high"
          }
        ]
      }
    ];

    const renderData = buildPlaceRenderData(overlapFixtures, null);
    const areaLabel = renderData.areaLabels.features.find(
      (feature) => feature.properties.placeId === "syria-province"
    );
    const cityPin = renderData.clusteredCityPins.features.find(
      (feature) => feature.properties.placeId === "antioch-syria"
    );

    expect(areaLabel).toBeDefined();
    expect(cityPin).toBeDefined();
    expect(areaLabel?.geometry.coordinates).toEqual(cityPin?.geometry.coordinates);
  });

  test("route priority key excludes stage-pill points and is stable across stage emphasis changes", () => {
    const overlayWithStageTwoSelected: RouteMapOverlayData = {
      lines: { type: "FeatureCollection", features: [] },
      points: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [35.0, 32.0] },
            properties: {
              id: "paul-1:stop:ephesus:0",
              routeId: "paul-1",
              stageId: "stage-2",
              stageIndex: 1,
              kind: "stop",
              stopKind: "location",
              stopId: "ephesus",
              label: "Ephesus",
              isInSelectedRoute: true,
              isSelectedStage: true,
              isHighlightedStage: false,
              isDimmed: false,
              isSelectedPlace: false
            }
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [35.1, 32.1] },
            properties: {
              id: "paul-1:stop:ephesus:1",
              routeId: "paul-1",
              stageId: "stage-3",
              stageIndex: 2,
              kind: "stop",
              stopKind: "location",
              stopId: "ephesus",
              label: "Ephesus",
              isInSelectedRoute: true,
              isSelectedStage: false,
              isHighlightedStage: false,
              isDimmed: true,
              isSelectedPlace: false
            }
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [34.8, 31.8] },
            properties: {
              id: "paul-1:stage-2:pill",
              routeId: "paul-1",
              stageId: "stage-2",
              stageIndex: 1,
              kind: "stage-pill",
              stopKind: "location",
              stopId: "stage-2",
              label: "2",
              isInSelectedRoute: true,
              isSelectedStage: true,
              isHighlightedStage: false,
              isDimmed: false,
              isSelectedPlace: false
            }
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [36.2, 37.1] },
            properties: {
              id: "paul-1:stop:antioch-syria:0",
              routeId: "paul-1",
              stageId: "stage-2",
              stageIndex: 1,
              kind: "stop",
              stopKind: "location",
              stopId: "antioch-syria",
              label: "Antioch",
              isInSelectedRoute: true,
              isSelectedStage: true,
              isHighlightedStage: false,
              isDimmed: false,
              isSelectedPlace: false
            }
          }
        ]
      },
      bounds: null,
      routeFocusKey: "paul-1",
      selectedStageFocusKey: "paul-1:stage-2",
      selectedStageCenter: [35.0, 32.0]
    };

    const overlayWithStageThreeSelected: RouteMapOverlayData = {
      ...overlayWithStageTwoSelected,
      points: {
        type: "FeatureCollection",
        features: overlayWithStageTwoSelected.points.features.map((feature) => {
          if (feature.properties.kind === "stage-pill") {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                stageId: "stage-3",
                stageIndex: 2,
                stopId: "stage-3",
                label: "3",
                isSelectedStage: true,
                isDimmed: false
              }
            };
          }
          if (feature.properties.stageId === "stage-2") {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                isSelectedStage: false,
                isDimmed: true
              }
            };
          }
          if (feature.properties.stageId === "stage-3") {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                isSelectedStage: true,
                isDimmed: false
              }
            };
          }
          return feature;
        })
      },
      selectedStageFocusKey: "paul-1:stage-3"
    };

    expect(routePriorityPlaceIdsKeyFromOverlay(overlayWithStageTwoSelected)).toBe(
      "antioch-syria\u0001ephesus"
    );
    expect(routePriorityPlaceIdsKeyFromOverlay(overlayWithStageThreeSelected)).toBe(
      "antioch-syria\u0001ephesus"
    );
  });
});
