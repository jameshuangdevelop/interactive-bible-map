import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { auditRouteLines, loadPinnedSurfaceModel } from "../../scripts/lib/route-line-audit-runner.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..", "..");
const locationsDirectory = path.join(repositoryRoot, "data", "locations");
const routesPath = path.join(repositoryRoot, "data", "routes", "routes.json");
const stopsPath = path.join(repositoryRoot, "data", "routes", "stops.json");
const linesPath = path.join(repositoryRoot, "data", "geo", "routes-lines.geojson");
const roadsPath = path.join(repositoryRoot, "data", "geo", "ancient-roads.geojson");

let pinnedSurfaceModelPromise = null;

async function loadPinnedModel() {
  if (!pinnedSurfaceModelPromise) {
    pinnedSurfaceModelPromise = loadPinnedSurfaceModel();
  }
  return pinnedSurfaceModelPromise;
}

test("real route lines pass the full land/water audit", async () => {
  const [routesData, stopsData, linesData, roadsData, model] = await Promise.all([
    fs.readFile(routesPath, "utf8").then((content) => JSON.parse(content)),
    fs.readFile(stopsPath, "utf8").then((content) => JSON.parse(content)),
    fs.readFile(linesPath, "utf8").then((content) => JSON.parse(content)),
    fs.readFile(roadsPath, "utf8").then((content) => JSON.parse(content)),
    loadPinnedModel()
  ]);

  const locationById = new Map(
    await Promise.all(
      (await fs.readdir(locationsDirectory))
        .filter((fileName) => fileName.endsWith(".json"))
        .map(async (fileName) => {
          const location = JSON.parse(
            await fs.readFile(path.join(locationsDirectory, fileName), "utf8")
          );
          return [location.id, location];
        })
    )
  );
  const stopById = new Map((stopsData.stops ?? []).map((stop) => [stop.id, stop]));

  const { rows, totals } = auditRouteLines({
    model,
    routesData,
    linesData,
    lookup: {
      getLocation: (id) => locationById.get(id),
      getStop: (id) => stopById.get(id)
    },
    roadsData
  });

  const failingRows = rows.filter((row) => row.failures.length > 0);
  assert.equal(
    failingRows.length,
    0,
    `Expected all route lines to pass audit, but ${failingRows.length} line(s) failed: ${failingRows
      .map((row) => `${row.lineId}: ${row.failures.join("; ")}`)
      .join(" | ")}`
  );
  assert.equal(totals.failing, 0);
});
