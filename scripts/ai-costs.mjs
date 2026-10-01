import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_AI_INCOMING_DIRECTORY,
  summarizeAiIncomingCosts
} from "./lib/ai-reconstructions.mjs";

function relativeToRepository(filePath) {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = path.resolve(scriptDirectory, "..");
  return path.relative(repositoryRoot, filePath).replace(/\\/gu, "/");
}

function formatUsd(value) {
  return `$${value.toFixed(6)}`;
}

function printSummaryTable(summary) {
  if (summary.rows.length === 0) {
    console.log("No AI candidate side-cars found.");
    return;
  }

  const locationHeader = "Place";
  const candidatesHeader = "Candidates";
  const costHeader = "Estimated USD";

  const locationWidth = Math.max(
    locationHeader.length,
    ...summary.rows.map((row) => row.locationId.length),
    "TOTAL".length
  );
  const candidatesWidth = Math.max(
    candidatesHeader.length,
    ...summary.rows.map((row) => String(row.candidates).length),
    String(summary.totalCandidates).length
  );
  const costWidth = Math.max(
    costHeader.length,
    ...summary.rows.map((row) => formatUsd(row.totalCostUsd).length),
    formatUsd(summary.totalCostUsd).length
  );

  const formatRow = (locationId, candidates, cost) =>
    `${locationId.padEnd(locationWidth)}  ${String(candidates).padStart(candidatesWidth)}  ${cost.padStart(costWidth)}`;

  console.log(formatRow(locationHeader, candidatesHeader, costHeader));
  console.log(
    `${"-".repeat(locationWidth)}  ${"-".repeat(candidatesWidth)}  ${"-".repeat(costWidth)}`
  );

  for (const row of summary.rows) {
    console.log(formatRow(row.locationId, row.candidates, formatUsd(row.totalCostUsd)));
  }

  console.log(
    formatRow("TOTAL", summary.totalCandidates, formatUsd(summary.totalCostUsd))
  );
}

export async function runAiCosts(argv = process.argv.slice(2)) {
  if (argv.length > 0) {
    throw new Error("Usage: npm run ai-costs");
  }

  const summary = await summarizeAiIncomingCosts({
    incomingDirectory: DEFAULT_AI_INCOMING_DIRECTORY
  });
  console.log(
    `Incoming folder: ${relativeToRepository(path.resolve(DEFAULT_AI_INCOMING_DIRECTORY))}`
  );
  printSummaryTable(summary);
  return summary;
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  try {
    await runAiCosts(process.argv.slice(2));
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
