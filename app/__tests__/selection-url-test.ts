import {
  applyRouteIdToSearch,
  applyRouteStageToSearch,
  applyViewTabToSearch,
  applyMapModeToSearch,
  applyTimelineYearToSearch,
  applySelectionToSearch,
  candidateLetterToIndex,
  parseRouteIdFromSearch,
  parseRouteStageFromSearch,
  parseMapModeFromSearch,
  parseViewTabFromSearch,
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

  test("parses routes tab and route params", () => {
    expect(parseViewTabFromSearch("?tab=routes")).toBe("routes");
    expect(parseViewTabFromSearch("?tab=map")).toBe("map");
    expect(parseRouteIdFromSearch("?route=paul-2")).toBe("paul-2");
    expect(parseRouteIdFromSearch("?route=")).toBeNull();
    expect(parseRouteStageFromSearch("?stage=4")).toBe(4);
    expect(parseRouteStageFromSearch("?stage=0")).toBeNull();
  });

  test("writes route tab params without dropping unrelated params", () => {
    expect(applyViewTabToSearch("?place=jerusalem", "routes")).toBe("?place=jerusalem&tab=routes");
    expect(applyRouteIdToSearch("?tab=routes", "paul-2")).toBe("?tab=routes&route=paul-2");
    expect(applyRouteStageToSearch("?tab=routes&route=paul-2", 4)).toBe(
      "?tab=routes&route=paul-2&stage=4"
    );
    expect(applyViewTabToSearch("?place=jerusalem&tab=routes&route=paul-2&stage=4", "map")).toBe(
      "?place=jerusalem"
    );
  });
});
