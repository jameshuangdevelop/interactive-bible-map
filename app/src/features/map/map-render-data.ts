import type { Feature, FeatureCollection, Point } from "geojson";

import { CANDIDATE_PINS_MIN_ZOOM, MAX_MAP_ZOOM, PIN_COLORS } from "./constants";
import { sortPlacesByImportance } from "./place-importance";
import {
  candidateIndexToLetter,
  getPrimaryPlaceName,
  isAreaLabelType,
  isDisputedPlace
} from "./place-visibility";
import type {
  Coordinates,
  PlaceIndexRecord,
  PlaceProminence,
  PlaceSelection,
  PlaceType
} from "./types";

export const MAX_VISIBLE_PLACE_LIST_ENTRIES = 200;

const mapMaxZoomExclusive = MAX_MAP_ZOOM + 0.01;
const majorAndSelectedLabelGroupBase = 0;
const areaLabelGroupBase = 1_000_000;
const otherLabelGroupBase = 2_000_000;
const selectedLabelBoost = -1_000_000;

const AREA_FONT_SIZE_BY_TYPE = {
  empire: 15,
  province: 13,
  region: 12
} as const;

const AREA_ZOOM_RANGE_BY_TYPE = {
  empire: { minZoom: 3, maxZoom: 5.01 },
  province: { minZoom: 4, maxZoom: 8.01 },
  region: { minZoom: 6, maxZoom: 9.01 }
} as const;

const AREA_LABEL_TYPE_PRIORITY: Record<"empire" | "province" | "region", number> = {
  empire: 0,
  province: 1,
  region: 2
};

const AREA_LABEL_OVERVIEW_MIN_ZOOM_OVERRIDES: Partial<Record<string, number>> = {
  "judea-province": 5,
  judea: 8
};

const CITY_PIN_LABEL_TYPES = new Set<PlaceType>(["city", "town", "village"]);
const MAJOR_CITY_TIER_LABEL_TYPES = new Set<PlaceType>(["site", "natural-feature"]);

export interface BaseMapFeatureProperties {
  entryId: string;
  placeId: string;
  placeName: string;
  placeType: PlaceType;
  prominence: PlaceProminence;
  typeLabel: string;
  accessibleName: string;
  labelPriority: number;
  minZoom: number;
  maxZoom: number;
  importanceRank: number;
  interactionRank: number;
}

export interface PinFeatureProperties extends BaseMapFeatureProperties {
  pinColor: string;
  hasMultipleCandidates: boolean;
  isDisputed: boolean;
  isSelectedPlace: boolean;
  isHighlightedPlace: boolean;
  labelText: string | null;
}

export interface CandidateFeatureProperties extends BaseMapFeatureProperties {
  pinColor: string;
  candidateIndex: number;
  candidateLetter: string;
  candidateLabel: string;
  isSelectedPlace: boolean;
  isHighlightedPlace: boolean;
  isSelectedCandidate: boolean;
  iconId: string;
}

export interface AreaFeatureProperties extends BaseMapFeatureProperties {
  areaKind: "region" | "province" | "empire";
  areaFontSize: number;
}

export type PinFeature = Feature<Point, PinFeatureProperties>;
export type CandidateFeature = Feature<Point, CandidateFeatureProperties>;
export type AreaFeature = Feature<Point, AreaFeatureProperties>;

export interface PlaceRenderData {
  majorCityPins: FeatureCollection<Point, PinFeatureProperties>;
  clusteredCityPins: FeatureCollection<Point, PinFeatureProperties>;
  sitePins: FeatureCollection<Point, PinFeatureProperties>;
  candidatePins: FeatureCollection<Point, CandidateFeatureProperties>;
  areaLabels: FeatureCollection<Point, AreaFeatureProperties>;
}

export interface AreaLabelSpec {
  minZoom: number;
  maxZoom: number;
  fontSize: number;
}

function isPinPlace(place: PlaceIndexRecord) {
  return !isAreaLabelPlace(place);
}

