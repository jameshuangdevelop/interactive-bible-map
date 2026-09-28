import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  copyMapLibreWorkerAssets,
  workerPathInPublicDirectory
} from "./lib/maplibre-worker-assets.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");

async function copyMapLibreWorker() {
  const result = await copyMapLibreWorkerAssets();
  const workerDestinationPath = workerPathInPublicDirectory();

  console.log(
    `Copied MapLibre worker assets to ${path.relative(repositoryRoot, path.dirname(workerDestinationPath))}: ${result.copiedRelativePaths.join(", ")}.`
  );
}

copyMapLibreWorker().catch((error) => {
  console.error("Failed to copy MapLibre worker:", error.message);
  process.exitCode = 1;
});
