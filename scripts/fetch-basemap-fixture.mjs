import { ensureBasemapFixture } from "./lib/basemap-fixture.mjs";

async function run() {
  const result = await ensureBasemapFixture({
    allowDownload: true,
    env: process.env,
    logger: console
  });

  if (result.skipped) {
    console.log(`Skipped basemap fixture fetch (mode: ${result.mode}).`);
    return;
  }

  if (result.downloaded) {
    console.log(
      `Fetched basemap fixture into ${result.cacheDirectory} (${result.lock.bytes} bytes, sha256=${result.lock.sha256}).`
    );
    return;
  }

  console.log(`Basemap fixture cache is ready at ${result.cacheDirectory}.`);
}

run().catch((error) => {
  console.error(
    `Basemap fixture fetch failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
});
