import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");

function getArgumentValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index < 0) {
    return undefined;
  }
  return process.argv[index + 1];
}

function extractVersion(source, label) {
  const match = /^v?(\d+\.\d+\.\d+)(?:[-+].+)?$/.exec(source);
  if (!match) {
    throw new Error(
      `${label} '${source}' does not include a plain Playwright version like '1.63.0' or 'v1.63.0-noble'.`
    );
  }
  return match[1];
}

function readPackageVersion(manifest, packageName) {
  const spec =
    manifest.devDependencies?.[packageName] ??
    manifest.dependencies?.[packageName] ??
    manifest.peerDependencies?.[packageName];
  if (!spec) {
    throw new Error(`package.json is missing '${packageName}'.`);
  }
  return extractVersion(spec, `package.json ${packageName}`);
}

async function run() {
  const imageTag =
    getArgumentValue("--image-tag") ??
    getArgumentValue("--tag") ??
    process.env.PLAYWRIGHT_IMAGE_TAG;
  if (!imageTag) {
    throw new Error(
      "Missing Playwright image tag. Pass --image-tag vX.Y.Z-noble or set PLAYWRIGHT_IMAGE_TAG."
    );
  }

  const packageJsonPath = path.join(repositoryRoot, "package.json");
  const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
  const manifest = JSON.parse(packageJsonContent);

  const imageVersion = extractVersion(imageTag, "Playwright image tag");
  const playwrightTestVersion = readPackageVersion(manifest, "@playwright/test");
  const playwrightVersion = readPackageVersion(manifest, "playwright");

  if (playwrightTestVersion !== playwrightVersion) {
    throw new Error(
      `Version mismatch in package.json: @playwright/test=${playwrightTestVersion} but playwright=${playwrightVersion}. Keep them equal.`
    );
  }

  if (imageVersion !== playwrightVersion) {
    throw new Error(
      `Playwright container mismatch: image ${imageTag} resolves to ${imageVersion}, but package.json pins @playwright/test and playwright to ${playwrightVersion}. Bump the image tag and both packages together.`
    );
  }

  console.log(
    `Playwright versions match: image ${imageTag}, @playwright/test ${playwrightTestVersion}, playwright ${playwrightVersion}.`
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
