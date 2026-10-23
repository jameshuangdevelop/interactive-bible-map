import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const workflowsDirectory = path.join(repositoryRoot, ".github", "workflows");
const packageJsonPath = path.join(repositoryRoot, "package.json");
const anyPlaywrightImageReferenceRegex = /mcr\.microsoft\.com\/playwright(?:[:@])[^\s'"]+/g;
const expectedPlaywrightTagRegex = /^mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-[a-z0-9.-]+$/;
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

function extractPlaywrightImageReferences(content, fileName = "<inline>") {
  const found = [];
  const invalid = [];

  for (const match of content.matchAll(anyPlaywrightImageReferenceRegex)) {
    const image = match[0];
    const parsed = expectedPlaywrightTagRegex.exec(image);
    if (!parsed) {
      invalid.push({ fileName, image });
      continue;
    }

    found.push({
      fileName,
      image,
      version: parsed[1]
    });
  }

  return { found, invalid };
}

function readWorkflowImageVersions() {
  const workflowFiles = fs
    .readdirSync(workflowsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".yml"))
    .map((entry) => entry.name)
    .sort();

  const found = [];
  const invalid = [];
  for (const fileName of workflowFiles) {
    const filePath = path.join(workflowsDirectory, fileName);
    const content = fs.readFileSync(filePath, "utf8");
    const extracted = extractPlaywrightImageReferences(content, fileName);
    found.push(...extracted.found);
    invalid.push(...extracted.invalid);
  }

  return { found, invalid };
}

test("Playwright image matcher rejects digest references", () => {
  const sample = "image: mcr.microsoft.com/playwright@sha256:abc123";
  const { found, invalid } = extractPlaywrightImageReferences(sample, "sample.yml");

  assert.equal(found.length, 0);
  assert.deepEqual(invalid, [
    {
      fileName: "sample.yml",
      image: "mcr.microsoft.com/playwright@sha256:abc123"
    }
  ]);
});

test("Playwright container image version in workflows matches package.json", () => {
  const packageVersion = readPackageVersions();
  const { found: workflowImages, invalid: invalidWorkflowImages } = readWorkflowImageVersions();

  assert.equal(
    invalidWorkflowImages.length,
    0,
    `Unsupported Playwright image reference(s). Use 'mcr.microsoft.com/playwright:vX.Y.Z-<os>' only: ${invalidWorkflowImages
      .map((entry) => `${entry.fileName}:${entry.image}`)
      .join(", ")}`
  );

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
