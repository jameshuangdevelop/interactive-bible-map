import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const workflowsDirectory = path.join(repositoryRoot, ".github", "workflows");
const packageJsonPath = path.join(repositoryRoot, "package.json");
const workflowImageRegex = /mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-[a-z0-9.-]+/g;
const exactPackageVersionRegex = /^\d+\.\d+\.\d+$/;

function readPackageVersions() {
  const manifest = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const playwrightTestVersion = manifest.devDependencies?.["@playwright/test"];
  const playwrightVersion = manifest.devDependencies?.playwright;

  assert.ok(playwrightTestVersion, "package.json is missing devDependency @playwright/test.");
  assert.ok(playwrightVersion, "package.json is missing devDependency playwright.");
  assert.match(
    playwrightTestVersion,
    exactPackageVersionRegex,
    `@playwright/test must be pinned exactly (no ^ or ~): got '${playwrightTestVersion}'.`
  );
  assert.match(
    playwrightVersion,
    exactPackageVersionRegex,
    `playwright must be pinned exactly (no ^ or ~): got '${playwrightVersion}'.`
  );
  assert.equal(
    playwrightTestVersion,
    playwrightVersion,
    `package.json mismatch: @playwright/test=${playwrightTestVersion}, playwright=${playwrightVersion}.`
  );

  return playwrightVersion;
}

function readWorkflowImageVersions() {
  const workflowFiles = fs
    .readdirSync(workflowsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".yml"))
    .map((entry) => entry.name)
    .sort();

  const found = [];
  for (const fileName of workflowFiles) {
    const filePath = path.join(workflowsDirectory, fileName);
    const content = fs.readFileSync(filePath, "utf8");
    for (const match of content.matchAll(workflowImageRegex)) {
      found.push({
        fileName,
        image: match[0],
        version: match[1]
      });
    }
  }

  return found;
}

test("Playwright container image version in workflows matches package.json", () => {
  const packageVersion = readPackageVersions();
  const workflowImages = readWorkflowImageVersions();

  assert.ok(
    workflowImages.length > 0,
    "No Playwright container image references found in .github/workflows/*.yml."
  );

  const workflowVersions = new Set(workflowImages.map((entry) => entry.version));
  assert.equal(
    workflowVersions.size,
    1,
    `Playwright container versions differ across workflows: ${workflowImages
      .map((entry) => `${entry.fileName}:${entry.image}`)
      .join(", ")}`
  );

  const [workflowVersion] = workflowVersions;
  assert.equal(
    workflowVersion,
    packageVersion,
    `Playwright version mismatch: workflows use ${workflowVersion}, package.json uses ${packageVersion}.`
  );
});
