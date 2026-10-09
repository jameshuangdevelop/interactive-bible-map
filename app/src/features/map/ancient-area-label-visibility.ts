import type { FeatureCollection, Point } from "geojson";

import type { AncientAreaAssignment, AncientEntityRecord } from "./ancient-layer.types";
import type { AreaFeatureProperties } from "./map-render-data";

export function linkedTimelineLocationIds(
  entities: AncientEntityRecord[] | null | undefined
): Set<string> {
  return new Set(
    (entities ?? [])
      .map((entity) => entity.locationId)
      .filter((locationId): locationId is string => typeof locationId === "string" && locationId.length > 0)
  );
}

export function activeHolderLocationIds(
  assignments: AncientAreaAssignment[] | null | undefined
): Set<string> {
  return new Set(
    (assignments ?? [])
      .map((assignment) => assignment.holderLocationId)
      .filter((locationId): locationId is string => typeof locationId === "string" && locationId.length > 0)
  );
}

export function shouldShowProvinceAreaLabelAtStop({
  placeId,
  linkedLocationIds,
  activeLocationIds
}: {
  placeId: string;
  linkedLocationIds: ReadonlySet<string>;
  activeLocationIds: ReadonlySet<string>;
}) {
  if (!linkedLocationIds.has(placeId)) {
    return true;
  }

  return activeLocationIds.has(placeId);
}

export function filterAreaLabelsForAncientStop({
  areaLabels,
  linkedLocationIds,
  activeLocationIds
}: {
  areaLabels: FeatureCollection<Point, AreaFeatureProperties>;
  linkedLocationIds: ReadonlySet<string>;
  activeLocationIds: ReadonlySet<string>;
}): FeatureCollection<Point, AreaFeatureProperties> {
  return {
    ...areaLabels,
    features: areaLabels.features.filter((feature) => {
      if (feature.properties.areaKind !== "province") {
        return true;
      }

      return shouldShowProvinceAreaLabelAtStop({
        placeId: feature.properties.placeId,
        linkedLocationIds,
        activeLocationIds
      });
    })
  };
}
