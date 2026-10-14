import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routeLinesRelativePath = path.join("data", "geo", "routes-lines.geojson");
const routesRelativePath = path.join("data", "routes", "routes.json");

function changedRouteFiles() {
  const result = spawnSync("git", ["status", "--porcelain", "--", routeLinesRelativePath, routesRelativePath], {
    cwd: repositoryRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`git status failed: ${result.stderr}`);
  }
  return result.stdout.split(/\r?\n/u).filter(Boolean);
}

async function main() {
  const before = changedRouteFiles();
  if (before.length > 0) {
    throw new Error(
      `Route files have uncommitted changes, so the rebuild cannot be compared byte-for-byte:\n${before.join("\n")}`
    );
  }

  const cache = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-route-lines-check-"));
  try {
    const build = spawnSync(process.execPath, [path.join("scripts", "build-route-lines.mjs")], {
      cwd: repositoryRoot,
      env: { ...process.env, ROUTE_LINES_CACHE: cache },
      stdio: "inherit"
    });
    if (build.status !== 0) {
      throw new Error(`npm run build:route-lines failed (exit code ${build.status})`);
    }
    const after = changedRouteFiles();
    if (after.length > 0) {
      throw new Error(
        `Route-line rebuild from an empty cache does not match committed files:\n${after.join("\n")}`
      );
    }
    console.log("Reproduced route lines byte-for-byte from an empty cache.");
  } finally {
    await fs.rm(cache, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