function isAreaLabelPlace(place: PlaceIndexRecord) {
  return place.zoomTier === "region" || isAreaLabelType(place.type);
}

function isSiteTier(place: PlaceIndexRecord) {
  return place.zoomTier === "site";
}

function isMajorCityTierPinPlace(place: PlaceIndexRecord) {
  if (place.prominence !== "major" || place.zoomTier !== "city") {
    return false;
  }

  return (
    place.type === "city" ||
    place.type === "town" ||
    place.type === "village" ||
    place.type === "site" ||
    place.type === "natural-feature"
  );
}

function interactionRankForPlace(place: PlaceIndexRecord) {
  if (place.prominence === "major") {
    return 0;
  }

  if (isAreaLabelPlace(place)) {
    return 2;
  }

  return 1;
}

function shouldShowPinLabel(place: PlaceIndexRecord) {
  if (CITY_PIN_LABEL_TYPES.has(place.type)) {
    return true;
  }

  return place.prominence === "major" && MAJOR_CITY_TIER_LABEL_TYPES.has(place.type);
}

function getPinTierZoomRange(place: PlaceIndexRecord) {
  if (isSiteTier(place)) {
    return {
      minZoom: 12,
      maxZoom: mapMaxZoomExclusive
    };
  }

  return {
    minZoom: 4,
    maxZoom: mapMaxZoomExclusive
  };
}

function getAreaLabelSpec(place: PlaceIndexRecord): AreaLabelSpec {
  const applyOverviewMinZoomOverride = (spec: AreaLabelSpec): AreaLabelSpec => {
    const overrideMinZoom = AREA_LABEL_OVERVIEW_MIN_ZOOM_OVERRIDES[place.id];
    if (overrideMinZoom === undefined || overrideMinZoom <= spec.minZoom) {
      return spec;
    }

    return {
      ...spec,
      minZoom: overrideMinZoom
    };
  };

  if (place.type === "empire") {
    return applyOverviewMinZoomOverride({
      ...AREA_ZOOM_RANGE_BY_TYPE.empire,
      fontSize: AREA_FONT_SIZE_BY_TYPE.empire
    });
  }

  if (place.type === "province") {
    return applyOverviewMinZoomOverride({
      ...AREA_ZOOM_RANGE_BY_TYPE.province,
      fontSize: AREA_FONT_SIZE_BY_TYPE.province
    });
  }

  return applyOverviewMinZoomOverride({
    ...AREA_ZOOM_RANGE_BY_TYPE.region,
    fontSize: AREA_FONT_SIZE_BY_TYPE.region
  });
}

function placeTypeLabel(placeType: PlaceType) {
  return placeType.replace("-", " ");
}

function areaTypePriority(placeType: PlaceType) {
  if (placeType === "empire") {
    return AREA_LABEL_TYPE_PRIORITY.empire;
  }

  if (placeType === "province") {
    return AREA_LABEL_TYPE_PRIORITY.province;
  }

  return AREA_LABEL_TYPE_PRIORITY.region;
}

function toLabelPriority(
  place: PlaceIndexRecord,
  emphasized: boolean,
  importanceRank: number
) {
  if (emphasized) {
    return selectedLabelBoost + importanceRank;
  }

  if (place.prominence === "major") {
    return majorAndSelectedLabelGroupBase + importanceRank;
  }

  if (isAreaLabelPlace(place)) {
    return areaLabelGroupBase + areaTypePriority(place.type) * 100_000 + importanceRank;
  }

  return otherLabelGroupBase + importanceRank;
}

function placePinColor(place: PlaceIndexRecord) {
  return PIN_COLORS[place.type];
}

function toCoordinates(place: PlaceIndexRecord, candidateIndex: number): Coordinates {
  const candidate = place.candidates[candidateIndex];
  return [candidate.coordinates[0], candidate.coordinates[1]];
}

function toPointFeatureCoordinates(coordinates: Coordinates): Point {
  return {
    type: "Point",
    coordinates
  };
}

