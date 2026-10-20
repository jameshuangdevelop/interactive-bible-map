import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { regenerateGazaRhinocoluraFaceFromCache } from "./lib/gaza-rhinocolura-face.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(
  repositoryRoot,
  "data",
  "geo",
  "sources",
  "gaza-rhinocolura-face.geojson"
);

async function main() {
  const cacheRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-gaza-face-"));
  try {
    const build = spawnSync(process.execPath, [path.join("scripts", "build-ancient-geo.mjs")], {
      cwd: repositoryRoot,
      env: { ...process.env, ANCIENT_GEO_CACHE: cacheRoot },
      stdio: "inherit"
    });
    if (build.status !== 0) {
      throw new Error(`build-ancient-geo failed (exit code ${build.status}).`);
    }
    const regenerated = await regenerateGazaRhinocoluraFaceFromCache(cacheRoot);
    await fs.writeFile(outputPath, `${JSON.stringify(regenerated, null, 2)}\n`, "utf8");
    console.log("Wrote data/geo/sources/gaza-rhinocolura-face.geojson from pinned AD 69 compose inputs.");
  } finally {
    await fs.rm(cacheRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
