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
    parentId: null,
    candidates: [{ label: "Roman Empire", coordinates: [19.5, 40], confidence: "high" }]
  },
  {
    id: "achaia",
    names: { ancient: ["Achaia"], alternate: [] },
    type: "province",
    zoomTier: "region",
    parentId: "roman-empire",
    candidates: [{ label: "Achaia", coordinates: [22.2, 37.9], confidence: "high" }]
  },
  {
    id: "galilee",
    names: { ancient: ["Galilee"], alternate: [] },
    type: "region",
    zoomTier: "region",
    parentId: null,
    candidates: [{ label: "Galilee", coordinates: [35.3, 33], confidence: "high" }]
  },
  {
    id: "capernaum",
    names: { ancient: ["Capernaum"], modern: "Kfar Nahum", alternate: [] },
    type: "city",
    zoomTier: "city",
    parentId: "galilee",
    candidates: [{ label: "Tell Hum", coordinates: [35.575, 32.881111], confidence: "high" }]
  },
  {
    id: "emmaus",
    names: { ancient: ["Emmaus"], alternate: [] },
    type: "village",
    zoomTier: "city",
    parentId: "judea",
    candidates: [
      { label: "Emmaus A", coordinates: [34.989458, 31.8393], confidence: "disputed" },
      { label: "Emmaus B", coordinates: [35.163889, 31.793917], confidence: "low" }
    ]
  }
];

describe("map render data", () => {
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

  test("keeps an area label renderable when it shares coordinates with a city pin", () => {
    const overlapFixtures: PlaceIndexRecord[] = [
      {
        id: "syria-province",
        names: { ancient: ["Syria"], alternate: [] },
        type: "province",
        zoomTier: "region",
        parentId: "roman-empire",
        candidates: [{ label: "Syria", coordinates: [36.181667, 36.204722], confidence: "high" }]
      },
      {
        id: "antioch-syria",
        names: { ancient: ["Antioch on the Orontes"], modern: "Antakya", alternate: [] },
        type: "city",
        zoomTier: "city",
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
      "center",
      "top",
      "bottom",
      "left",
      "right"
    ]);
    expect(AREA_LABEL_OFFSET_LAYOUT["text-radial-offset"]).toBeGreaterThan(0);
  });
});
