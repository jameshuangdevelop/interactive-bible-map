import type {
  AncientShapesPayload,
  AncientStopPayload
} from "../src/features/map/ancient-layer.types";
import {
  buildSelectedRegionOutlineCoordinates,
  buildSelectedRegionOutlineFeatureCollection,
  buildSelectedRegionVeilFeatureCollection,
  findSelectedRegionGeometry,
  resolveSelectedRegionGeometry
} from "../src/features/map/selected-region-highlight";

describe("selected region highlight geometry", () => {
  const politicalUnitAreaTypes = new Set(["province", "kingdom", "tetrarchy"]);

  test("builds a world veil polygon with the selected polygon as a hole", () => {
    const geometry = {
      type: "Polygon" as const,
      coordinates: [
        [
          [10, 10],
          [20, 10],
          [20, 20],
          [10, 20],
          [10, 10]
        ],
        [
          [12, 12],
          [14, 12],
          [14, 14],
          [12, 14],
          [12, 12]
        ]
      ]
    };

    const veil = buildSelectedRegionVeilFeatureCollection(geometry);
    expect(veil.features).toHaveLength(2);
    expect(veil.features[0].geometry.type).toBe("Polygon");
    expect(veil.features[0].geometry.coordinates).toHaveLength(2);
    expect(veil.features[0].geometry.coordinates[0][0]).toEqual([-180, -85]);
    expect(veil.features[0].geometry.coordinates[1]).toEqual([...geometry.coordinates[0]].reverse());
    expect(veil.features[1].geometry.type).toBe("Polygon");
    expect(veil.features[1].geometry.coordinates).toEqual([geometry.coordinates[1]]);
  });

  test("supports multipolygon regions by adding one hole per outer ring", () => {
    const geometry = {
      type: "MultiPolygon" as const,
      coordinates: [
        [
          [
            [30, 30],
            [34, 30],
            [34, 34],
            [30, 34],
            [30, 30]
          ]
        ],
        [
          [
            [40, 40],
            [44, 40],
            [44, 44],
            [40, 44],
            [40, 40]
          ]
        ]
      ]
    };

    const veil = buildSelectedRegionVeilFeatureCollection(geometry);
    expect(veil.features).toHaveLength(1);
    expect(veil.features[0].geometry.coordinates).toHaveLength(3);

    const outline = buildSelectedRegionOutlineFeatureCollection(geometry);
    expect(outline.features).toHaveLength(2);
    expect(outline.features[0].geometry.type).toBe("LineString");
    expect(outline.features[1].geometry.type).toBe("LineString");
  });

  test("includes interior rings in the selected region outline", () => {
    const geometry = {
      type: "Polygon" as const,
      coordinates: [
        [
          [10, 10],
          [20, 10],
          [20, 20],
          [10, 20],
          [10, 10]
        ],
        [
          [12, 12],
          [14, 12],
          [14, 14],
          [12, 14],
          [12, 12]
        ]
      ]
    };

    const outline = buildSelectedRegionOutlineFeatureCollection(geometry);
    expect(outline.features).toHaveLength(2);
    expect(outline.features[0].geometry.coordinates).toEqual(geometry.coordinates[0]);
    expect(outline.features[1].geometry.coordinates).toEqual(geometry.coordinates[1]);
  });

  test("returns empty veil/outline when geometry is missing", () => {
    expect(buildSelectedRegionVeilFeatureCollection(null).features).toHaveLength(0);
    expect(buildSelectedRegionOutlineFeatureCollection(null).features).toHaveLength(0);
  });

  test("finds selected-region geometry only when the stop includes a shaped political area", () => {
    const shapes: AncientShapesPayload = {
      areas: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { areaId: "area-galatia" },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [1, 1],
                  [2, 1],
                  [2, 2],
                  [1, 2],
                  [1, 1]
                ]
              ]
            }
          }
        ]
      },
      areasSimplifiedForZoom10: {
        type: "FeatureCollection",
        features: []
      }
    };
    const stopPayload: AncientStopPayload = {
      stopId: "ad-50",
      year: 50,
      areas: [
        {
          areaId: "area-galatia",
          holderId: "roman-empire",
          holderKind: "roman-province",
          holderRomanSide: true,
          holderLocationId: "galatia",
          ruler: "Claudius",
          heldFromYear: 25,
          heldToYear: 60,
          heldFromKnown: true,
          note: null,
          hasShape: true
        }
      ],
      holderBorders: {
        type: "FeatureCollection",
        features: []
      },
      romanEmpireEdge: null,
      holderUnions: {},
      romanSideUnion: null,
      holderLabels: []
    };

    expect(
      findSelectedRegionGeometry({
        shapes,
        holderUnionGeometries: null,
        stopPayload,
        placeId: "galatia",
        placeType: "province",
        politicalAreaId: "area-galatia",
        politicalUnitAreaTypes
      })
    ).not.toBeNull();

    expect(
      findSelectedRegionGeometry({
        shapes,
        holderUnionGeometries: null,
        stopPayload: {
          ...stopPayload,
          areas: [{ ...stopPayload.areas[0], hasShape: false }]
        },
        placeId: "galatia",
        placeType: "province",
        politicalAreaId: "area-galatia",
        politicalUnitAreaTypes
      })
    ).toBeNull();
  });

  test("uses precomputed holder union geometry when present", () => {
    const stopPayload: AncientStopPayload = {
      stopId: "ad-70",
      year: 70,
      areas: [
        {
          areaId: "galatia",
          holderId: "galatia-direct",
          holderKind: "roman-province",
          holderRomanSide: true,
          holderLocationId: "galatia",
          ruler: null,
          heldFromYear: 25,
          heldToYear: 101,
          heldFromKnown: true,
          note: null,
          hasShape: true
        },
        {
          areaId: "pontus",
          holderId: "galatia-direct",
          holderKind: "roman-province",
          holderRomanSide: true,
          holderLocationId: "galatia",
          ruler: null,
          heldFromYear: 64,
          heldToYear: 101,
          heldFromKnown: true,
          note: null,
          hasShape: true
        }
      ],
      holderBorders: {
        type: "FeatureCollection",
        features: []
      },
      romanEmpireEdge: null,
      holderUnions: {
        galatia: "union-galatia"
      },
      romanSideUnion: null,
      holderLabels: []
    };
    const holderUnionGeometries = {
      "union-galatia": {
        type: "Polygon" as const,
        coordinates: [
          [
            [30, 38],
            [32, 38],
            [32, 40],
            [30, 40],
            [30, 38]
          ]
        ]
      }
    };

    const selectedRegion = findSelectedRegionGeometry({
      shapes: {
        areas: { type: "FeatureCollection", features: [] },
        areasSimplifiedForZoom10: { type: "FeatureCollection", features: [] }
      },
      holderUnionGeometries,
      stopPayload,
      placeId: "galatia",
      placeType: "province",
      politicalAreaId: "galatia",
      politicalUnitAreaTypes
    });
    expect(selectedRegion).toEqual(holderUnionGeometries["union-galatia"]);
  });

  test("uses precomputed roman side union geometry when present", () => {
    const stopPayload: AncientStopPayload = {
      stopId: "ad-50",
      year: 50,
      areas: [],
      holderBorders: {
        type: "FeatureCollection",
        features: []
      },
      romanEmpireEdge: null,
      holderUnions: {},
      romanSideUnion: "union-roman-side",
      holderLabels: []
    };
    const holderUnionGeometries = {
      "union-roman-side": {
        type: "MultiPolygon" as const,
        coordinates: [
          [
            [
              [1, 1],
              [2, 1],
              [2, 2],
              [1, 2],
              [1, 1]
            ]
          ]
        ]
      }
    };

    const selectedRegion = findSelectedRegionGeometry({
      shapes: {
        areas: { type: "FeatureCollection", features: [] },
        areasSimplifiedForZoom10: { type: "FeatureCollection", features: [] }
      },
      holderUnionGeometries,
      stopPayload,
      placeId: "roman-empire",
      placeType: "empire",
      politicalAreaId: null,
      politicalUnitAreaTypes
    });
    expect(selectedRegion).toEqual(holderUnionGeometries["union-roman-side"]);
  });

  test("falls back to a region outline when no held land is present for the stop", () => {
    const regionOutlineGeometry = {
      type: "Polygon" as const,
      coordinates: [
        [
          [35.0, 32.0],
          [35.4, 32.0],
          [35.4, 32.4],
          [35.0, 32.4],
          [35.0, 32.0]
        ]
      ]
    };
    const stopPayload: AncientStopPayload = {
      stopId: "ad-50",
      year: 50,
      areas: [],
      holderBorders: {
        type: "FeatureCollection",
        features: []
      },
      romanEmpireEdge: null,
      holderUnions: {},
      romanSideUnion: null,
      holderLabels: []
    };

    const selectedRegion = findSelectedRegionGeometry({
      shapes: {
        areas: { type: "FeatureCollection", features: [] },
        areasSimplifiedForZoom10: { type: "FeatureCollection", features: [] }
      },
      holderUnionGeometries: null,
      regionOutlineGeometry,
      stopPayload,
      placeId: "samaria",
      placeType: "region",
      politicalAreaId: null,
      politicalUnitAreaTypes
    });
    expect(selectedRegion).toEqual(regionOutlineGeometry);
  });

  test("prefers held-land geometry over region-outline fallback", () => {
    const heldLandGeometry = {
      type: "Polygon" as const,
      coordinates: [
        [
          [36, 40],
          [37, 40],
          [37, 41],
          [36, 41],
          [36, 40]
        ]
      ]
    };
    const outlineFallbackGeometry = {
      type: "Polygon" as const,
      coordinates: [
        [
          [35, 39],
          [35.5, 39],
          [35.5, 39.5],
          [35, 39.5],
          [35, 39]
        ]
      ]
    };
    const stopPayload: AncientStopPayload = {
      stopId: "ad-50",
      year: 50,
      areas: [],
      holderBorders: {
        type: "FeatureCollection",
        features: []
      },
      romanEmpireEdge: null,
      holderUnions: {
        pontus: "union-pontus-kingdom"
      },
      romanSideUnion: null,
      holderLabels: []
    };
    const selectedRegion = findSelectedRegionGeometry({
      shapes: {
        areas: { type: "FeatureCollection", features: [] },
        areasSimplifiedForZoom10: { type: "FeatureCollection", features: [] }
      },
      holderUnionGeometries: {
        "union-pontus-kingdom": heldLandGeometry
      },
      regionOutlineGeometry: outlineFallbackGeometry,
      stopPayload,
      placeId: "pontus",
      placeType: "region",
      politicalAreaId: null,
      politicalUnitAreaTypes
    });
    expect(selectedRegion).toEqual(heldLandGeometry);
  });

  test("selected region precedence resolves held land, then outline, then name-only", () => {
    const heldRegionGeometry = {
      type: "Polygon" as const,
      coordinates: [
        [
          [36, 40],
          [37, 40],
          [37, 41],
          [36, 41],
          [36, 40]
        ]
      ]
    };
    const outlineGeometry = {
      type: "Polygon" as const,
      coordinates: [
        [
          [35, 39],
          [35.5, 39],
          [35.5, 39.5],
          [35, 39.5],
          [35, 39]
        ]
      ]
    };

    expect(
      resolveSelectedRegionGeometry({
        heldRegionGeometry,
        regionOutlineGeometry: outlineGeometry,
        isSelectedRegion: true
      })
    ).toEqual(heldRegionGeometry);
    expect(
      resolveSelectedRegionGeometry({
        heldRegionGeometry: null,
        regionOutlineGeometry: outlineGeometry,
        isSelectedRegion: true
      })
    ).toEqual(outlineGeometry);
    expect(
      resolveSelectedRegionGeometry({
        heldRegionGeometry: null,
        regionOutlineGeometry: outlineGeometry,
        isSelectedRegion: false
      })
    ).toBeNull();
  });
});
