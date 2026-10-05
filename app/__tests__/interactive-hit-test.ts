import {
  pickNearestCandidate,
  squaredDistance,
  type HitCandidate,
  type ScreenPoint
} from "../src/features/map/interactive-hit";

describe("interactive hit helpers", () => {
  test("returns null when no candidates are provided", () => {
    expect(pickNearestCandidate({ x: 0, y: 0 }, [])).toBeNull();
  });

  test("picks the nearest candidate by projected distance", () => {
    const pointer: ScreenPoint = { x: 100, y: 100 };
    const candidates: HitCandidate<string>[] = [
      { value: "far", point: { x: 180, y: 160 } },
      { value: "near", point: { x: 104, y: 102 } },
      { value: "middle", point: { x: 130, y: 130 } }
    ];

    expect(pickNearestCandidate(pointer, candidates)).toBe("near");
  });

  test("uses tie-breaker when two candidates are equally close", () => {
    const pointer: ScreenPoint = { x: 10, y: 10 };
    const candidates: HitCandidate<{ id: string }>[] = [
      { value: { id: "zeta" }, point: { x: 12, y: 12 } },
      { value: { id: "alpha" }, point: { x: 8, y: 8 } }
    ];

    const nearest = pickNearestCandidate(
      pointer,
      candidates,
      (left, right) => left.id.localeCompare(right.id)
    );
    expect(nearest).toEqual({ id: "alpha" });
  });

  test("computes squared distance without floating precision noise from sqrt", () => {
    expect(squaredDistance({ x: 2, y: 3 }, { x: -1, y: -1 })).toBe(25);
  });
});
