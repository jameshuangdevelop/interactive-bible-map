import fs from "node:fs";
import path from "node:path";

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

describe("legacy Jesus links stay in step with the route data", () => {
  // The old `jesus` route listed segment-01 to segment-32 in order, so old stage N was segment N.
  const routesPath = path.resolve(__dirname, "..", "..", "..", "..", "data", "routes", "routes.json");
  const { routes } = JSON.parse(fs.readFileSync(routesPath, "utf8")) as {
    routes: { id: string; stages: { id: string }[] }[];
  };

  test.each(Array.from({ length: 32 }, (_, index) => index + 1))("old stage %i opens the same segment", (oldStage) => {
    const search = `?tab=routes&route=jesus&stage=${oldStage}`;
    const route = routes.find((candidate) => candidate.id === parseRouteIdFromSearch(search));
    const stage = parseRouteStageFromSearch(search);
    expect(stage).not.toBeNull();
    expect(route?.stages[(stage ?? 0) - 1]?.id).toBe(`segment-${String(oldStage).padStart(2, "0")}`);
  });
});
