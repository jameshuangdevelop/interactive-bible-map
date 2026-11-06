import type {
  AncientStopCataloguePayload,
  AncientStopCompactPayload
} from "../src/features/map/ancient-layer.types";
import { expandAncientStopPayloadFromCatalogue } from "../src/features/map/ancient-stop-catalogue";

describe("ancient stop catalogue expansion", () => {
  const catalogue: AncientStopCataloguePayload = {
    areas: [
      {
        areaId: "judea",
        holderId: "roman-judea",
        holderKind: "roman-province",
        holderRomanSide: true,
        holderLocationId: "judea",
        ruler: null,
        heldFromYear: 6,
        heldToYear: 41,
        heldFromKnown: true,
        note: null,
        hasShape: true
      },
      {
        areaId: "galilee",
        holderId: "herod-antipas",
        holderKind: "client-tetrarchy",
        holderRomanSide: true,
        holderLocationId: "galilee",
        ruler: "Herod Antipas",
        heldFromYear: -4,
        heldToYear: 39,
        heldFromKnown: true,
        note: null,
        hasShape: true
      }
    ],
    holderBorders: [
      {
        type: "Feature",
        properties: {
          holderAAreaId: "galilee",
          holderBAreaId: "judea",
          borderStyle: "state",
          minZoom: 5
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [35.2, 32.8],
            [35.3, 32.9]
          ]
        }
      }
    ],
    holderLabels: [
      {
        holderId: "roman-judea",
        areaId: "judea",
        name: "Roman Judea",
        labelText: "Roman Judea",
        minZoom: 5,
        kind: "roman-province",
        labelPoint: [35.1, 31.9]
      },
      {
        holderId: "herod-antipas",
        areaId: "galilee",
        name: "Herod Antipas",
        labelText: "Herod Antipas",
        minZoom: 5,
        kind: "client-tetrarchy",
        labelPoint: [35.4, 32.7]
      }
    ]
  };

  const compactStop: AncientStopCompactPayload = {
    stopId: "ad-30",
    year: 30,
    areas: [1, 0],
    holderBorders: [0],
    romanEmpireEdge: {
      type: "LineString",
      coordinates: [
        [35.0, 31.8],
        [35.6, 32.9]
      ]
    },
    holderUnions: {
      "herod-antipas": "union-1",
      "roman-judea": "union-2"
    },
    romanSideUnion: "union-3",
    holderLabels: [1]
  };

  test("expands a compact stop payload into the legacy in-memory shape", () => {
    expect(expandAncientStopPayloadFromCatalogue(compactStop, catalogue)).toEqual({
      ...compactStop,
      areas: [catalogue.areas[1], catalogue.areas[0]],
      holderBorders: {
        type: "FeatureCollection",
        features: [catalogue.holderBorders[0]]
      },
      holderLabels: [catalogue.holderLabels[1]]
    });
  });

  test("throws a clear error when a stop index is out of range", () => {
    const invalidStop = {
      ...compactStop,
      holderBorders: [1]
    };

    expect(() => expandAncientStopPayloadFromCatalogue(invalidStop, catalogue)).toThrow(
      "Stop 'ad-30' has invalid holderBorders catalogue index '1'."
    );
  });

  test("throws a clear error when a required stop or catalogue array is missing", () => {
    const missingStopArray = {
      ...compactStop,
      areas: undefined
    } as unknown as AncientStopCompactPayload;
    const missingCatalogueArray = {
      ...catalogue,
      holderLabels: undefined
    } as unknown as AncientStopCataloguePayload;

    expect(() => expandAncientStopPayloadFromCatalogue(missingStopArray, catalogue)).toThrow(
      "Stop 'ad-30' is missing 'areas' index array."
    );
    expect(() => expandAncientStopPayloadFromCatalogue(compactStop, missingCatalogueArray)).toThrow(
      "Ancient stop catalogue is missing 'holderLabels' array."
    );
  });
});
