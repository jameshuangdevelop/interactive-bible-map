import type {
  AncientShapesPayload,
  AncientStopPayload,
  FeatureCollection,
  LineStringGeometry,
  MultiPolygonGeometry,
  PolygonGeometry
} from "./ancient-layer.types";

type RegionGeometry = PolygonGeometry | MultiPolygonGeometry;
type RingCoordinates = number[][];
type PolygonCoordinates = PolygonGeometry["coordinates"];

const WORLD_RING: [number, number][] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85]
];

function toEmptyPolygonFeatureCollection<TProperties>(): FeatureCollection<PolygonGeometry, TProperties> {
  return {
    type: "FeatureCollection",
    features: []
  };
}

function toEmptyLineFeatureCollection<TProperties>(): FeatureCollection<LineStringGeometry, TProperties> {
  return {
    type: "FeatureCollection",
    features: []
  };
}

function collectOuterRings(geometry: RegionGeometry): RingCoordinates[] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.length > 0 ? [geometry.coordinates[0]] : [];
  }

  return geometry.coordinates
    .map((polygon) => polygon[0])
    .filter((ring): ring is RingCoordinates => Array.isArray(ring) && ring.length > 0);
}

function collectInteriorRings(geometry: RegionGeometry): RingCoordinates[] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.slice(1);
  }

  return geometry.coordinates
    .flatMap((polygon) => polygon.slice(1))
    .filter((ring): ring is RingCoordinates => Array.isArray(ring) && ring.length > 0);
}

function toPolygonCoordinates(rings: RingCoordinates[]): PolygonCoordinates {
  return rings as unknown as PolygonCoordinates;
}

export function findSelectedRegionGeometry({
  shapes,
  stopPayload,
  politicalAreaId
}: {
  shapes: AncientShapesPayload | null;
  stopPayload: AncientStopPayload | null;
  politicalAreaId: string | null | undefined;
}): RegionGeometry | null {
  if (!shapes || !stopPayload || !politicalAreaId) {
    return null;
  }

  const stopArea = stopPayload.areas.find((area) => area.areaId === politicalAreaId);
  if (!stopArea || !stopArea.hasShape) {
    return null;
  }

  const shapeFeature = shapes.areas.features.find(
    (feature) => feature.properties.areaId === politicalAreaId
  );
  if (!shapeFeature) {
    return null;
  }

  if (shapeFeature.geometry.type !== "Polygon" && shapeFeature.geometry.type !== "MultiPolygon") {
    return null;
  }

  return shapeFeature.geometry;
}

export function buildSelectedRegionVeilFeatureCollection(
  regionGeometry: RegionGeometry | null
): FeatureCollection<PolygonGeometry, { kind: "selected-region-veil" }> {
  if (!regionGeometry) {
    return toEmptyPolygonFeatureCollection();
  }

  const outerRings = collectOuterRings(regionGeometry);
  if (outerRings.length === 0) {
    return toEmptyPolygonFeatureCollection();
  }
  const interiorRings = collectInteriorRings(regionGeometry);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          kind: "selected-region-veil" as const
        },
        geometry: {
          type: "Polygon",
          coordinates: toPolygonCoordinates([WORLD_RING, ...outerRings])
        }
      },
      ...interiorRings.map((ring, index) => ({
        type: "Feature" as const,
        id: `selected-region-veil-hole:${index}`,
        properties: {
          kind: "selected-region-veil" as const
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: toPolygonCoordinates([ring])
        }
      }))
    ]
  };
}

export function buildSelectedRegionOutlineFeatureCollection(
  regionGeometry: RegionGeometry | null
): FeatureCollection<LineStringGeometry, { kind: "selected-region-outline" }> {
  if (!regionGeometry) {
    return toEmptyLineFeatureCollection();
  }

  const outerRings = collectOuterRings(regionGeometry);
  const interiorRings = collectInteriorRings(regionGeometry);
  const allRings = [...outerRings, ...interiorRings];
  if (allRings.length === 0) {
    return toEmptyLineFeatureCollection();
  }

  return {
    type: "FeatureCollection",
    features: allRings.map((ring, index) => ({
      type: "Feature",
      properties: {
        kind: "selected-region-outline"
      },
      id: `selected-region-outline:${index}`,
      geometry: {
        type: "LineString",
        coordinates: ring
      }
    }))
  };
}

export function toRegionGeometry(
  coordinates: number[][][] | number[][][][]
): RegionGeometry {
  if (Array.isArray(coordinates[0]?.[0]?.[0])) {
    return {
      type: "MultiPolygon",
      coordinates: coordinates as MultiPolygonGeometry["coordinates"]
    };
  }

  return {
    type: "Polygon",
    coordinates: coordinates as PolygonGeometry["coordinates"]
  };
}
