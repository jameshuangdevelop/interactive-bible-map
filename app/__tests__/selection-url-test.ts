import {
  applyMapModeToSearch,
  applyTimelineYearToSearch,
  applySelectionToSearch,
  candidateLetterToIndex,
  parseMapModeFromSearch,
  parseTimelineYearFromSearch,
  parseSelectionFromSearch
} from "../src/features/map/selection-url";

describe("selection URL helpers", () => {
  test("parses place and candidate from URL search params", () => {
    expect(parseSelectionFromSearch("?place=capernaum&candidate=b")).toEqual({
      placeId: "capernaum",
      candidateIndex: 1
    });
  });

  test("parses place without candidate", () => {
    expect(parseSelectionFromSearch("?place=jerusalem")).toEqual({
      placeId: "jerusalem",
      candidateIndex: null
    });
  });

  test("returns null for malformed place params", () => {
    expect(parseSelectionFromSearch("?candidate=a")).toBeNull();
    expect(parseSelectionFromSearch("?place=")).toBeNull();
  });

  test("writes and removes selection params without dropping unrelated params", () => {
    expect(
      applySelectionToSearch("?tab=map", {
        placeId: "emmaus",
        candidateIndex: 2
      })
    ).toBe("?tab=map&place=emmaus&candidate=c");

    expect(applySelectionToSearch("?tab=map&place=emmaus&candidate=c", null)).toBe("?tab=map");
  });

  test("accepts only A-Z candidate letters", () => {
    expect(candidateLetterToIndex("a")).toBe(0);
    expect(candidateLetterToIndex("Z")).toBe(25);
    expect(candidateLetterToIndex("aa")).toBeNull();
    expect(candidateLetterToIndex("7")).toBeNull();
    expect(candidateLetterToIndex(null)).toBeNull();
  });

  test("parses map mode from URL search params", () => {
    expect(parseMapModeFromSearch("?map=modern")).toBe("modern");
    expect(parseMapModeFromSearch("?map=ancient")).toBe("ancient");
    expect(parseMapModeFromSearch("?map=foo")).toBe("ancient");
    expect(parseMapModeFromSearch("")).toBe("ancient");
  });

  test("writes and removes map mode params without dropping unrelated params", () => {
    expect(applyMapModeToSearch("?place=jerusalem", "modern")).toBe("?place=jerusalem&map=modern");
    expect(applyMapModeToSearch("?place=jerusalem&map=modern", "ancient")).toBe("?place=jerusalem");
  });

  test("parses timeline year from URL search params", () => {
    expect(parseTimelineYearFromSearch("?year=-4")).toBe(-4);
    expect(parseTimelineYearFromSearch("?year=44")).toBe(44);
    expect(parseTimelineYearFromSearch("?year=not-a-number")).toBeNull();
    expect(parseTimelineYearFromSearch("?place=jerusalem")).toBeNull();
  });

  test("writes and removes timeline year without dropping unrelated params", () => {
    expect(applyTimelineYearToSearch("?place=jerusalem", -4)).toBe("?place=jerusalem&year=-4");
    expect(applyTimelineYearToSearch("?place=jerusalem&year=-4", 44)).toBe("?place=jerusalem&year=44");
    expect(applyTimelineYearToSearch("?place=jerusalem&year=44", null)).toBe("?place=jerusalem");
  });
});
