const POINTER_HIT_PADDING_PX = 8;
const TOUCH_HIT_PADDING_PX = 13;

function looksLikeTouchEvent(event: unknown) {
  if (!event || typeof event !== "object") {
    return false;
  }

  const maybeTouchEvent = event as {
    touches?: unknown;
    changedTouches?: unknown;
  };

  const hasTouchList =
    ("touches" in maybeTouchEvent && maybeTouchEvent.touches !== undefined) ||
    ("changedTouches" in maybeTouchEvent && maybeTouchEvent.changedTouches !== undefined);
  if (hasTouchList) {
    return true;
  }

  if (typeof TouchEvent !== "undefined") {
    return event instanceof TouchEvent;
  }

  return false;
}

/** Taps get a wider hit area so a name's touch target remains at least 44 px tall. */
export function interactiveHitPaddingForEvent(originalEvent: unknown) {
  const pointerType =
    typeof originalEvent === "object" && originalEvent !== null && "pointerType" in originalEvent
      ? String((originalEvent as { pointerType: unknown }).pointerType)
      : "";
  if (pointerType === "touch") {
    return TOUCH_HIT_PADDING_PX;
  }
  if (pointerType === "mouse" || pointerType === "pen") {
    return POINTER_HIT_PADDING_PX;
  }
  if (looksLikeTouchEvent(originalEvent)) {
    return TOUCH_HIT_PADDING_PX;
  }
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(any-pointer: coarse)").matches
      ? TOUCH_HIT_PADDING_PX
      : POINTER_HIT_PADDING_PX;
  }
  return POINTER_HIT_PADDING_PX;
}
