interface TimelineSourcesPopoverHeightOptions {
  viewportHeight: number;
  timelineCardHeight: number;
  sourcesPopoverHeight: number;
  topControlsSafeBottomInset: number;
  attributionReservedHeight: number;
  timelineCardBottomOffset: number;
  minPopoverHeight: number;
  verticalGap: number;
}

interface CompactAttributionOffsetOptions {
  viewportHeight: number;
  topControlsSafeBottomInset: number;
  expandedControlReserveHeight: number;
}

export function computeTimelineSourcesPopoverMaxHeight(options: TimelineSourcesPopoverHeightOptions) {
  const chromeHeight = Math.max(0, options.timelineCardHeight - options.sourcesPopoverHeight);
  const maxCardHeight =
    options.viewportHeight -
    options.topControlsSafeBottomInset -
    options.attributionReservedHeight -
    options.timelineCardBottomOffset -
    options.verticalGap;
  const availableForPopover = Math.floor(maxCardHeight - chromeHeight);
  return Math.max(options.minPopoverHeight, availableForPopover);
}

export function computeCompactAttributionBottomOffsetLimit(
  options: CompactAttributionOffsetOptions
) {
  return Math.max(
    0,
    Math.floor(
      options.viewportHeight - options.topControlsSafeBottomInset - options.expandedControlReserveHeight
    )
  );
}
