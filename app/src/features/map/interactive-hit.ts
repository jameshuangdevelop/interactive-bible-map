export interface ScreenPoint {
  x: number;
  y: number;
}

export interface HitCandidate<T> {
  value: T;
  point: ScreenPoint;
}

export function squaredDistance(left: ScreenPoint, right: ScreenPoint) {
  const deltaX = left.x - right.x;
  const deltaY = left.y - right.y;
  return deltaX * deltaX + deltaY * deltaY;
}

export function pickNearestCandidate<T>(
  pointer: ScreenPoint,
  candidates: readonly HitCandidate<T>[],
  tieBreaker?: (left: T, right: T) => number
) {
  let bestCandidate: HitCandidate<T> | null = null;
  let bestDistanceSquared = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const candidateDistanceSquared = squaredDistance(pointer, candidate.point);
    if (candidateDistanceSquared < bestDistanceSquared) {
      bestCandidate = candidate;
      bestDistanceSquared = candidateDistanceSquared;
      continue;
    }

    if (
      candidateDistanceSquared === bestDistanceSquared &&
      bestCandidate &&
      typeof tieBreaker === "function" &&
      tieBreaker(candidate.value, bestCandidate.value) < 0
    ) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate?.value ?? null;
}
