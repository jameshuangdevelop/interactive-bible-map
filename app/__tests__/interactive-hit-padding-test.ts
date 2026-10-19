import { interactiveHitPaddingForEvent } from "../src/features/map/interactive-hit-padding";

describe("interactiveHitPaddingForEvent", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  function mockAnyPointerCoarse(matches: boolean) {
    window.matchMedia = ((query: string) => ({
      matches: query === "(any-pointer: coarse)" ? matches : false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    })) as typeof window.matchMedia;
  }

  test("uses touch padding for explicit touch pointer events", () => {
    expect(interactiveHitPaddingForEvent({ pointerType: "touch" })).toBe(13);
  });

  test("keeps mouse and pen at mouse padding", () => {
    mockAnyPointerCoarse(true);
    expect(interactiveHitPaddingForEvent({ pointerType: "mouse" })).toBe(8);
    expect(interactiveHitPaddingForEvent({ pointerType: "pen" })).toBe(8);
  });

  test("treats TouchEvent-like objects as touch when pointerType is missing", () => {
    expect(interactiveHitPaddingForEvent({ touches: [] })).toBe(13);
    expect(interactiveHitPaddingForEvent({ changedTouches: [] })).toBe(13);
  });

  test("falls back to any-pointer coarse for unknown pointer types", () => {
    mockAnyPointerCoarse(true);
    expect(interactiveHitPaddingForEvent({ pointerType: "unknown" })).toBe(13);
    mockAnyPointerCoarse(false);
    expect(interactiveHitPaddingForEvent({ pointerType: "unknown" })).toBe(8);
  });
});
