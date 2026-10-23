import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const missLogPath = path.join(repositoryRoot, "tests", "artifacts", "basemap-fixture-misses.ndjson");

export default async function globalTeardown() {
  if (process.env.IBM_LIVE_NETWORK === "1" || process.env.IBM_BASEMAP_RECORD === "1") {
    return;
  }

  let content;
  try {
    content = await fs.readFile(missLogPath, "utf8");
  } catch {
    return;
  }

  const lines = content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return;
  }

  const urls = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (typeof parsed.url === "string") {
        urls.push(parsed.url);
      }
    } catch {
      // Ignore malformed lines.
    }
  }
  if (urls.length === 0) {
    return;
  }

  const uniqueUrls = [...new Set(urls)];
  const sample = uniqueUrls.slice(0, 20);
  const summaryBody = `[basemap-fixture-miss] ${urls.length} miss(es), ${uniqueUrls.length} unique URL(s). First ${sample.length}:\n${sample
    .map((url, index) => `${index + 1}. ${url}`)
    .join("\n")}`;
  // eslint-disable-next-line no-console
  console.warn(summaryBody);

  const githubStepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (githubStepSummaryPath) {
    // Do not fail CI on misses: misses are warning telemetry and failing here would reintroduce timing flakes.
    const markdown = [
      "### Basemap fixture misses (warning only)",
      "",
      `- Total misses: ${urls.length}`,
      `- Unique URLs: ${uniqueUrls.length}`,
      "",
      "First 20 unique URLs:",
      ...sample.map((url, index) => `${index + 1}. \`${url}\``),
      ""
    ].join("\n");
    await fs.appendFile(githubStepSummaryPath, `${markdown}\n`).catch(() => {});
  }
}
