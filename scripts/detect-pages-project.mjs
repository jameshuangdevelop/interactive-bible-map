import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function parseProjectListArray(rawOutput) {
  const firstBracketIndex = rawOutput.indexOf("[");
  const lastBracketIndex = rawOutput.lastIndexOf("]");
  if (firstBracketIndex === -1 || lastBracketIndex < firstBracketIndex) {
    return null;
  }

  const parsed = JSON.parse(rawOutput.slice(firstBracketIndex, lastBracketIndex + 1));
  if (!Array.isArray(parsed)) {
    throw new Error("Cloudflare Pages project list output did not parse to a JSON array.");
  }

  return parsed;
}

export function detectPagesProjectExists(rawOutput, projectName) {
  const parsedArray = parseProjectListArray(rawOutput);
  if (!parsedArray) {
    return false;
  }

  return parsedArray.some(
    (entry) => entry && typeof entry === "object" && entry["Project Name"] === projectName
  );
}

function run() {
  const rawOutput = process.env.PROJECTS_JSON ?? "";
  const projectName = process.env.PAGES_PROJECT_NAME?.trim() ?? "";
  const outputPath = process.env.GITHUB_OUTPUT;

  if (!projectName) {
    throw new Error("PAGES_PROJECT_NAME is required.");
  }

  if (!outputPath) {
    throw new Error("GITHUB_OUTPUT is required.");
  }

  const exists = detectPagesProjectExists(rawOutput, projectName);
  fs.appendFileSync(outputPath, `exists=${exists}\n`);
}

const isExecutedAsCli =
  typeof process.argv[1] === "string" &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isExecutedAsCli) {
  run();
}
