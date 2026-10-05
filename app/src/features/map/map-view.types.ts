import type { PlaceIndexRecord, PlaceSelection } from "./types";

export interface MapViewProps {
  places: PlaceIndexRecord[];
  selection: PlaceSelection | null;
  highlightedPlaceId: string | null;
  leftPanelWidth: number;
  onSelectPlace: (selection: PlaceSelection) => void;
}
