import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testsDirectory, "..");
const locationsDirectory = path.join(repositoryRoot, "data", "locations");
const openBibleIdsPath = path.join(repositoryRoot, "data", "reference", "openbible-ids.json");

function collectOpenBibleSlugsFromSources(record) {
  const slugs = [];

  function ingestSources(sources) {
    if (!Array.isArray(sources)) {
      return;
    }

    for (const sourceId of sources) {
      if (typeof sourceId !== "string" || !sourceId.startsWith("openbible:")) {
        continue;
      }
      slugs.push(sourceId.slice("openbible:".length));
    }
  }

  ingestSources(record.summary?.sources);
  for (const candidate of record.candidates ?? []) {
    ingestSources(candidate?.sources);
  }
  for (const entry of record.history ?? []) {
    ingestSources(entry?.sources);
  }
  for (const entry of record.otConnections ?? []) {
    ingestSources(entry?.sources);
  }
  for (const entry of record.politicalHistory ?? []) {
    ingestSources(entry?.sources);
  }

  return slugs;
}

test("every openbible source slug used in locations has a lookup entry", async () => {
  const locationFiles = (await fs.readdir(locationsDirectory))
    .filter((fileName) => fileName.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));

  const usedSlugs = new Set();
  for (const fileName of locationFiles) {
    const filePath = path.join(locationsDirectory, fileName);
    const locationRecord = JSON.parse(await fs.readFile(filePath, "utf8"));
    for (const slug of collectOpenBibleSlugsFromSources(locationRecord)) {
      usedSlugs.add(slug);
    }
  }

  const lookup = JSON.parse(await fs.readFile(openBibleIdsPath, "utf8"));
  const missingSlugs = [...usedSlugs]
    .filter((slug) => typeof lookup[slug] !== "string" || lookup[slug].length === 0)
    .sort((left, right) => left.localeCompare(right));

  assert.deepEqual(
    missingSlugs,
    [],
    `Missing openbible id mappings for: ${missingSlugs.map((slug) => `openbible:${slug}`).join(", ")}`
  );
});
