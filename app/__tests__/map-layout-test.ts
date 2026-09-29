import { getScaleControlLeftOffset } from "../src/features/map/map-layout";

describe("map layout helpers", () => {
  test("positions scale control 16px from map edge with and without panel", () => {
    expect(getScaleControlLeftOffset(0)).toBe(16);
    expect(getScaleControlLeftOffset(408)).toBe(424);
  });
});
