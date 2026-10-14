import fs from "node:fs/promises";
import path from "node:path";

export async function removeRoutesFixtureFilesFromDist(generatedDistDirectory) {
  let entries;
  try {
    entries = await fs.readdir(generatedDistDirectory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const fixtureFileNames = entries
    .filter((entry) => entry.isFile() && /^routes\.fixture\./u.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  for (const fixtureFileName of fixtureFileNames) {
    await fs.rm(path.join(generatedDistDirectory, fixtureFileName), { force: true });
  }

  return fixtureFileNames;
}
