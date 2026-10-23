import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureBasemapFixture } from "../../scripts/lib/basemap-fixture.mjs";

export default async function globalSetup() {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const missLogPath = path.join(repositoryRoot, "tests", "artifacts", "basemap-fixture-misses.ndjson");
  await fs.rm(missLogPath, { force: true });
  await ensureBasemapFixture({
    allowDownload: true,
    env: process.env,
    logger: console
  });
}
