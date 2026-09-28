import Supercluster from "supercluster";

import { CLUSTER_MAX_ZOOM } from "./constants";
import type { Coordinates } from "./types";
import type { VisiblePlaceEntry, VisiblePinEntry } from "./place-visibility";

interface ClusterPointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: Coordinates;
  };
  properties: {
    entryId: string;
  };
}

interface ClusterResultFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: Coordinates;
  };
  properties: {
    cluster?: boolean;
    cluster_id?: number;
    point_count?: number;
    entryId?: string;
  };
}

export interface ClusterEntry {
  id: string;
  kind: "cluster";
  coordinates: Coordinates;
  count: number;
  expansionZoom: number;
  accessibleName: string;
}

export type RenderableMapEntry = VisiblePlaceEntry | ClusterEntry;

function isPinCandidate(entry: VisiblePlaceEntry): entry is VisiblePinEntry {
  return entry.kind === "pin" && !entry.selected;
}

export function clusterVisibleEntries(
  entries: VisiblePlaceEntry[],
  zoom: number
): RenderableMapEntry[] {
  if (zoom > CLUSTER_MAX_ZOOM) {
    return entries;
  }

  const clusterCandidates = entries.filter(isPinCandidate);
  if (clusterCandidates.length < 2) {
    return entries;
  }

  const passthroughEntries = entries.filter((entry) => !isPinCandidate(entry));
  const entryById = new Map(clusterCandidates.map((entry) => [entry.id, entry]));

  const points: ClusterPointFeature[] = clusterCandidates.map((entry) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: entry.coordinates
    },
    properties: {
      entryId: entry.id
    }
  }));

  const supercluster = new Supercluster({
    radius: 48,
    maxZoom: CLUSTER_MAX_ZOOM,
    minPoints: 2
  });

  supercluster.load(points);

  const clusteredResults = supercluster.getClusters(
    [-180, -85, 180, 85],
    Math.floor(zoom)
  ) as ClusterResultFeature[];

  const resolvedEntries: RenderableMapEntry[] = [];

  for (const feature of clusteredResults) {
    const clusterId = feature.properties.cluster_id;
    const pointCount = feature.properties.point_count ?? 0;

    if (feature.properties.cluster && typeof clusterId === "number" && pointCount > 1) {
      resolvedEntries.push({
        id: `cluster-${clusterId}`,
        kind: "cluster",
        coordinates: feature.geometry.coordinates,
        count: pointCount,
        expansionZoom: supercluster.getClusterExpansionZoom(clusterId),
        accessibleName: `${pointCount} places`
      });
      continue;
    }

    if (!feature.properties.entryId) {
      continue;
    }

    const sourceEntry = entryById.get(feature.properties.entryId);
    if (sourceEntry) {
      resolvedEntries.push(sourceEntry);
    }
  }

  return [...passthroughEntries, ...resolvedEntries];
}
