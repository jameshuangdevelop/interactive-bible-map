import { formatTimelineYear } from "./timeline";

interface HolderYearRangeOptions {
  heldFromYear: number;
  heldToYear: number;
  heldFromKnown: boolean;
  timelineRangeEndYear: number;
}

export function formatHolderYearRange({
  heldFromYear,
  heldToYear,
  heldFromKnown,
  timelineRangeEndYear
}: HolderYearRangeOptions) {
  const reachesTimelineEnd = heldToYear >= timelineRangeEndYear;
  if (!heldFromKnown && reachesTimelineEnd) {
    return "";
  }
  if (!heldFromKnown) {
    return `until ${formatTimelineYear(heldToYear)}`;
  }
  if (reachesTimelineEnd) {
    return `from ${formatTimelineYear(heldFromYear)}`;
  }
  if (heldFromYear >= 0 && heldToYear >= 0) {
    return `AD ${heldFromYear} – ${heldToYear}`;
  }
  return `${formatTimelineYear(heldFromYear)} – ${formatTimelineYear(heldToYear)}`;
}
