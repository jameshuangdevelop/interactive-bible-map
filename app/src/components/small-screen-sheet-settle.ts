export type SmallScreenSheetPosition = "closed" | "half" | "full";

export interface SettleSmallScreenSheetPositionInput {
  canClose: boolean;
  currentHeightPx: number;
  dragDeltaYPx: number;
  movedPx: number;
  startPosition: SmallScreenSheetPosition;
  tapThresholdPx: number;
  velocityYPxPerMs: number;
  flickVelocityThresholdPxPerMs: number;
  halfHeightPx: number;
  fullHeightPx: number;
}

export function sheetHeightForPosition(
  position: SmallScreenSheetPosition,
  halfHeightPx: number,
  fullHeightPx: number
) {
  if (position === "full") {
    return fullHeightPx;
  }
  if (position === "half") {
    return halfHeightPx;
  }
  return 0;
}

export function settleSmallScreenSheetPosition(
  input: SettleSmallScreenSheetPositionInput
): SmallScreenSheetPosition {
  const {
    canClose,
    currentHeightPx,
    dragDeltaYPx,
    movedPx,
    startPosition,
    tapThresholdPx,
    velocityYPxPerMs,
    flickVelocityThresholdPxPerMs,
    halfHeightPx,
    fullHeightPx
  } = input;
  const allowedPositions: SmallScreenSheetPosition[] = canClose
    ? ["closed", "half", "full"]
    : ["half", "full"];

  if (movedPx <= tapThresholdPx) {
    if (startPosition === "full") {
      return "half";
    }
    return "full";
  }

  if (startPosition === "full") {
    if (velocityYPxPerMs < -flickVelocityThresholdPxPerMs || dragDeltaYPx < 0) {
      return "full";
    }
    return "half";
  }

  const nearestPosition = allowedPositions.reduce<SmallScreenSheetPosition>(
    (nearest, candidate) => {
      const nearestDistance = Math.abs(
        sheetHeightForPosition(nearest, halfHeightPx, fullHeightPx) - currentHeightPx
      );
      const candidateDistance = Math.abs(
        sheetHeightForPosition(candidate, halfHeightPx, fullHeightPx) - currentHeightPx
      );
      if (candidateDistance < nearestDistance) {
        return candidate;
      }
      return nearest;
    },
    allowedPositions[0]
  );

  if (Math.abs(velocityYPxPerMs) < flickVelocityThresholdPxPerMs) {
    return nearestPosition;
  }

  const nearestIndex = allowedPositions.indexOf(nearestPosition);
  const flickDirection = velocityYPxPerMs < 0 || dragDeltaYPx < 0 ? 1 : -1;
  const nextIndex = Math.max(
    0,
    Math.min(allowedPositions.length - 1, nearestIndex + flickDirection)
  );
  return allowedPositions[nextIndex];
}
