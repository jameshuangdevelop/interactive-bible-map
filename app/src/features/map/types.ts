export type PlaceType =
  | "city"
  | "town"
  | "village"
  | "site"
  | "natural-feature"
  | "region";

export type ZoomTier = "region" | "city" | "site";
export type Confidence = "high" | "medium" | "low" | "disputed";

export type Coordinates = [number, number];

export interface PlaceCandidate {
  label: string;
  coordinates: Coordinates;
  confidence: Confidence;
}

export interface PlaceNames {
  ancient: string[];
  modern?: string;
  alternate: string[];
}

export interface PlaceIndexRecord {
  id: string;
  names: PlaceNames;
  type: PlaceType;
  zoomTier: ZoomTier;
  parentId: string | null;
  candidates: PlaceCandidate[];
}

export interface PlaceSelection {
  placeId: string;
  candidateIndex: number | null;
}

export interface LoadedPlacesState {
  places: PlaceIndexRecord[];
  errorMessage: string | null;
}
