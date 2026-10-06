import {
  areaLabelSpecForType,
  buildPlaceRenderData,
  candidateIconId
} from "../src/features/map/map-render-data";
import { AREA_LABEL_OFFSET_LAYOUT } from "../src/features/map/map-layer-layouts";
import type { PlaceIndexRecord } from "../src/features/map/types";

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
        zoomTier: "city",
        prominence: "major",
        passageCount: 9,
        parentId: "galilee",
        candidates: [{ label: "Sea of Galilee", coordinates: [35.59, 32.82], confidence: "high" }]
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
  });

  test("moves selected multi-candidate places out of clustered pins into candidate icons", () => {
    const renderData = buildPlaceRenderData(fixtures, {
      placeId: "emmaus",
      candidateIndex: 1
    });

    const clusteredPlaceIds = renderData.clusteredCityPins.features.map(
      (feature) => feature.properties.placeId
    );
    expect(clusteredPlaceIds).not.toContain("emmaus");

    const emmausCandidates = renderData.candidatePins.features.filter(
      (feature) => feature.properties.placeId === "emmaus"
    );
    expect(emmausCandidates).toHaveLength(2);
    expect(emmausCandidates[1].properties).toMatchObject({
      candidateIndex: 1,
      candidateLetter: "B",
      isSelectedPlace: true,
      isSelectedCandidate: true,
      minZoom: 8
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

  test("uses highlighted candidate icons for hovered multi-candidate places", () => {
    const renderData = buildPlaceRenderData(fixtures, null, "emmaus");
    const emmausCandidates = renderData.candidatePins.features.filter(
      (feature) => feature.properties.placeId === "emmaus"
    );

    expect(emmausCandidates).toHaveLength(2);
    expect(emmausCandidates[0].properties).toMatchObject({
      isSelectedCandidate: false,
      isHighlightedPlace: true,
      iconId: "candidate-c5221f-selected-a"
    });
    expect(emmausCandidates[1].properties).toMatchObject({
      isSelectedCandidate: false,
      isHighlightedPlace: true,
      iconId: "candidate-c5221f-selected-b"
    });
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
    expect(AREA_LABEL_OFFSET_LAYOUT["text-variable-anchor"]).toEqual([
      "top",
      "bottom",
      "left",
      "right"
    ]);
    expect(AREA_LABEL_OFFSET_LAYOUT["text-radial-offset"]).toBeGreaterThan(0);
  });
});
