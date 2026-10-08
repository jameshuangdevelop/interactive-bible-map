// Rewrites data/geo/sources/osm-waterways.geojson, the OpenStreetMap river ways that the ancient
// layer's build cuts areas along, from Overpass's attic data as of a given UTC date:
//
//   npm run refresh:osm-waterways -- --date 2026-10-08T00:00:00Z
//
// The build itself never contacts OpenStreetMap, so a refresh is a deliberate step: afterwards, rerun
// `npm run build:ancient-geo` and review both diffs before committing them.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ATTIC_DATE_PATTERN,
  OSM_RIVERS,
  PINNED_WATERWAYS_PATH,
  fetchOsmRelationFull,
  riverCourseWays,
  serializeWaterways,
  waterwayFeatures
} from "./lib/osm-waterways.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseDate(argv) {
  const index = argv.indexOf("--date");
  const date = index >= 0 ? argv[index + 1] : null;
  if (!date || !ATTIC_DATE_PATTERN.test(date)) throw new Error("Give the attic date as --date YYYY-MM-DDTHH:MM:SSZ (UTC)");
  if (Date.parse(date) > Date.now()) throw new Error(`${date} is in the future`);
  return date;
}

// Ways added, dropped or at a new version, compared with the file being replaced.
function describeChanges(previous, features) {
  const key = (feature) => `${feature.properties.river} way ${feature.properties.wayId}`;
  const before = new Map((previous?.features ?? []).map((feature) => [key(feature), feature.properties.version]));
  const after = new Map(features.map((feature) => [key(feature), feature.properties.version]));
  const lines = [];
  for (const [way, version] of after) {
    if (!before.has(way)) lines.push(`added ${way} v${version}`);
    else if (before.get(way) !== version) lines.push(`${way}: v${before.get(way)} -> v${version}`);
  }
  for (const [way, version] of before) if (!after.has(way)) lines.push(`dropped ${way} v${version}`);
  return lines;
}

async function main() {
  const date = parseDate(process.argv.slice(2));
  const outputPath = path.join(repositoryRoot, PINNED_WATERWAYS_PATH);
  const features = [];
  for (const [riverKey, river] of Object.entries(OSM_RIVERS)) {
    const relation = await fetchOsmRelationFull(river.relationId, { date });
    const ways = riverCourseWays(relation, riverKey);
    features.push(...waterwayFeatures(riverKey, ways, { asOf: date }));
    console.log(`${river.label}: relation ${river.relationId}, ${ways.length} ways as of ${date}`);
  }
  const previous = await fs.readFile(outputPath, "utf8").then(JSON.parse, () => null);
  const changes = describeChanges(previous, features);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, serializeWaterways({ asOf: date, features }), "utf8");
  console.log(`Wrote ${PINNED_WATERWAYS_PATH} (${features.length} ways).`);
  console.log(changes.length === 0 ? "The same ways and versions as before." : `Changes:\n${changes.map((line) => `- ${line}`).join("\n")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