function toPinFeature({
  place,
  placeName,
  importanceRank,
  selected,
  highlighted,
  coordinates
}: {
  place: PlaceIndexRecord;
  placeName: string;
  importanceRank: number;
  selected: boolean;
  highlighted: boolean;
  coordinates: Coordinates;
}): PinFeature {
  const zoomRange = getPinTierZoomRange(place);
  const hasMultipleCandidates = place.candidates.length > 1;

  return {
    type: "Feature",
    id: `pin:${place.id}`,
    geometry: toPointFeatureCoordinates(coordinates),
    properties: {
      entryId: `place:${place.id}`,
      placeId: place.id,
      placeName,
      placeType: place.type,
      prominence: place.prominence,
      typeLabel: placeTypeLabel(place.type),
      accessibleName: `${placeName}, ${placeTypeLabel(place.type)}`,
      labelPriority: toLabelPriority(place, selected || highlighted, importanceRank),
      minZoom: zoomRange.minZoom,
      maxZoom: zoomRange.maxZoom,
      importanceRank,
      interactionRank: interactionRankForPlace(place),
      pinColor: placePinColor(place),
      hasMultipleCandidates,
      isDisputed: hasMultipleCandidates ? isDisputedPlace(place) : false,
      isSelectedPlace: selected,
      isHighlightedPlace: highlighted,
      labelText: shouldShowPinLabel(place) ? placeName : null
    }
  };
}

function toCandidateFeature({
  place,
  placeName,
  importanceRank,
  selection,
  highlighted,
  candidateIndex
}: {
  place: PlaceIndexRecord;
  placeName: string;
  importanceRank: number;
  selection: PlaceSelection | null;
  highlighted: boolean;
  candidateIndex: number;
}): CandidateFeature {
  const candidate = place.candidates[candidateIndex];
  const placeSelected = selection?.placeId === place.id;
  const selectedCandidate =
    placeSelected &&
    typeof selection?.candidateIndex === "number" &&
    selection.candidateIndex === candidateIndex;
  const candidateLetter = candidateIndexToLetter(candidateIndex);
  const zoomRange = getPinTierZoomRange(place);
  const candidateMinZoom = Math.max(CANDIDATE_PINS_MIN_ZOOM, zoomRange.minZoom);
  const pinColor = placePinColor(place);
  const highlightedCandidate = highlighted && !selectedCandidate;

  return {
    type: "Feature",
    id: `candidate:${place.id}:${candidateIndex}`,
    geometry: toPointFeatureCoordinates([candidate.coordinates[0], candidate.coordinates[1]]),
    properties: {
      entryId: `candidate:${place.id}:${candidateIndex}`,
      placeId: place.id,
      placeName,
      placeType: place.type,
      prominence: place.prominence,
      typeLabel: placeTypeLabel(place.type),
      accessibleName: `${placeName}, ${placeTypeLabel(place.type)}, candidate ${candidateLetter}`,
      labelPriority: toLabelPriority(place, selectedCandidate || highlighted, importanceRank),
      minZoom: candidateMinZoom,
      maxZoom: zoomRange.maxZoom,
      importanceRank,
      interactionRank: interactionRankForPlace(place),
      pinColor,
      candidateIndex,
      candidateLetter,
      candidateLabel: candidate.label,
      isSelectedPlace: placeSelected,
      isHighlightedPlace: highlighted,
      isSelectedCandidate: selectedCandidate,
      iconId: candidateIconId(pinColor, candidateLetter, selectedCandidate || highlightedCandidate)
    }
  };
}

