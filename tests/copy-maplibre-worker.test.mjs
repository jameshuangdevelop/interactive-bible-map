import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  copyMapLibreWorkerAssets,
  verifyWorkerRelativeImportsInDirectory,
  workerPathInPublicDirectory
} from "../scripts/lib/maplibre-worker-assets.mjs";

async function withTemporaryDirectory(run) {
  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "ibm-maplibre-worker-test-")
  );
  try {
    return await run(temporaryDirectory);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

test("copy step writes worker and all relative worker imports", async () => {
  await withTemporaryDirectory(async (destinationDirectory) => {
    const result = await copyMapLibreWorkerAssets({ destinationDirectory });
    const workerFilePath = workerPathInPublicDirectory(destinationDirectory);

    assert.equal(result.copiedRelativePaths.includes("maplibre-gl-worker.mjs"), true);
    await fs.access(workerFilePath);

    const importVerification = await verifyWorkerRelativeImportsInDirectory({
      workerFilePath
    });

    assert.equal(importVerification.importSpecifiers.length > 0, true);
    assert.deepEqual(importVerification.missingSpecifierPaths, []);
  });
});
