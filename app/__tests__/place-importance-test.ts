import {
  comparePlacesByImportance,
  sortPlacesByImportance
} from "../src/features/map/place-importance";
import type { PlaceIndexRecord } from "../src/features/map/types";

function createPlaceFixture(overrides: Partial<PlaceIndexRecord>): PlaceIndexRecord {
  return {
    id: "fixture",
    names: {
      ancient: ["Fixture"],
      alternate: []
    },
    type: "city",
    zoomTier: "city",
    prominence: "standard",
    passageCount: 0,
    parentId: null,
    candidates: [{ label: "Fixture", coordinates: [0, 0], confidence: "high" }],
    ...overrides
  };
}

describe("place importance sorting", () => {
  test("orders major places first, then by passage count descending", () => {
    const places: PlaceIndexRecord[] = [
      createPlaceFixture({
        id: "standard-many-passages",
        prominence: "standard",
        passageCount: 99
      }),
      createPlaceFixture({
        id: "major-fewer-passages",
        prominence: "major",
        passageCount: 5
      }),
      createPlaceFixture({
        id: "major-more-passages",
        prominence: "major",
        passageCount: 12
      }),
      createPlaceFixture({
        id: "standard-fewer-passages",
        prominence: "standard",
        passageCount: 3
      })
    ];

    const sorted = sortPlacesByImportance(places);
    expect(sorted.map((place) => place.id)).toEqual([
      "major-more-passages",
      "major-fewer-passages",
      "standard-many-passages",
      "standard-fewer-passages"
    ]);
  });

  test("keeps data order when prominence and passage count tie", () => {
    const left = createPlaceFixture({
      id: "left",
      prominence: "major",
      passageCount: 7
    });
    const right = createPlaceFixture({
      id: "right",
      prominence: "major",
      passageCount: 7
    });

    expect(comparePlacesByImportance(left, right, 2, 5)).toBeLessThan(0);

    const sorted = sortPlacesByImportance([right, left]);
    expect(sorted.map((place) => place.id)).toEqual(["right", "left"]);
  });

  test("returns a new array without mutating the original input", () => {
    const first = createPlaceFixture({ id: "first", prominence: "major", passageCount: 1 });
    const second = createPlaceFixture({ id: "second", prominence: "major", passageCount: 9 });
    const input = [first, second];

    const sorted = sortPlacesByImportance(input);

    expect(sorted).not.toBe(input);
    expect(input.map((place) => place.id)).toEqual(["first", "second"]);
    expect(sorted.map((place) => place.id)).toEqual(["second", "first"]);
  });
});
