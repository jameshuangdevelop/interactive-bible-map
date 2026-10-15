import type { PlaceIndexRecord } from "../map/types";
import type { RouteMapOverlayData } from "./map-overlay";
import { resolveRouteStop } from "./routes-data";
import type { RouteStageRecord, RouteStopRecord, RouteStopRef } from "./types";

function routeFeatureKey(routeId: string, stopRef: RouteStopRef) {
  if (stopRef.kind === "location") {
    return `${routeId}:location:${stopRef.locationId ?? ""}`;
  }

  return `${routeId}:route-stop:${stopRef.stopId ?? ""}:${stopRef.candidateIndex ?? ""}`;
}

export function buildMentionedPointFeatures({
  routeId,
  stages,
  selectedStageId,
  highlightedStageId,
  emphasizedStageId,
  selectedPlaceId,
  placesById,
  routeStopsById
}: {
  routeId: string;
  stages: RouteStageRecord[];
  selectedStageId: string | null;
  highlightedStageId: string | null;
  emphasizedStageId: string | null;
  selectedPlaceId: string | null;
  placesById: Map<string, PlaceIndexRecord>;
  routeStopsById: Map<string, RouteStopRecord>;
}) {
  const routeStopOrViaKeys = new Set<string>();
  for (const stage of stages) {
    routeStopOrViaKeys.add(routeFeatureKey(routeId, stage.from));
    routeStopOrViaKeys.add(routeFeatureKey(routeId, stage.to));
    for (const viaRef of stage.via ?? []) {
      routeStopOrViaKeys.add(routeFeatureKey(routeId, viaRef));
    }
  }

  const mentionedByKey = new Map<
    string,
    {
      key: string;
      stageIds: string[];
      firstStageId: string;
      firstStageIndex: number;
      mentioned: ReturnType<typeof resolveRouteStop>;
    }
  >();

  for (const [stageIndex, stage] of stages.entries()) {
    for (const mentionedRef of stage.mentioned ?? []) {
      const mentioned = resolveRouteStop(mentionedRef, placesById, routeStopsById);
      if (!mentioned.coordinates) {
        continue;
      }

      const key = routeFeatureKey(routeId, mentionedRef);
      if (routeStopOrViaKeys.has(key)) {
        continue;
      }
      const existing = mentionedByKey.get(key);
      if (!existing) {
        mentionedByKey.set(key, {
          key,
          stageIds: [stage.id],
          firstStageId: stage.id,
          firstStageIndex: stageIndex,
          mentioned
        });
        continue;
      }

      if (!existing.stageIds.includes(stage.id)) {
        existing.stageIds.push(stage.id);
      }
    }
  }

  return [...mentionedByKey.values()].map((value): RouteMapOverlayData["points"]["features"][number] => {
    const isSelectedStage = selectedStageId ? value.stageIds.includes(selectedStageId) : false;
    const isHighlightedStage = highlightedStageId ? value.stageIds.includes(highlightedStageId) : false;
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: value.mentioned.coordinates as [number, number] },
      properties: {
        id: `${value.key}:mentioned`,
        routeId,
        stageId: value.firstStageId,
        stageIndex: value.firstStageIndex,
        kind: "mentioned",
        stopKind: value.mentioned.kind,
        stopId: value.mentioned.id,
        label: value.mentioned.name,
        isInSelectedRoute: true,
        isSelectedStage,
        isHighlightedStage,
        isDimmed: Boolean(emphasizedStageId && !value.stageIds.includes(emphasizedStageId)),
        isSelectedPlace:
          value.mentioned.kind === "location" && value.mentioned.id === selectedPlaceId
      }
    };
  });
}
