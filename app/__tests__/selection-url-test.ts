import {
  applySelectionToSearch,
  candidateLetterToIndex,
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
});
