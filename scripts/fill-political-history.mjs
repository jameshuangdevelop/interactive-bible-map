import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { derivePoliticalHistoryFromTimeline } from "./lib/timeline-model.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const locationsDirectory = path.join(repositoryRoot, "data", "locations");
const timelinePath = path.join(repositoryRoot, "data", "timeline.json");

async function listLocationFiles() {
  const entries = await fs.readdir(locationsDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => path.join(locationsDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function toMapById(records) {
  const map = new Map();
  for (const record of records) {
    if (typeof record?.id === "string") {
      map.set(record.id, record);
    }
  }
  return map;
}

if (!(await pathExists(timelinePath))) {
  console.log(
    "Skipped: data/timeline.json is missing. No politicalHistory was changed."
  );
  process.exit(0);
}

const timeline = await readJson(timelinePath);
const entitiesById = toMapById(timeline.entities ?? []);
const areasById = toMapById(timeline.areas ?? []);
const locationFiles = await listLocationFiles();

let updatedCount = 0;

for (const locationFilePath of locationFiles) {
  const locationRecord = await readJson(locationFilePath);
  const derivedHistory = derivePoliticalHistoryFromTimeline({
    locationRecord,
    areasById,
    entitiesById
  });

  if (!Array.isArray(derivedHistory)) {
    continue;
  }

  const before = JSON.stringify(locationRecord.politicalHistory ?? []);
  const after = JSON.stringify(derivedHistory);
  if (before === after) {
    continue;
  }

  locationRecord.politicalHistory = derivedHistory;
  await fs.writeFile(locationFilePath, `${JSON.stringify(locationRecord, null, 2)}\n`, "utf8");
  updatedCount += 1;
}

console.log(`Updated politicalHistory for ${updatedCount} location file(s).`);
