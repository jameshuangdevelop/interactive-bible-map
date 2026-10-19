import type { FeatureCollection, Point } from "geojson";

import type { AncientEntityRecord } from "./ancient-layer.types";
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

export function shouldShowAreaLabelOnAncientMap({
  placeId,
  linkedLocationIds,
  visibleLinkedLocationIds
}: {
  placeId: string;
  linkedLocationIds: ReadonlySet<string>;
  visibleLinkedLocationIds?: ReadonlySet<string>;
}) {
  if (visibleLinkedLocationIds?.has(placeId)) {
    return true;
  }
  return !linkedLocationIds.has(placeId);
}

export function filterAreaLabelsForAncientMap({
  areaLabels,
  linkedLocationIds,
  visibleLinkedLocationIds
}:{
  areaLabels: FeatureCollection<Point, AreaFeatureProperties>;
  linkedLocationIds: ReadonlySet<string>;
  visibleLinkedLocationIds?: ReadonlySet<string>;
}) : FeatureCollection<Point, AreaFeatureProperties> {
  return {
    ...areaLabels,
    features: areaLabels.features.filter((feature) => {
      return shouldShowAreaLabelOnAncientMap({
        placeId: feature.properties.placeId,
        linkedLocationIds,
        visibleLinkedLocationIds
      });
    })
  };
}
