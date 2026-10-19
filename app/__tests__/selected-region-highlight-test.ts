import type {
  AncientShapesPayload,
  AncientStopPayload
} from "../src/features/map/ancient-layer.types";
import {
  buildSelectedRegionOutlineFeatureCollection,
  buildSelectedRegionVeilFeatureCollection,
  findSelectedRegionGeometry
} from "../src/features/map/selected-region-highlight";

describe("selected region highlight geometry", () => {
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
    expect(veil.features).toHaveLength(1);
    expect(veil.features[0].geometry.type).toBe("Polygon");
    expect(veil.features[0].geometry.coordinates).toHaveLength(2);
    expect(veil.features[0].geometry.coordinates[0][0]).toEqual([-180, -85]);
    expect(veil.features[0].geometry.coordinates[1]).toEqual(geometry.coordinates[0]);
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
        politicalAreaId: "area-galatia"
      })
    ).not.toBeNull();

    expect(
      findSelectedRegionGeometry({
        shapes,
        stopPayload: {
          ...stopPayload,
          areas: [{ ...stopPayload.areas[0], hasShape: false }]
        },
        politicalAreaId: "area-galatia"
      })
    ).toBeNull();
  });
});
