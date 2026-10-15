// npm run check:route-lines
// 1. Rebuilds data/geo/routes-lines.geojson and the stages' lineIds from an empty cache and checks that
//    the result matches the committed files byte for byte.
// 2. Audits every committed line (scripts/lib/route-line-audit.mjs, the same audit `validate:data`
//    runs) and prints the per-line table and its totals. Any failure fails the check.
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { formatAuditTable, formatAuditTotals } from "./lib/route-line-audit.mjs";
import { auditRouteLines, loadPinnedSurfaceModel } from "./lib/route-line-audit-runner.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routeLinesRelativePath = path.join("data", "geo", "routes-lines.geojson");
const routesRelativePath = path.join("data", "routes", "routes.json");
const AUDIT_FAILED_EXIT_CODE = 3;

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

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(repositoryRoot, relativePath), "utf8"));
}

async function audit(cacheRoot) {
  const locationsDirectory = path.join(repositoryRoot, "data", "locations");
  const locations = new Map();
  for (const name of (await fs.readdir(locationsDirectory)).filter((file) => file.endsWith(".json")).sort()) {
    const record = JSON.parse(await fs.readFile(path.join(locationsDirectory, name), "utf8"));
    locations.set(record.id, record);
  }
  const [routesData, stopsData, linesData, roadsData] = await Promise.all([
    readJson(routesRelativePath),
    readJson(path.join("data", "routes", "stops.json")),
    readJson(routeLinesRelativePath),
    readJson(path.join("data", "geo", "ancient-roads.geojson"))
  ]);
  const stops = new Map((stopsData.stops ?? []).map((stop) => [stop.id, stop]));
  const model = await loadPinnedSurfaceModel(cacheRoot);
  return auditRouteLines({
    model,
    routesData,
    linesData,
    lookup: { getLocation: (id) => locations.get(id), getStop: (id) => stops.get(id) },
    roadsData
  });
}

async function main() {
  const before = changedRouteFiles();
  if (before.length > 0) {
    throw new Error(
      `Route files have uncommitted changes, so the rebuild cannot be compared byte-for-byte:\n${before.join("\n")}`
    );
  }

  let reproduced = false;
  const cache = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-route-lines-check-"));
  try {
    const build = spawnSync(process.execPath, [path.join("scripts", "build-route-lines.mjs")], {
      cwd: repositoryRoot,
      env: { ...process.env, ROUTE_LINES_CACHE: cache },
      stdio: ["ignore", "ignore", "inherit"]
    });
    if (build.status !== 0 && build.status !== AUDIT_FAILED_EXIT_CODE) {
      throw new Error(`npm run build:route-lines failed (exit code ${build.status})`);
    }
    const after = changedRouteFiles();
    if (after.length > 0) {
      console.error(`Route-line rebuild from an empty cache does not match the committed files:\n${after.join("\n")}`);
    } else {
      reproduced = true;
      console.log("Reproduced route lines byte-for-byte from an empty cache.");
    }

    const { rows, totals } = await audit(cache);
    console.log("");
    console.log(formatAuditTable(rows));
    console.log("");
    console.log(formatAuditTotals(totals));
    if (totals.failing > 0) {
      console.error(`\nRoute-line audit failed: ${totals.failing} of ${totals.lines} lines.`);
    } else {
      console.log("\nRoute-line audit passed.");
    }
    if (!reproduced || totals.failing > 0) process.exitCode = 1;
  } finally {
    await fs.rm(cache, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
