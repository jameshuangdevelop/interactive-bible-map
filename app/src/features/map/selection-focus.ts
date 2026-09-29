import { getSelectionZoomTarget } from "./place-visibility";
import type { Coordinates, PlaceIndexRecord, PlaceSelection } from "./types";

export type SelectionFocusPlan =
  | {
      kind: "center";
      coordinates: Coordinates;
      zoom: number;
    }
  | {
      kind: "fit-bounds";
      coordinates: Coordinates[];
      zoom: number;
    };

export function planSelectionFocus(
  place: PlaceIndexRecord,
  selection: PlaceSelection
): SelectionFocusPlan | null {
  const selectionZoom = getSelectionZoomTarget(place);
  if (place.candidates.length === 0) {
    return null;
  }

  if (
    selection.candidateIndex !== null &&
    selection.candidateIndex >= 0 &&
    selection.candidateIndex < place.candidates.length
  ) {
    return {
      kind: "center",
      coordinates: place.candidates[selection.candidateIndex].coordinates,
      zoom: selectionZoom
    };
  }

  if (place.candidates.length > 1) {
    return {
      kind: "fit-bounds",
      coordinates: place.candidates.map((candidate) => candidate.coordinates),
      zoom: selectionZoom
    };
  }

  return {
    kind: "center",
    coordinates: place.candidates[0].coordinates,
    zoom: selectionZoom
  };
}
