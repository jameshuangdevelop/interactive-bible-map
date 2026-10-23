import type {
  AncientShapesPayload,
  AncientStopPayload,
  FeatureCollection,
  LineStringGeometry,
  MultiPolygonGeometry,
  PolygonGeometry
} from "./ancient-layer.types";

export type RegionGeometry = PolygonGeometry | MultiPolygonGeometry;
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

function reverseRingWinding(ring: RingCoordinates): RingCoordinates {
  return [...ring].reverse();
}

function isRegionGeometry(
  geometry: unknown
): geometry is RegionGeometry {
  return Boolean(
    geometry &&
      typeof geometry === "object" &&
      (geometry as { type?: string }).type &&
      ((geometry as { type?: string }).type === "Polygon" ||
        (geometry as { type?: string }).type === "MultiPolygon")
  );
}

function mergeRegionParts(parts: RegionGeometry[]): RegionGeometry | null {
  if (parts.length === 0) {
    return null;
  }
  if (parts.length === 1) {
    return parts[0];
  }

  const polygons: MultiPolygonGeometry["coordinates"] = [];
  for (const geometry of parts) {
    if (geometry.type === "Polygon") {
      polygons.push(geometry.coordinates);
      continue;
    }
    polygons.push(...geometry.coordinates);
  }

  if (polygons.length === 1) {
    return {
      type: "Polygon",
      coordinates: polygons[0]
    };
  }

  return {
    type: "MultiPolygon",
    coordinates: polygons
  };
}

export function resolveSelectedRegionGeometry({
  heldRegionGeometry,
  regionOutlineGeometry,
  isSelectedRegion
}: {
  heldRegionGeometry: RegionGeometry | null;
  regionOutlineGeometry: RegionGeometry | null;
  isSelectedRegion: boolean;
}) {
  if (isRegionGeometry(heldRegionGeometry)) {
    return heldRegionGeometry;
  }
  if (isSelectedRegion && isRegionGeometry(regionOutlineGeometry)) {
    return regionOutlineGeometry;
  }
  return null;
}

export function findSelectedRegionGeometry({
  shapes,
  holderUnionGeometries,
  regionOutlineGeometry,
  stopPayload,
  placeId,
  placeType,
  politicalAreaId,
  politicalUnitAreaTypes
}: {
  shapes: AncientShapesPayload | null;
  holderUnionGeometries: Record<string, RegionGeometry> | null | undefined;
  regionOutlineGeometry?: RegionGeometry | null | undefined;
  stopPayload: AncientStopPayload | null;
  placeId: string | null | undefined;
  placeType: string | null | undefined;
  politicalAreaId: string | null | undefined;
  politicalUnitAreaTypes: ReadonlySet<string>;
}): RegionGeometry | null {
  if (!shapes || !stopPayload || !placeId) {
    return null;
  }

  const shapeByAreaId = new Map(
    shapes.areas.features
      .filter((feature) => isRegionGeometry(feature.geometry))
      .map((feature) => [feature.properties.areaId, feature.geometry] as const)
  );

  const selectedAreaIds = new Set<string>();
  if (
    placeId === "roman-empire" &&
    typeof stopPayload.romanSideUnion === "string" &&
    isRegionGeometry(holderUnionGeometries?.[stopPayload.romanSideUnion])
  ) {
    return holderUnionGeometries[stopPayload.romanSideUnion];
  }
  const holderUnionId = stopPayload.holderUnions?.[placeId];
  const holderUnion =
    typeof holderUnionId === "string" ? holderUnionGeometries?.[holderUnionId] : null;
  if (isRegionGeometry(holderUnion)) {
    return holderUnion;
  }

  if (placeId === "roman-empire") {
    for (const area of stopPayload.areas) {
      if (area.holderRomanSide && area.hasShape) {
        selectedAreaIds.add(area.areaId);
      }
    }
  } else {
    for (const area of stopPayload.areas) {
      if (area.holderLocationId === placeId && area.hasShape) {
        selectedAreaIds.add(area.areaId);
      }
    }
  }

  if (selectedAreaIds.size === 0 && politicalAreaId) {
    const shouldUseFallbackPoliticalArea =
      politicalUnitAreaTypes.has(placeType ?? "") || politicalAreaId === placeId;
    if (shouldUseFallbackPoliticalArea) {
      const fallbackArea = stopPayload.areas.find(
        (area) => area.areaId === politicalAreaId && area.hasShape
      );
      if (fallbackArea) {
        selectedAreaIds.add(fallbackArea.areaId);
      }
    }
  }

  const selectedGeometries = [...selectedAreaIds]
    .map((areaId) => shapeByAreaId.get(areaId))
    .filter((geometry): geometry is RegionGeometry => Boolean(geometry));
  if (selectedGeometries.length === 0) {
    return isRegionGeometry(regionOutlineGeometry) ? regionOutlineGeometry : null;
  }

  return mergeRegionParts(selectedGeometries);
}

function asOutlineLineFeatures(
  coordinatesCollection: number[][][]
): FeatureCollection<LineStringGeometry, { kind: "selected-region-outline" }> {
  return {
    type: "FeatureCollection",
    features: coordinatesCollection.map((coordinates, index) => ({
      type: "Feature",
      properties: {
        kind: "selected-region-outline"
      },
      id: `selected-region-outline:${index}`,
      geometry: {
        type: "LineString",
        coordinates
      }
    }))
  };
}

export function buildSelectedRegionOutlineCoordinates(
  geometry: RegionGeometry
): number[][][] {
  return [...collectOuterRings(geometry), ...collectInteriorRings(geometry)];
}

export function buildSelectedRegionOutlineFeatureCollection(
  regionGeometry: RegionGeometry | null
): FeatureCollection<LineStringGeometry, { kind: "selected-region-outline" }> {
  if (!regionGeometry) {
    return toEmptyLineFeatureCollection();
  }

  const coordinatesCollection = buildSelectedRegionOutlineCoordinates(regionGeometry);
  if (coordinatesCollection.length === 0) {
    return toEmptyLineFeatureCollection();
  }

  return asOutlineLineFeatures(coordinatesCollection);
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
  const reversedOuterRings = outerRings.map((ring) => reverseRingWinding(ring));

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
          coordinates: toPolygonCoordinates([WORLD_RING, ...reversedOuterRings])
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