function toAreaFeature({
  place,
  placeName,
  importanceRank,
  selected,
  coordinates
}: {
  place: PlaceIndexRecord;
  placeName: string;
  importanceRank: number;
  selected: boolean;
  coordinates: Coordinates;
}): AreaFeature {
  const labelSpec = getAreaLabelSpec(place);
  const areaKind =
    place.type === "empire" || place.type === "province" ? place.type : "region";

  return {
    type: "Feature",
    id: `area:${place.id}`,
    geometry: toPointFeatureCoordinates(coordinates),
    properties: {
      entryId: `area:${place.id}`,
      placeId: place.id,
      placeName,
      placeType: place.type,
      prominence: place.prominence,
      typeLabel: place.type === "natural-feature" ? "region" : placeTypeLabel(place.type),
      accessibleName: `${placeName}, ${place.type === "natural-feature" ? "region" : placeTypeLabel(place.type)}`,
      labelPriority: toLabelPriority(place, selected, importanceRank),
      minZoom: labelSpec.minZoom,
      maxZoom: labelSpec.maxZoom,
      importanceRank,
      interactionRank: interactionRankForPlace(place),
      areaKind,
      areaFontSize: labelSpec.fontSize
    }
  };
}

function emptyFeatureCollection<TProperties>(): FeatureCollection<Point, TProperties> {
  return {
    type: "FeatureCollection",
    features: []
  };
}

export function candidateIconId(pinColor: string, candidateLetter: string, selected: boolean) {
  return [
    "candidate",
    pinColor.replace("#", "").toLowerCase(),
    selected ? "selected" : "default",
    candidateLetter.toLowerCase()
  ].join("-");
}

export function buildPlaceRenderData(
  places: PlaceIndexRecord[],
  selection: PlaceSelection | null,
  highlightedPlaceId: string | null = null
): PlaceRenderData {
  const sortedPlaces = sortPlacesByImportance(places);

  const majorCityPins = emptyFeatureCollection<PinFeatureProperties>();
  const clusteredCityPins = emptyFeatureCollection<PinFeatureProperties>();
  const sitePins = emptyFeatureCollection<PinFeatureProperties>();
  const candidatePins = emptyFeatureCollection<CandidateFeatureProperties>();
  const areaLabels = emptyFeatureCollection<AreaFeatureProperties>();

  sortedPlaces.forEach((place, importanceRank) => {
    if (place.candidates.length === 0) {
      return;
    }

    const placeName = getPrimaryPlaceName(place);
    const selectedPlace = selection?.placeId === place.id;
    const highlightedPlace = highlightedPlaceId === place.id;

    if (isAreaLabelPlace(place)) {
      areaLabels.features.push(
        toAreaFeature({
          place,
          placeName,
          importanceRank,
          selected: selectedPlace || highlightedPlace,
          coordinates: toCoordinates(place, 0)
        })
      );
      return;
    }

    if (!isPinPlace(place)) {
      return;
    }

    if (place.candidates.length > 1) {
      place.candidates.forEach((_candidate, candidateIndex) => {
        candidatePins.features.push(
          toCandidateFeature({
            place,
            placeName,
            importanceRank,
            selection,
            highlighted: highlightedPlace,
            candidateIndex
          })
        );
      });

      if (selectedPlace) {
        return;
      }
    }

    const pinFeature = toPinFeature({
      place,
      placeName,
      importanceRank,
      selected: selectedPlace,
      highlighted: highlightedPlace,
      coordinates: toCoordinates(place, 0)
    });

    if (isSiteTier(place)) {
      sitePins.features.push(pinFeature);
      return;
    }

    if (isMajorCityTierPinPlace(place)) {
      majorCityPins.features.push(pinFeature);
      return;
    }

    clusteredCityPins.features.push(pinFeature);
  });

  return {
    majorCityPins,
    clusteredCityPins,
    sitePins,
    candidatePins,
    areaLabels
  };
}

export function areaLabelSpecForType(placeType: PlaceType): AreaLabelSpec {
  if (placeType === "empire") {
    return {
      ...AREA_ZOOM_RANGE_BY_TYPE.empire,
      fontSize: AREA_FONT_SIZE_BY_TYPE.empire
    };
  }

  if (placeType === "province") {
    return {
      ...AREA_ZOOM_RANGE_BY_TYPE.province,
      fontSize: AREA_FONT_SIZE_BY_TYPE.province
    };
  }

  return {
    ...AREA_ZOOM_RANGE_BY_TYPE.region,
    fontSize: AREA_FONT_SIZE_BY_TYPE.region
  };
}
