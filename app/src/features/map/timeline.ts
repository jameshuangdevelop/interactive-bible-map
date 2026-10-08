import type { AncientStopRecord } from "./ancient-layer.types";

function sortStops(stops: AncientStopRecord[]) {
  return [...stops].sort((left, right) => left.year - right.year);
}

export function formatTimelineYear(year: number) {
  if (year < 0) {
    return `${Math.abs(year)} BC`;
  }

  return `AD ${year}`;
}

export function formatTimelineValueText(stop: AncientStopRecord) {
  return `${formatTimelineYear(stop.year)}: ${stop.title}`;
}

export function resolveStopIndexForYear(stops: AncientStopRecord[], year: number) {
  if (stops.length === 0) {
    return -1;
  }

  const sorted = sortStops(stops);
  let index = 0;
  for (let candidateIndex = 0; candidateIndex < sorted.length; candidateIndex += 1) {
    if (sorted[candidateIndex].year <= year) {
      index = candidateIndex;
      continue;
    }

    break;
  }

  return index;
}

export function resolveStopForYear(stops: AncientStopRecord[], year: number) {
  const index = resolveStopIndexForYear(stops, year);
  return index < 0 ? null : sortStops(stops)[index];
}
