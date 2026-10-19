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

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          kind: "selected-region-veil"
        },
        geometry: {
          type: "Polygon",
          coordinates: [WORLD_RING, ...outerRings]
        }
      }
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
  if (outerRings.length === 0) {
    return toEmptyLineFeatureCollection();
  }

  return {
    type: "FeatureCollection",
    features: outerRings.map((ring, index) => ({
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
