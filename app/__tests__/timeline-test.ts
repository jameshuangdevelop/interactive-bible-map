import type { AncientStopRecord } from "../src/features/map/ancient-layer.types";
import {
  formatTimelineValueText,
  formatTimelineYear,
  resolveStopForYear
} from "../src/features/map/timeline";

const stops: AncientStopRecord[] = [
  {
    id: "4bc",
    year: -4,
    title: "Herod dies",
    summary: "",
    scripture: [],
    sources: []
  },
  {
    id: "ad6",
    year: 6,
    title: "Judea under direct Roman rule",
    summary: "",
    scripture: [],
    sources: []
  },
  {
    id: "ad44",
    year: 44,
    title: "Agrippa I dies",
    summary: "",
    scripture: [],
    sources: []
  }
];

describe("timeline helpers", () => {
  test("formats BC and AD years", () => {
    expect(formatTimelineYear(-4)).toBe("4 BC");
    expect(formatTimelineYear(50)).toBe("AD 50");
  });

  test("formats slider value text", () => {
    expect(formatTimelineValueText(stops[2])).toBe("AD 44: Agrippa I dies");
  });

  test("resolves stop in force for a given year", () => {
    expect(resolveStopForYear(stops, -4)?.id).toBe("4bc");
    expect(resolveStopForYear(stops, 5)?.id).toBe("4bc");
    expect(resolveStopForYear(stops, 6)?.id).toBe("ad6");
    expect(resolveStopForYear(stops, 50)?.id).toBe("ad44");
    expect(resolveStopForYear([], 50)).toBeNull();
  });
});
