import type { Feature, FeatureCollection, Point } from "geojson";

import { CANDIDATE_PINS_MIN_ZOOM, MAX_MAP_ZOOM, PIN_COLORS } from "./constants";
import {
  candidateIndexToLetter,
  getPrimaryPlaceName,
  isAreaLabelType,
  isDisputedPlace
} from "./place-visibility";
import type { Coordinates, PlaceIndexRecord, PlaceSelection, PlaceType } from "./types";

export const MAX_VISIBLE_PLACE_LIST_ENTRIES = 200;

const mapMaxZoomExclusive = MAX_MAP_ZOOM + 0.01;

const labelPriorityByType: Record<PlaceType, number> = {
  empire: 0,
  province: 1,
  region: 2,
  city: 3,
  town: 4,
  village: 5,
  site: 6,
  "natural-feature": 7
};

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

const CITY_PIN_LABEL_TYPES = new Set<PlaceType>(["city", "town", "village"]);

export interface BaseMapFeatureProperties {
  entryId: string;
  placeId: string;
  placeName: string;
  placeType: PlaceType;
  typeLabel: string;
  accessibleName: string;
  labelPriority: number;
  minZoom: number;
  maxZoom: number;
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
  if (place.type === "empire") {
    return {
      ...AREA_ZOOM_RANGE_BY_TYPE.empire,
      fontSize: AREA_FONT_SIZE_BY_TYPE.empire
    };
  }

  if (place.type === "province") {
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

function placeTypeLabel(placeType: PlaceType) {
  return placeType.replace("-", " ");
}

function toLabelPriority(place: PlaceIndexRecord, emphasized: boolean, dataOrder: number) {
  const basePriority = labelPriorityByType[place.type] * 10_000 + dataOrder;
  if (emphasized) {
    return -1_000_000 + basePriority;
  }

  return basePriority;
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
  dataOrder,
  selected,
  highlighted,
  coordinates
}: {
  place: PlaceIndexRecord;
  placeName: string;
  dataOrder: number;
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
      typeLabel: placeTypeLabel(place.type),
      accessibleName: `${placeName}, ${placeTypeLabel(place.type)}`,
      labelPriority: toLabelPriority(place, selected || highlighted, dataOrder),
      minZoom: zoomRange.minZoom,
      maxZoom: zoomRange.maxZoom,
      pinColor: placePinColor(place),
      hasMultipleCandidates,
      isDisputed: hasMultipleCandidates ? isDisputedPlace(place) : false,
      isSelectedPlace: selected,
      isHighlightedPlace: highlighted,
      labelText: CITY_PIN_LABEL_TYPES.has(place.type) ? placeName : null
    }
  };
}

function toCandidateFeature({
  place,
  placeName,
  dataOrder,
  selection,
  highlighted,
  candidateIndex
}: {
  place: PlaceIndexRecord;
  placeName: string;
  dataOrder: number;
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
      typeLabel: placeTypeLabel(place.type),
      accessibleName: `${placeName}, ${placeTypeLabel(place.type)}, candidate ${candidateLetter}`,
      labelPriority: toLabelPriority(place, selectedCandidate || highlighted, dataOrder),
      minZoom: candidateMinZoom,
      maxZoom: zoomRange.maxZoom,
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
  dataOrder,
  selected,
  coordinates
}: {
  place: PlaceIndexRecord;
  placeName: string;
  dataOrder: number;
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
      typeLabel: place.type === "natural-feature" ? "region" : placeTypeLabel(place.type),
      accessibleName: `${placeName}, ${place.type === "natural-feature" ? "region" : placeTypeLabel(place.type)}`,
      labelPriority: toLabelPriority(place, selected, dataOrder),
      minZoom: labelSpec.minZoom,
      maxZoom: labelSpec.maxZoom,
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
  const clusteredCityPins = emptyFeatureCollection<PinFeatureProperties>();
  const sitePins = emptyFeatureCollection<PinFeatureProperties>();
  const candidatePins = emptyFeatureCollection<CandidateFeatureProperties>();
  const areaLabels = emptyFeatureCollection<AreaFeatureProperties>();

  places.forEach((place, dataOrder) => {
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
          dataOrder,
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
            dataOrder,
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
      dataOrder,
      selected: selectedPlace,
      highlighted: highlightedPlace,
      coordinates: toCoordinates(place, 0)
    });

    if (isSiteTier(place)) {
      sitePins.features.push(pinFeature);
      return;
    }

    clusteredCityPins.features.push(pinFeature);
  });

  return {
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
