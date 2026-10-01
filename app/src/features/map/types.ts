export type PlaceType =
  | "city"
  | "town"
  | "village"
  | "site"
  | "natural-feature"
  | "region"
  | "province"
  | "empire";

export type ZoomTier = "region" | "city" | "site";
export type Confidence = "high" | "medium" | "low" | "disputed";
export type SourceId = string;
export type PlaceProminence = "major" | "standard";

export type Coordinates = [number, number];

export interface PlaceCandidate {
  label: string;
  coordinates: Coordinates;
  confidence: Confidence;
}

export interface PlaceLocationCandidate extends PlaceCandidate {
  coordinateSource: SourceId;
  support: string;
  sources: SourceId[];
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
  prominence: PlaceProminence;
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

export interface SourcedTextEntry {
  text: string;
  sources: SourceId[];
}

export interface ScriptureEntry {
  ref: string;
  book: string;
  textWEB: string;
}

export interface OtConnectionEntry {
  ref: string;
  note: string;
  sources: SourceId[];
}

export interface PoliticalHistoryEntry {
  fromYear: number;
  toYear: number;
  entity: string;
  sources: SourceId[];
}

export interface PlaceRecord extends PlaceIndexRecord {
  candidates: PlaceLocationCandidate[];
  summary: SourcedTextEntry;
  history: SourcedTextEntry[];
  scripture: ScriptureEntry[];
  otConnections: OtConnectionEntry[];
  politicalHistory: PoliticalHistoryEntry[];
  status: "draft" | "verified";
  verifiedBy?: string;
  lastReviewed?: string;
}

export type MediaImageKind =
  | "modern"
  | "historical"
  | "site"
  | "reconstruction"
  | "ai-reconstruction";

export type CommonsMediaImageKind = Exclude<MediaImageKind, "ai-reconstruction">;

export interface MediaImageGenerator {
  tool: string;
  model: string;
  date: string;
}

interface MediaImageRecordBase {
  id: string;
  url: string;
  width?: number;
  height?: number;
  caption: string;
}

export interface CommonsMediaImageRecord extends MediaImageRecordBase {
  kind: CommonsMediaImageKind;
  aiGenerated: false;
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl: string;
  sourcePage: string;
  generator?: undefined;
  promptRef?: undefined;
  basedOn?: undefined;
}

export interface AiMediaImageRecord extends MediaImageRecordBase {
  kind: "ai-reconstruction";
  aiGenerated: true;
  width?: number;
  height?: number;
  author?: string;
  license?: string;
  licenseUrl?: string;
  sourcePage?: string;
  generator: MediaImageGenerator;
  promptRef: string;
  basedOn: SourceId[];
}

export type MediaImageRecord = CommonsMediaImageRecord | AiMediaImageRecord;

export interface MediaRecord {
  locationId: string;
  images: MediaImageRecord[];
}

export interface BibliographyEntry {
  id: string;
  type: "book" | "article" | "chapter" | "web" | "dataset";
  title: string;
  authors: string[];
  year: number;
  publisher?: string;
  journal?: string;
  containerTitle?: string;
  doi?: string;
  isbn?: string;
  url?: string;
  accessed?: string;
}

export interface PlaceDetailsPayload {
  location: PlaceRecord;
  media: MediaRecord | null;
  bibliography: BibliographyEntry[];
}
