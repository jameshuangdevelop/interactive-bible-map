import type { PlaceIndexRecord } from "./types";

function prominenceSortBucket(place: PlaceIndexRecord) {
  return place.prominence === "major" ? 0 : 1;
}

function safePassageCount(place: PlaceIndexRecord) {
  return Number.isFinite(place.passageCount) ? place.passageCount : 0;
}

export function comparePlacesByImportance(
  left: PlaceIndexRecord,
  right: PlaceIndexRecord,
  leftDataOrder: number,
  rightDataOrder: number
) {
  const leftProminenceBucket = prominenceSortBucket(left);
  const rightProminenceBucket = prominenceSortBucket(right);
  if (leftProminenceBucket !== rightProminenceBucket) {
    return leftProminenceBucket - rightProminenceBucket;
  }

  const leftPassageCount = safePassageCount(left);
  const rightPassageCount = safePassageCount(right);
  if (leftPassageCount !== rightPassageCount) {
    return rightPassageCount - leftPassageCount;
  }

  return leftDataOrder - rightDataOrder;
}

export function sortPlacesByImportance(places: readonly PlaceIndexRecord[]) {
  const indexed = places.map((place, dataOrder) => ({
    place,
    dataOrder
  }));

  indexed.sort((left, right) =>
    comparePlacesByImportance(left.place, right.place, left.dataOrder, right.dataOrder)
  );

  return indexed.map((entry) => entry.place);
}
