import type { PlaceType } from "./types";

type LabelCollisionMarkerKind = "pin" | "candidate-pin" | "region-label" | "cluster";

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface LabelCollisionMarker {
  id: string;
  kind: LabelCollisionMarkerKind;
  x: number;
  y: number;
  selected: boolean;
  inlineLabel?: string;
  placeType?: PlaceType;
  dataOrder: number;
}

interface LabelCandidate {
  markerId: string;
  selected: boolean;
  markerKind: LabelCollisionMarkerKind;
  placeType?: PlaceType;
  dataOrder: number;
  labelBox: Box;
}

const PIN_HIT_RADIUS_PX = 22;
const PIN_LABEL_HEIGHT_PX = 16;
const PIN_LABEL_X_OFFSET_PX = 12;
const REGION_LABEL_HORIZONTAL_PADDING_PX = 8;
const REGION_LABEL_LETTER_SPACING_PX = 2;
const MIN_REGION_LABEL_WIDTH_PX = 44;
const AVERAGE_CHARACTER_WIDTH_PX = 7;

const placeTypePriority: Record<PlaceType, number> = {
  region: 0,
  city: 1,
  town: 2,
  village: 3,
  site: 4,
  "natural-feature": 5
};

function boxesOverlap(left: Box, right: Box) {
  return (
    left.left < right.right &&
    left.right > right.left &&
    left.top < right.bottom &&
    left.bottom > right.top
  );
}

function pinBoxForMarker(marker: LabelCollisionMarker): Box {
  return {
    left: marker.x - PIN_HIT_RADIUS_PX,
    right: marker.x + PIN_HIT_RADIUS_PX,
    top: marker.y - PIN_HIT_RADIUS_PX,
    bottom: marker.y + PIN_HIT_RADIUS_PX
  };
}

function estimateLabelWidth(text: string, letterSpacingPx: number) {
  const characters = text.length;
  if (characters === 0) {
    return 0;
  }

  return characters * AVERAGE_CHARACTER_WIDTH_PX + Math.max(0, characters - 1) * letterSpacingPx;
}

function labelBoxForMarker(marker: LabelCollisionMarker): Box | null {
  if (!marker.inlineLabel) {
    return null;
  }

  if (marker.kind === "region-label") {
    const estimatedWidth = estimateLabelWidth(marker.inlineLabel, REGION_LABEL_LETTER_SPACING_PX);
    const width = Math.max(
      MIN_REGION_LABEL_WIDTH_PX,
      estimatedWidth + REGION_LABEL_HORIZONTAL_PADDING_PX
    );
    return {
      left: marker.x - width / 2,
      right: marker.x + width / 2,
      top: marker.y - PIN_LABEL_HEIGHT_PX / 2,
      bottom: marker.y + PIN_LABEL_HEIGHT_PX / 2
    };
  }

  const width = estimateLabelWidth(marker.inlineLabel, 0);
  return {
    left: marker.x + PIN_LABEL_X_OFFSET_PX,
    right: marker.x + PIN_LABEL_X_OFFSET_PX + width,
    top: marker.y - PIN_LABEL_HEIGHT_PX / 2,
    bottom: marker.y + PIN_LABEL_HEIGHT_PX / 2
  };
}

function toLabelCandidate(marker: LabelCollisionMarker): LabelCandidate | null {
  const labelBox = labelBoxForMarker(marker);
  if (!labelBox) {
    return null;
  }

  return {
    markerId: marker.id,
    selected: marker.selected,
    markerKind: marker.kind,
    placeType: marker.placeType,
    dataOrder: marker.dataOrder,
    labelBox
  };
}

function labelPriority(candidate: LabelCandidate) {
  const selectedRank = candidate.selected ? 0 : 1;
  const type =
    candidate.markerKind === "region-label" ? "region" : candidate.placeType ?? "site";
  const typeRank = placeTypePriority[type];
  return {
    selectedRank,
    typeRank,
    dataOrder: candidate.dataOrder
  };
}

function compareCandidates(left: LabelCandidate, right: LabelCandidate) {
  const leftPriority = labelPriority(left);
  const rightPriority = labelPriority(right);

  if (leftPriority.selectedRank !== rightPriority.selectedRank) {
    return leftPriority.selectedRank - rightPriority.selectedRank;
  }

  if (leftPriority.typeRank !== rightPriority.typeRank) {
    return leftPriority.typeRank - rightPriority.typeRank;
  }

  if (leftPriority.dataOrder !== rightPriority.dataOrder) {
    return leftPriority.dataOrder - rightPriority.dataOrder;
  }

  return left.markerId.localeCompare(right.markerId);
}

export function resolveVisibleInlineLabelIds(markers: LabelCollisionMarker[]) {
  const pinBoxes = markers
    .filter((marker) => marker.kind !== "region-label")
    .map((marker) => ({
      markerId: marker.id,
      box: pinBoxForMarker(marker)
    }));

  const candidates = markers
    .map(toLabelCandidate)
    .filter((candidate): candidate is LabelCandidate => candidate !== null)
    .sort(compareCandidates);

  const visibleMarkerIds = new Set<string>();
  const placedLabelBoxes: Box[] = [];

  for (const candidate of candidates) {
    const overlapsPin = pinBoxes.some(
      (pinBox) =>
        pinBox.markerId !== candidate.markerId && boxesOverlap(candidate.labelBox, pinBox.box)
    );
    if (overlapsPin) {
      continue;
    }

    const overlapsPlacedLabel = placedLabelBoxes.some((box) =>
      boxesOverlap(candidate.labelBox, box)
    );
    if (overlapsPlacedLabel) {
      continue;
    }

    visibleMarkerIds.add(candidate.markerId);
    placedLabelBoxes.push(candidate.labelBox);
  }

  return visibleMarkerIds;
}
