import fs from "node:fs/promises";
import path from "node:path";

function markdownEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function firstErrorLine(test) {
  const results = Array.isArray(test.results) ? test.results : [];
  for (const result of results) {
    const errors = Array.isArray(result.errors) ? result.errors : [];
    for (const error of errors) {
      const text = error?.message ?? error?.stack ?? error?.value ?? "";
      const line = String(text).split(/\r?\n/u).find((entry) => entry.trim().length > 0);
      if (line) {
        return line.trim();
      }
    }
  }
  return "";
}

function collectSpecs(suites, parentTitles = [], output = []) {
  for (const suite of suites ?? []) {
    const suiteTitle =
      typeof suite?.title === "string" && suite.title.trim().length > 0
        ? suite.title.trim()
        : null;
    const nextParents = suiteTitle ? [...parentTitles, suiteTitle] : parentTitles;

    for (const spec of suite?.specs ?? []) {
      const specTitle = typeof spec?.title === "string" ? spec.title : "(untitled spec)";
      const title = [...nextParents, specTitle].join(" › ");
      const specFile = typeof spec?.file === "string" ? spec.file : "unknown";
      const specLine = Number.isFinite(spec?.line) ? spec.line : 0;

      for (const test of spec?.tests ?? []) {
        const results = Array.isArray(test?.results) ? test.results : [];
        const totalDurationMs = results.reduce(
          (sum, result) => sum + (Number.isFinite(result?.duration) ? result.duration : 0),
          0
        );
        output.push({
          title,
          file: specFile,
          line: specLine,
          status: typeof test?.status === "string" ? test.status : "unknown",
          totalDurationMs,
          firstError: firstErrorLine(test)
        });
      }
    }

    collectSpecs(suite?.suites ?? [], nextParents, output);
  }
  return output;
}

async function appendSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    console.log(markdown);
    return;
  }
  await fs.mkdir(path.dirname(summaryPath), { recursive: true });
  await fs.appendFile(summaryPath, `${markdown}\n`, "utf8");
}

async function main() {
  const reportPath = process.argv[2];
  if (!reportPath) {
    console.log("No report path argument provided; skipping browser summary.");
    return;
  }

  let raw;
  try {
    raw = await fs.readFile(reportPath, "utf8");
  } catch (error) {
    await appendSummary(
      [
        "### Browser test summary",
        "",
        `Playwright JSON report not found at \`${reportPath}\`; skipped flaky/slow summary.`
      ].join("\n")
    );
    console.log(`Playwright JSON report not found at ${reportPath}; skipping summary.`);
    return;
  }

  let report;
  try {
    report = JSON.parse(raw);
  } catch (error) {
    await appendSummary(
      [
        "### Browser test summary",
        "",
        `Playwright JSON report at \`${reportPath}\` could not be parsed; skipped flaky/slow summary.`
      ].join("\n")
    );
    console.log(`Could not parse Playwright JSON report at ${reportPath}; skipping summary.`);
    return;
  }

  const specs = collectSpecs(report?.suites ?? []);
  const flakyOrFailed = specs.filter((spec) => spec.status === "flaky" || spec.status === "unexpected");
  const slowest = [...specs]
    .sort((a, b) => b.totalDurationMs - a.totalDurationMs)
    .slice(0, 10);

  const lines = ["### Browser test summary", ""];
  if (flakyOrFailed.length === 0) {
    lines.push("No flaky or failed tests.", "");
    console.log("No flaky or failed tests");
  } else {
    lines.push("| Status | Test | Location | First error line |", "|---|---|---|---|");
    for (const item of flakyOrFailed) {
      lines.push(
        `| ${item.status} | ${markdownEscape(item.title)} | ${markdownEscape(`${item.file}:${item.line}`)} | ${markdownEscape(item.firstError || "n/a")} |`
      );
    }
    lines.push("");
  }

  lines.push("| Slowest test | Duration (ms) |", "|---|---:|");
  for (const item of slowest) {
    lines.push(`| ${markdownEscape(item.title)} | ${Math.round(item.totalDurationMs)} |`);
  }
  lines.push("");

  await appendSummary(lines.join("\n"));
}

await main();
