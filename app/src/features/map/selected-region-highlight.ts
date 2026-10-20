import type {
  AncientShapesPayload,
  AncientStopPayload,
  FeatureCollection,
  LineStringGeometry,
  MultiLineStringGeometry,
  MultiPolygonGeometry,
  PolygonGeometry
} from "./ancient-layer.types";

type RegionGeometry = PolygonGeometry | MultiPolygonGeometry;
type RingCoordinates = number[][];
type PolygonCoordinates = PolygonGeometry["coordinates"];
type OutlineGeometry = LineStringGeometry | MultiLineStringGeometry;

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

function asCoordinateKey(coordinate: number[]) {
  return `${coordinate[0]},${coordinate[1]}`;
}

function asUnorderedEdgeKey(start: number[], end: number[]) {
  const startKey = asCoordinateKey(start);
  const endKey = asCoordinateKey(end);
  return startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`;
}

function collectEdgeCounts(rings: RingCoordinates[]) {
  const counts = new Map<string, number>();
  for (const ring of rings) {
    for (let index = 0; index < ring.length - 1; index += 1) {
      const edgeKey = asUnorderedEdgeKey(ring[index], ring[index + 1]);
      counts.set(edgeKey, (counts.get(edgeKey) ?? 0) + 1);
    }
  }
  return counts;
}

function ringToUniqueEdgeSegments(
  ring: RingCoordinates,
  edgeCounts: Map<string, number>
): RingCoordinates[] {
  const segments: RingCoordinates[] = [];
  let activeSegment: RingCoordinates = [];

  const flushActiveSegment = () => {
    if (activeSegment.length >= 2) {
      segments.push(activeSegment);
    }
    activeSegment = [];
  };

  for (let index = 0; index < ring.length - 1; index += 1) {
    const start = ring[index];
    const end = ring[index + 1];
    const edgeKey = asUnorderedEdgeKey(start, end);
    const isUniqueEdge = (edgeCounts.get(edgeKey) ?? 0) === 1;
    if (!isUniqueEdge) {
      flushActiveSegment();
      continue;
    }
    if (activeSegment.length === 0) {
      activeSegment = [start, end];
      continue;
    }
    const last = activeSegment[activeSegment.length - 1];
    if (last[0] === start[0] && last[1] === start[1]) {
      activeSegment.push(end);
      continue;
    }
    flushActiveSegment();
    activeSegment = [start, end];
  }
  flushActiveSegment();

  return segments;
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

export function findSelectedRegionGeometry({
  shapes,
  stopPayload,
  placeId,
  placeType,
  politicalAreaId,
  politicalUnitAreaTypes
}: {
  shapes: AncientShapesPayload | null;
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
    return null;
  }

  return mergeRegionParts(selectedGeometries);
}

function buildOutlineFromRingsWithoutSharedEdges(
  rings: RingCoordinates[]
): RingCoordinates[] {
  if (rings.length === 0) {
    return [];
  }
  const edgeCounts = collectEdgeCounts(rings);
  return rings.flatMap((ring) => ringToUniqueEdgeSegments(ring, edgeCounts));
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

function toLineCollectionFromGeometry(
  geometry: OutlineGeometry
): FeatureCollection<LineStringGeometry, { kind: "selected-region-outline" }> {
  if (geometry.type === "LineString") {
    return asOutlineLineFeatures([geometry.coordinates]);
  }

  return asOutlineLineFeatures(geometry.coordinates);
}

export function findSelectedRegionOutlineGeometry({
  stopPayload,
  placeId
}: {
  stopPayload: AncientStopPayload | null;
  placeId: string | null | undefined;
}): OutlineGeometry | null {
  if (!stopPayload || !placeId) {
    return null;
  }

  if (placeId !== "roman-empire") {
    return null;
  }

  return stopPayload.romanEmpireEdge ?? null;
}

export function hasSharedRingEdge(
  geometry: RegionGeometry
): boolean {
  const rings = [...collectOuterRings(geometry), ...collectInteriorRings(geometry)];
  const edgeCounts = collectEdgeCounts(rings);
  return [...edgeCounts.values()].some((count) => count > 1);
}

export function buildSelectedRegionOutlineCoordinates(
  geometry: RegionGeometry
): number[][][] {
  const allRings = [...collectOuterRings(geometry), ...collectInteriorRings(geometry)];
  return buildOutlineFromRingsWithoutSharedEdges(allRings);
}

export function buildSelectedRegionOutlineFeatureCollection(
  regionGeometry: RegionGeometry | null,
  outlineGeometryOverride: OutlineGeometry | null = null
): FeatureCollection<LineStringGeometry, { kind: "selected-region-outline" }> {
  if (outlineGeometryOverride) {
    return toLineCollectionFromGeometry(outlineGeometryOverride);
  }

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
