import { execFile as execFileCallback } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const DEFAULT_GIT_MAX_BUFFER_BYTES = 10 * 1024 * 1024;
const DEFAULT_BASE_RECORD_CONCURRENCY = 4;
const execFileAsync = promisify(execFileCallback);

function normalizeRelativePath(pathValue) {
  return String(pathValue).replace(/\\/gu, "/");
}

function readCommandStdout(commandResult) {
  if (typeof commandResult === "string") {
    return commandResult;
  }

  if (typeof commandResult?.stdout === "string") {
    return commandResult.stdout;
  }

  if (commandResult?.stdout instanceof Uint8Array) {
    return Buffer.from(commandResult.stdout).toString("utf8");
  }

  return "";
}

function collectCommandOutput(error) {
  const stdout = typeof error?.stdout === "string" ? error.stdout : "";
  const stderr = typeof error?.stderr === "string" ? error.stderr : "";
  const message = error instanceof Error ? error.message : String(error);
  return `${stdout}\n${stderr}\n${message}`.trim();
}

function isMissingPathAtRefError(error) {
  const output = collectCommandOutput(error).toLowerCase();
  return output.includes("exists on disk, but not in") || output.includes("does not exist in");
}

async function runWithConcurrency(items, concurrency, worker) {
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

export async function readMediaRecordAtRef({
  changedSinceRef,
  fileName,
  repositoryRoot,
  execFile = execFileAsync
}) {
  const relativePath = `data/media/${fileName}`;
  let rawRecordText;
  try {
    const commandResult = await execFile("git", ["show", `${changedSinceRef}:${relativePath}`], {
      cwd: repositoryRoot,
      maxBuffer: DEFAULT_GIT_MAX_BUFFER_BYTES
    });
    rawRecordText = readCommandStdout(commandResult);
  } catch (error) {
    if (isMissingPathAtRefError(error)) {
      return {
        status: "missing",
        fileName,
        relativePath
      };
    }

    throw new Error(
      `Could not read ${relativePath} at ${changedSinceRef}: ${collectCommandOutput(error)}`
    );
  }

  try {
    return {
      status: "found",
      fileName,
      relativePath,
      record: JSON.parse(rawRecordText)
    };
  } catch (error) {
    return {
      status: "parse-error",
      fileName,
      relativePath,
      parseError: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function loadBaseMediaRecordsByFileName({
  changedSinceRef,
  mediaRecords,
  repositoryRoot,
  execFile = execFileAsync
}) {
  const mediaRecordsWithFileName = (Array.isArray(mediaRecords) ? mediaRecords : []).filter(
    (mediaRecord) => typeof mediaRecord?.fileName === "string" && mediaRecord.fileName.length > 0
  );

  const results = await runWithConcurrency(
    mediaRecordsWithFileName,
    DEFAULT_BASE_RECORD_CONCURRENCY,
    (mediaRecord) =>
      readMediaRecordAtRef({
        changedSinceRef,
        fileName: mediaRecord.fileName,
        repositoryRoot,
        execFile
      })
  );

  const baseMediaRecordsByFileName = new Map();
  const parseWarnings = [];

  for (const result of results) {
    if (result.status === "found") {
      baseMediaRecordsByFileName.set(result.fileName, result.record);
      continue;
    }

    if (result.status === "parse-error") {
      parseWarnings.push(
        `${result.relativePath} at ${changedSinceRef} could not be parsed (${result.parseError}); treating all its images as new.`
      );
    }
  }

  return {
    baseMediaRecordsByFileName,
    parseWarnings
  };
}

export async function loadChangedAiFilesSinceRef({
  changedSinceRef,
  repositoryRoot,
  execFile = execFileAsync,
  stat = fs.stat
}) {
  const commandResult = await execFile("git", ["diff", "--name-only", changedSinceRef, "--", "media/ai"], {
    cwd: repositoryRoot,
    maxBuffer: DEFAULT_GIT_MAX_BUFFER_BYTES
  });
  const stdout = readCommandStdout(commandResult);

  const changedPaths = stdout
    .split(/\r?\n/u)
    .map((line) => normalizeRelativePath(line.trim()))
    .filter((line) => line.length > 0 && line.toLowerCase().endsWith(".webp"));

  const existingChangedPaths = (
    await Promise.all(
      changedPaths.map(async (relativePath) => {
        const absolutePath = path.resolve(repositoryRoot, relativePath);
        try {
          const stats = await stat(absolutePath);
          if (!stats.isFile()) {
            return null;
          }
        } catch {
          return null;
        }

        return relativePath;
      })
    )
  ).filter((relativePath) => relativePath !== null);

  return new Set(existingChangedPaths);
}
