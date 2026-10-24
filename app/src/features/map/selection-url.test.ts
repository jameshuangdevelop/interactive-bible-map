import { parseRouteIdFromSearch, parseRouteStageFromSearch } from "./selection-url";

describe("legacy Jesus route URL mapping", () => {
  test("maps route=jesus to jesus-1", () => {
    expect(parseRouteIdFromSearch("?tab=routes&route=jesus")).toBe("jesus-1");
    expect(parseRouteStageFromSearch("?tab=routes&route=jesus")).toBeNull();
  });

  test("maps route=jesus&stage=9 to the new route and stage", () => {
    expect(parseRouteIdFromSearch("?tab=routes&route=jesus&stage=9")).toBe("jesus-1");
    expect(parseRouteStageFromSearch("?tab=routes&route=jesus&stage=9")).toBe(6);
  });

  test("drops out-of-range legacy stage and keeps route=jesus-1", () => {
    expect(parseRouteIdFromSearch("?tab=routes&route=jesus&stage=99")).toBe("jesus-1");
    expect(parseRouteStageFromSearch("?tab=routes&route=jesus&stage=99")).toBeNull();
  });
});
