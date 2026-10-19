import {
  computeCompactAttributionBottomOffsetLimit,
  computeTimelineSourcesPopoverMaxHeight
} from "../src/features/map/overlay-layout";

describe("map overlay layout helpers", () => {
  test("caps timeline Sources popover height to preserve room for top controls and attribution", () => {
    const maxHeight = computeTimelineSourcesPopoverMaxHeight({
      viewportHeight: 640,
      timelineCardHeight: 520,
      sourcesPopoverHeight: 340,
      topControlsSafeBottomInset: 128,
      attributionReservedHeight: 180,
      timelineCardBottomOffset: 16,
      minPopoverHeight: 120,
      verticalGap: 8
    });

    expect(maxHeight).toBe(128);
  });

  test("enforces a minimum Sources popover height on very small viewports", () => {
    const maxHeight = computeTimelineSourcesPopoverMaxHeight({
      viewportHeight: 640,
      timelineCardHeight: 580,
      sourcesPopoverHeight: 420,
      topControlsSafeBottomInset: 128,
      attributionReservedHeight: 220,
      timelineCardBottomOffset: 16,
      minPopoverHeight: 120,
      verticalGap: 8
    });

    expect(maxHeight).toBe(120);
  });

  test("caps compact attribution before it reaches top controls", () => {
    expect(
      computeCompactAttributionBottomOffsetLimit({
        viewportHeight: 844,
        topControlsSafeBottomInset: 128,
        expandedControlReserveHeight: 180
      })
    ).toBe(536);
  });
});
