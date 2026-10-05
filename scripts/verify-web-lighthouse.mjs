import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import { readCliArgument, repositoryRoot, withResolvedBaseUrl } from "./lib/web-checks.mjs";

const lcpThresholdMs = 2_500;
const tbtThresholdMs = 200;
const lighthouseTimeoutMs = 5 * 60 * 1000;

function quoteForCmd(argument) {
  if (argument.length === 0) {
    return '""';
  }

  if (!/[ \t"&|<>^()%]/u.test(argument)) {
    return argument;
  }

  return `"${argument.replace(/%/gu, "%%").replace(/"/gu, '""')}"`;
}

function terminateProcessTree(child) {
  if (!child.pid) {
    return Promise.resolve();
  }

  if (process.platform === "win32") {
    return new Promise((resolve) => {
      const killer = spawn(
        process.env.ComSpec ?? "cmd.exe",
        ["/d", "/s", "/c", `taskkill /PID ${child.pid} /T /F >nul 2>nul`],
        { stdio: "ignore" }
      );
      killer.on("error", () => {
        resolve();
      });
      killer.on("exit", () => {
        resolve();
      });
    });
  }

  try {
    child.kill("SIGKILL");
  } catch (error) {
    void error;
  }
  return Promise.resolve();
}

function runLighthouse(baseUrl, chromePath) {
  const npmArgs = [
    "exec",
    "--",
    "lighthouse",
    baseUrl,
    "--preset=desktop",
    "--output=json",
    "--output-path=stdout",
    "--quiet",
    "--chrome-flags=--headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage"
  ];

  return new Promise((resolve, reject) => {
    const childEnvironment = {
      ...process.env,
      CHROME_PATH: chromePath
    };

    const child =
      process.platform === "win32"
        ? spawn(
            process.env.ComSpec ?? "cmd.exe",
            [
              "/d",
              "/s",
              "/c",
              ["npm", ...npmArgs].map((argument) => quoteForCmd(argument)).join(" ")
            ],
            {
              cwd: repositoryRoot,
              stdio: ["ignore", "pipe", "pipe"],
              env: childEnvironment
            }
          )
        : spawn("npm", npmArgs, {
            cwd: repositoryRoot,
            stdio: ["ignore", "pipe", "pipe"],
            env: childEnvironment
          });

    let settled = false;

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const timeoutHandle = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      void terminateProcessTree(child).finally(() => {
        reject(
          new Error(`Lighthouse timed out after ${Math.floor(lighthouseTimeoutMs / 1_000)} seconds.`)
        );
      });
    }, lighthouseTimeoutMs);
    timeoutHandle.unref?.();

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutHandle);
      reject(error);
    });

    child.on("exit", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutHandle);

      if (code === 0) {
        resolve({ stdout, stderr, cleanupErrorRecovered: false });
        return;
      }

      const cleanupErrorRecovered =
        code === 1 &&
        stderr.includes("EPERM, Permission denied") &&
        stderr.includes("chrome-launcher") &&
        stdout.trim().length > 0;
      if (cleanupErrorRecovered) {
        resolve({ stdout, stderr, cleanupErrorRecovered: true });
        return;
      }

      reject(new Error(`Lighthouse failed with exit code ${code}.\n${stderr}`));
    });
  });
}

function parseLighthouseJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error("Lighthouse produced empty JSON output.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace < firstBrace) {
      throw new Error("Lighthouse output did not contain a JSON report.");
    }

    const possibleJson = trimmed.slice(firstBrace, lastBrace + 1);
    return JSON.parse(possibleJson);
  }
}

function readNumericAuditValue(report, id) {
  const value = report?.audits?.[id]?.numericValue;
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Lighthouse report missing numeric value for audit '${id}'.`);
  }

  return value;
}

async function writeReportFile(report, reportPath) {
  const resolvedPath = path.resolve(repositoryRoot, reportPath);
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return resolvedPath;
}

async function run() {
  const reportPathArgument = readCliArgument(process.argv.slice(2), "report-path");

  await withResolvedBaseUrl(async ({ baseUrl, usingProvidedBaseUrl }) => {
    const chromePath = chromium.executablePath();
    const { stdout, stderr, cleanupErrorRecovered } = await runLighthouse(baseUrl, chromePath);
    const report = parseLighthouseJson(stdout);

    const lcpMs = readNumericAuditValue(report, "largest-contentful-paint");
    const tbtMs = readNumericAuditValue(report, "total-blocking-time");
    const performanceScore = report?.categories?.performance?.score;

    const summary = {
      baseUrl,
      usingProvidedBaseUrl,
      performanceScore:
        typeof performanceScore === "number" ? Number((performanceScore * 100).toFixed(0)) : null,
      lcpMs: Number(lcpMs.toFixed(2)),
      tbtMs: Number(tbtMs.toFixed(2)),
      thresholds: {
        lcpMs: lcpThresholdMs,
        tbtMs: tbtThresholdMs
      },
      passed: lcpMs <= lcpThresholdMs && tbtMs <= tbtThresholdMs
    };

    if (cleanupErrorRecovered) {
      summary.recoveredChromeCleanupError = true;
      summary.recoveredChromeCleanupErrorDetail = stderr
        .split(/\r?\n/gu)
        .filter((line) => line.trim().length > 0)
        .slice(0, 8);
    }

    let reportPath = null;
    if (reportPathArgument) {
      reportPath = await writeReportFile(report, reportPathArgument);
      summary.reportPath = reportPath;
    }

    console.log(JSON.stringify(summary, null, 2));

    if (!summary.passed) {
      throw new Error(
        `Lighthouse gate failed: LCP ${summary.lcpMs} ms (limit ${lcpThresholdMs}), TBT ${summary.tbtMs} ms (limit ${tbtThresholdMs}).`
      );
    }
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
