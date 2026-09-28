import { CANDIDATE_PINS_MIN_ZOOM } from "./constants";
import type { Coordinates, PlaceIndexRecord, PlaceSelection, ZoomTier } from "./types";

export type VisibleEntryKind = "pin" | "candidate-pin" | "region-label";

interface VisibleEntryBase {
  id: string;
  kind: VisibleEntryKind;
  placeId: string;
  placeName: string;
  coordinates: Coordinates;
  selected: boolean;
  accessibleName: string;
}

export interface VisiblePinEntry extends VisibleEntryBase {
  kind: "pin";
  showQuestionBadge: boolean;
}

export interface VisibleCandidateEntry extends VisibleEntryBase {
  kind: "candidate-pin";
  candidateIndex: number;
  candidateLetter: string;
  candidateLabel: string;
}

export interface VisibleRegionLabelEntry extends VisibleEntryBase {
  kind: "region-label";
}

export type VisiblePlaceEntry =
  | VisiblePinEntry
  | VisibleCandidateEntry
  | VisibleRegionLabelEntry;

export function getPrimaryPlaceName(place: PlaceIndexRecord) {
  return place.names.ancient[0] ?? place.names.modern ?? place.id;
}

export function isDisputedPlace(place: PlaceIndexRecord) {
  return place.candidates.some((candidate) => candidate.confidence === "disputed");
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

export function shouldExpandCandidatePins(
  place: PlaceIndexRecord,
  zoom: number,
  selection: PlaceSelection | null
) {
  if (place.candidates.length < 2) {
    return false;
  }

  if (zoom >= CANDIDATE_PINS_MIN_ZOOM) {
    return true;
  }

  return selection?.placeId === place.id;
}

export function candidateIndexToLetter(candidateIndex: number) {
  return String.fromCharCode("A".charCodeAt(0) + candidateIndex);
}

function normalizeTypeLabel(place: PlaceIndexRecord, kind: VisibleEntryKind) {
  if (kind === "region-label") {
    return "region";
  }

  return place.type.replace("-", " ");
}

function isSelectedCandidate(place: PlaceIndexRecord, selection: PlaceSelection | null, index: number) {
  if (selection?.placeId !== place.id) {
    return false;
  }

  if (selection.candidateIndex === null) {
    return index === 0;
  }

  return selection.candidateIndex === index;
}

export function getSelectionZoomTarget(place: PlaceIndexRecord) {
  if (place.zoomTier === "region") {
    return 7;
  }

  if (place.zoomTier === "site") {
    return 15;
  }

  return 11;
}

export function buildVisiblePlaceEntries(
  places: PlaceIndexRecord[],
  zoom: number,
  selection: PlaceSelection | null
): VisiblePlaceEntry[] {
  const entries: VisiblePlaceEntry[] = [];

  for (const place of places) {
    if (!isZoomTierVisible(place.zoomTier, zoom) || place.candidates.length === 0) {
      continue;
    }

    const placeName = getPrimaryPlaceName(place);
    const selectedPlace = selection?.placeId === place.id;

    if (place.zoomTier === "region") {
      entries.push({
        id: `${place.id}-region-label`,
        kind: "region-label",
        placeId: place.id,
        placeName,
        coordinates: place.candidates[0].coordinates,
        selected: selectedPlace,
        accessibleName: `${placeName}, ${normalizeTypeLabel(place, "region-label")}`
      });
      continue;
    }

    if (shouldExpandCandidatePins(place, zoom, selection)) {
      place.candidates.forEach((candidate, index) => {
        const candidateLetter = candidateIndexToLetter(index);
        entries.push({
          id: `${place.id}-candidate-${candidateLetter.toLowerCase()}`,
          kind: "candidate-pin",
          placeId: place.id,
          placeName,
          candidateIndex: index,
          candidateLetter,
          candidateLabel: candidate.label,
          coordinates: candidate.coordinates,
          selected: isSelectedCandidate(place, selection, index),
          accessibleName: `${placeName}, ${normalizeTypeLabel(place, "candidate-pin")}, candidate ${candidateLetter}`
        });
      });
      continue;
    }

    const disputed = isDisputedPlace(place);
    entries.push({
      id: `${place.id}-pin`,
      kind: "pin",
      placeId: place.id,
      placeName,
      coordinates: place.candidates[0].coordinates,
      selected: selectedPlace,
      showQuestionBadge: place.candidates.length > 1 && disputed,
      accessibleName: `${placeName}, ${normalizeTypeLabel(place, "pin")}`
    });
  }

  return entries;
}
