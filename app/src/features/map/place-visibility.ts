import type { PinLabelSource, PlaceIndexRecord, PlaceType, ZoomTier } from "./types";

export function getPrimaryPlaceName(
  place: PlaceIndexRecord,
  labelSource: PinLabelSource = "biblical"
) {
  if (labelSource === "modern") {
    return place.names.modern ?? place.names.ancient[0] ?? place.id;
  }

  return place.names.ancient[0] ?? place.names.modern ?? place.id;
}

export function isDisputedPlace(place: PlaceIndexRecord) {
  return place.candidates.some((candidate) => candidate.confidence === "disputed");
}

export function isAreaLabelType(placeType: PlaceType) {
  return placeType === "region" || placeType === "province" || placeType === "empire";
}

export function isZoomTierVisible(zoomTier: ZoomTier, zoom: number) {
  if (zoomTier === "region") {
    return zoom >= 4 && zoom <= 9;
  }

  if (zoomTier === "site") {
    return zoom >= 12;
  }

  return zoom >= 4;
}

export function candidateIndexToLetter(candidateIndex: number) {
  return String.fromCharCode("A".charCodeAt(0) + candidateIndex);
}

export function getSelectionZoomTarget(place: PlaceIndexRecord) {
  if (place.type === "empire") {
    return 4;
  }

  if (place.type === "province" || place.zoomTier === "region") {
    return 7;
  }

  if (place.zoomTier === "site") {
    return 14;
  }

  return 11;
}
