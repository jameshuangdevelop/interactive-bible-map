import type { PlaceIndexRecord, PlaceSelection } from "./types";

export interface MapViewProps {
  places: PlaceIndexRecord[];
  selection: PlaceSelection | null;
  leftPanelWidth: number;
  onSelectPlace: (selection: PlaceSelection) => void;
}
