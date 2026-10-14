import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { removeRoutesFixtureFilesFromDist } from "../scripts/lib/export-web.mjs";

test("removeRoutesFixtureFilesFromDist removes only routes.fixture.* files", async () => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-export-web-"));
  try {
    const generatedDirectory = path.join(temporaryDirectory, "generated");
    await fs.mkdir(generatedDirectory, { recursive: true });

    const keptFileNames = ["routes.routes.json", "routes.lines.geojson", "other.json"];
    const fixtureFileNames = [
      "routes.fixture.routes.json",
      "routes.fixture.stages.json",
      "routes.fixture.stops.json",
      "routes.fixture.lines.geojson"
    ];

    for (const fileName of [...keptFileNames, ...fixtureFileNames]) {
      await fs.writeFile(path.join(generatedDirectory, fileName), "{}\n", "utf8");
    }

    const removed = await removeRoutesFixtureFilesFromDist(generatedDirectory);
    assert.deepEqual(removed, [...fixtureFileNames].sort((a, b) => a.localeCompare(b)));

    const remaining = (await fs.readdir(generatedDirectory)).sort((a, b) =>
      a.localeCompare(b)
    );
    assert.deepEqual(remaining, [...keptFileNames].sort((a, b) => a.localeCompare(b)));
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
