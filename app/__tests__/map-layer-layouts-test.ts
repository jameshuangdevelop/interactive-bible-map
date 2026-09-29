import {
  CLUSTER_COUNT_LAYOUT,
  PIN_COLLISION_LAYOUT,
  QUESTION_BADGE_LAYOUT
} from "../src/features/map/map-layer-layouts";

describe("map layer layouts", () => {
  test("positions disputed badge as a small top-right overlay", () => {
    expect(QUESTION_BADGE_LAYOUT).toEqual({
      "icon-size": 1,
      "icon-anchor": "top-right",
      "icon-offset": [0.45, -0.45],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true
    });
  });

  test("always shows cluster counts above colliding labels", () => {
    expect(CLUSTER_COUNT_LAYOUT["text-allow-overlap"]).toBe(true);
    expect(CLUSTER_COUNT_LAYOUT["text-ignore-placement"]).toBe(true);
  });

  test("uses collision-only pin symbols to reserve label space", () => {
    expect(PIN_COLLISION_LAYOUT).toEqual({
      "icon-size": 1,
      "icon-allow-overlap": true,
      "icon-ignore-placement": false
    });
  });
});
