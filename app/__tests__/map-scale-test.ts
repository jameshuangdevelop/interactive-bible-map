import { roundScaleDistanceMeters } from "../src/features/map/map-scale";

describe("map scale rounding", () => {
  test("rounds scale distances down to the nearest 1/2/3/5 step", () => {
    expect(roundScaleDistanceMeters(3_574)).toBe(3_000);
    expect(roundScaleDistanceMeters(58_000)).toBe(50_000);
    expect(roundScaleDistanceMeters(245_000)).toBe(200_000);
  });
});
