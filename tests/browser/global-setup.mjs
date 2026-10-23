import { ensureBasemapFixture } from "../../scripts/lib/basemap-fixture.mjs";

export default async function globalSetup() {
  await ensureBasemapFixture({
    allowDownload: true,
    env: process.env,
    logger: console
  });
}
