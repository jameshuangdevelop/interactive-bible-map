// End-to-end check of the ancient layer's build: from an empty cache folder, `npm run build:ancient-geo`
// must download and check its pinned inputs, pass every acceptance check and reproduce the committed
// data/geo/ files byte for byte.
//
//   npm run check:ancient-geo
//
// It downloads about 120 MB and takes a few minutes, so it isn't part of `npm test`. Commit or stash any
// change to data/geo/ first: the check compares the rebuilt files with git's.
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function changedGeoFiles() {
  const result = spawnSync("git", ["status", "--porcelain", "--", "data/geo"], { cwd: repositoryRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git status failed: ${result.stderr}`);
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

async function main() {
  const before = changedGeoFiles();
  if (before.length > 0) throw new Error(`data/geo/ has uncommitted changes, so the rebuild can't be compared with it:\n${before.join("\n")}`);
  const cache = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-ancient-geo-check-"));
  const started = Date.now();
  try {
    const build = spawnSync(process.execPath, [path.join("scripts", "build-ancient-geo.mjs")], {
      cwd: repositoryRoot,
      env: { ...process.env, ANCIENT_GEO_CACHE: cache },
      stdio: "inherit"
    });
    if (build.status !== 0) throw new Error(`npm run build:ancient-geo failed (exit code ${build.status})`);
    const after = changedGeoFiles();
    if (after.length > 0) throw new Error(`The rebuild from an empty cache differs from the committed data/geo/:\n${after.join("\n")}`);
    console.log(`Reproduced data/geo/ byte for byte from an empty cache in ${Math.round((Date.now() - started) / 1000)} s.`);
  } finally {
    await fs.rm(cache, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
