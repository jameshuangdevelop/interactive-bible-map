import type {
  AncientShapesPayload,
  AncientStopPayload
} from "../src/features/map/ancient-layer.types";
import {
  buildSelectedRegionOutlineCoordinates,
  buildSelectedRegionOutlineFeatureCollection,
  buildSelectedRegionVeilFeatureCollection,
  findSelectedRegionGeometry,
  findSelectedRegionOutlineGeometry,
  hasSharedRingEdge
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
      holderLabels: []
    };

    expect(
      findSelectedRegionGeometry({
        shapes,
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

  test("uses all held areas for a place and removes shared edges from its outline", () => {
    const geometry = {
      type: "MultiPolygon" as const,
      coordinates: [
        [
          [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
            [0, 0]
          ]
        ],
        [
          [
            [2, 0],
            [4, 0],
            [4, 2],
            [2, 2],
            [2, 0]
          ]
        ]
      ]
    };

    expect(hasSharedRingEdge(geometry)).toBe(true);
    const outline = buildSelectedRegionOutlineCoordinates(geometry);
    expect(
      outline.some((line) =>
        line.some(
          (coordinate, index) =>
            index < line.length - 1 &&
            ((coordinate[0] === 2 &&
              coordinate[1] === 0 &&
              line[index + 1][0] === 2 &&
              line[index + 1][1] === 2) ||
              (coordinate[0] === 2 &&
                coordinate[1] === 2 &&
                line[index + 1][0] === 2 &&
                line[index + 1][1] === 0))
        )
      )
    ).toBe(false);
  });

  test("uses roman empire edge for the selected roman empire outline", () => {
    const stopPayload: AncientStopPayload = {
      stopId: "ad-50",
      year: 50,
      areas: [],
      holderBorders: {
        type: "FeatureCollection",
        features: []
      },
      romanEmpireEdge: {
        type: "LineString",
        coordinates: [
          [1, 1],
          [2, 2]
        ]
      },
      holderLabels: []
    };

    const outlineGeometry = findSelectedRegionOutlineGeometry({
      stopPayload,
      placeId: "roman-empire"
    });
    const outline = buildSelectedRegionOutlineFeatureCollection(null, outlineGeometry);
    expect(outline.features).toHaveLength(1);
    expect(outline.features[0].geometry.coordinates).toEqual([
      [1, 1],
      [2, 2]
    ]);
  });
});
