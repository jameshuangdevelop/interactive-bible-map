import {
  resolveVisibleInlineLabelIds,
  type LabelCollisionMarker
} from "../src/features/map/label-collision";

describe("resolveVisibleInlineLabelIds", () => {
  test("keeps selected labels and hides overlapping lower-priority labels", () => {
    const markers: LabelCollisionMarker[] = [
      {
        id: "selected-capernaum",
        kind: "pin",
        x: 100,
        y: 100,
        selected: true,
        inlineLabel: "Capernaum",
        placeType: "city",
        dataOrder: 5
      },
      {
        id: "galilee-region",
        kind: "region-label",
        x: 140,
        y: 100,
        selected: false,
        inlineLabel: "GALILEE",
        placeType: "region",
        dataOrder: 1
      }
    ];

    const visible = resolveVisibleInlineLabelIds(markers);

    expect(visible.has("selected-capernaum")).toBe(true);
    expect(visible.has("galilee-region")).toBe(false);
  });

  test("hides a label when it overlaps another pin", () => {
    const markers: LabelCollisionMarker[] = [
      {
        id: "capernaum-pin",
        kind: "pin",
        x: 100,
        y: 100,
        selected: false,
        inlineLabel: "Capernaum",
        placeType: "city",
        dataOrder: 0
      },
      {
        id: "chorazin-pin",
        kind: "pin",
        x: 150,
        y: 100,
        selected: false,
        placeType: "city",
        dataOrder: 1
      }
    ];

    const visible = resolveVisibleInlineLabelIds(markers);

    expect(visible.has("capernaum-pin")).toBe(false);
  });

  test("uses data order as the tiebreaker for same-priority label collisions", () => {
    const markers: LabelCollisionMarker[] = [
      {
        id: "galilee-region",
        kind: "region-label",
        x: 120,
        y: 120,
        selected: false,
        inlineLabel: "GALILEE",
        placeType: "region",
        dataOrder: 1
      },
      {
        id: "judea-region",
        kind: "region-label",
        x: 124,
        y: 120,
        selected: false,
        inlineLabel: "JUDEA",
        placeType: "region",
        dataOrder: 2
      }
    ];

    const visible = resolveVisibleInlineLabelIds(markers);

    expect(visible.has("galilee-region")).toBe(true);
    expect(visible.has("judea-region")).toBe(false);
  });
});
