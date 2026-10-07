export interface ScreenPoint {
  x: number;
  y: number;
}

export interface HitCandidate<T> {
  value: T;
  point: ScreenPoint;
}

export interface RankedHitCandidate<T> extends HitCandidate<T> {
  interactionRank: number;
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

function findNearestByRank<T>(
  pointer: ScreenPoint,
  candidates: readonly RankedHitCandidate<T>[],
  rank: number,
  tieBreaker?: (left: T, right: T) => number
) {
  return pickNearestCandidate(
    pointer,
    candidates.filter((candidate) => candidate.interactionRank === rank),
    tieBreaker
  );
}

export function pickNearestCandidateWithPreferredRank<T>(
  pointer: ScreenPoint,
  candidates: readonly RankedHitCandidate<T>[],
  {
    preferredRank,
    competingRank,
    maxPreferredDistanceDeltaPx,
    tieBreaker
  }: {
    preferredRank: number;
    competingRank: number;
    maxPreferredDistanceDeltaPx: number;
    tieBreaker?: (left: T, right: T) => number;
  }
) {
  const nearest = pickNearestCandidate(pointer, candidates, tieBreaker);
  if (!nearest) {
    return null;
  }

  const nearestCandidate = candidates.find((candidate) => candidate.value === nearest);
  if (!nearestCandidate || nearestCandidate.interactionRank !== competingRank) {
    return nearest;
  }

  const nearestPreferred = findNearestByRank(pointer, candidates, preferredRank, tieBreaker);
  if (!nearestPreferred) {
    return nearest;
  }

  const nearestPreferredCandidate = candidates.find(
    (candidate) => candidate.value === nearestPreferred
  );
  if (!nearestPreferredCandidate) {
    return nearest;
  }

  const nearestDistance = Math.sqrt(squaredDistance(pointer, nearestCandidate.point));
  const preferredDistance = Math.sqrt(
    squaredDistance(pointer, nearestPreferredCandidate.point)
  );

  if (preferredDistance <= nearestDistance + maxPreferredDistanceDeltaPx) {
    return nearestPreferred;
  }

  return nearest;
}
