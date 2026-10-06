import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import {
  evaluateLighthouseGate,
  parseLighthouseTbtMode,
  readCliArgument,
  repositoryRoot,
  withResolvedBaseUrl
} from "./lib/web-checks.mjs";

const lcpThresholdMs = 2_500;
const tbtThresholdMs = 200;
const lighthouseTimeoutMs = 5 * 60 * 1000;
const lighthouseRunCount = 3;

function quoteForCmd(argument) {
  if (argument.length === 0) {
    return '""';
  }

  if (!/[ \t"&|<>^()%]/u.test(argument)) {
    return argument;
  }

  return `"${argument.replace(/%/gu, "%%").replace(/"/gu, '""')}"`;
}

function buildChromeFlagsForLighthouse() {
  return ["--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"];
}

function roundToHundredths(value) {
  return Number(value.toFixed(2));
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

async function readWebGlRenderer(baseUrl, chromePath, chromeFlags) {
  const launchArguments = chromeFlags.filter((flag) => flag !== "--headless=new");
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: launchArguments
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000
    });

    return await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      const webglContext =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!webglContext) {
        return {
          renderer: null,
          vendor: null,
          usesDebugRendererInfo: false,
          error: "WebGL context unavailable."
        };
      }

      const debugRendererInfo = webglContext.getExtension("WEBGL_debug_renderer_info");
      const renderer = debugRendererInfo
        ? webglContext.getParameter(debugRendererInfo.UNMASKED_RENDERER_WEBGL)
        : webglContext.getParameter(webglContext.RENDERER);
      const vendor = debugRendererInfo
        ? webglContext.getParameter(debugRendererInfo.UNMASKED_VENDOR_WEBGL)
        : webglContext.getParameter(webglContext.VENDOR);

      return {
        renderer: typeof renderer === "string" ? renderer : String(renderer ?? ""),
        vendor: typeof vendor === "string" ? vendor : String(vendor ?? ""),
        usesDebugRendererInfo: Boolean(debugRendererInfo),
        error: null
      };
    });
  } catch (error) {
    return {
      renderer: null,
      vendor: null,
      usesDebugRendererInfo: false,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

function runLighthouse(baseUrl, chromePath, chromeFlags) {
  const npmArgs = [
    "exec",
    "--",
    "lighthouse",
    baseUrl,
    "--preset=desktop",
    "--output=json",
    "--output-path=stdout",
    "--quiet",
    `--chrome-flags=${chromeFlags.join(" ")}`
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
  const argv = process.argv.slice(2);
  const tbtMode = parseLighthouseTbtMode(argv, process.env);
  const reportPathArgument = readCliArgument(argv, "report-path");

  await withResolvedBaseUrl(async ({ baseUrl, usingProvidedBaseUrl }) => {
    const chromePath = chromium.executablePath();
    const chromeFlags = buildChromeFlagsForLighthouse();
    const webGlRenderer = await readWebGlRenderer(baseUrl, chromePath, chromeFlags);

    const runResults = [];
    for (let runIndex = 1; runIndex <= lighthouseRunCount; runIndex += 1) {
      const { stdout, stderr, cleanupErrorRecovered } = await runLighthouse(
        baseUrl,
        chromePath,
        chromeFlags
      );
      const report = parseLighthouseJson(stdout);
      const lcpMs = readNumericAuditValue(report, "largest-contentful-paint");
      const tbtMs = readNumericAuditValue(report, "total-blocking-time");
      const performanceScore = report?.categories?.performance?.score;

      runResults.push({
        runIndex,
        lcpMs,
        tbtMs,
        performanceScore:
          typeof performanceScore === "number" ? Number((performanceScore * 100).toFixed(0)) : null,
        cleanupErrorRecovered,
        cleanupErrorDetail: cleanupErrorRecovered
          ? stderr
              .split(/\r?\n/gu)
              .filter((line) => line.trim().length > 0)
              .slice(0, 8)
          : null,
        report
      });
    }

    const gate = evaluateLighthouseGate({
      lcpValuesMs: runResults.map((result) => result.lcpMs),
      tbtValuesMs: runResults.map((result) => result.tbtMs),
      lcpThresholdMs,
      tbtThresholdMs,
      tbtMode
    });

    const summary = {
      baseUrl,
      usingProvidedBaseUrl,
      runCount: lighthouseRunCount,
      tbtMode: gate.tbtMode,
      tbtEnforced: gate.tbtEnforced,
      chromeFlags,
      webGlRenderer,
      runs: runResults.map((result) => {
        const runSummary = {
          runIndex: result.runIndex,
          performanceScore: result.performanceScore,
          lcpMs: roundToHundredths(result.lcpMs),
          tbtMs: roundToHundredths(result.tbtMs)
        };
        if (result.cleanupErrorRecovered) {
          runSummary.recoveredChromeCleanupError = true;
          runSummary.recoveredChromeCleanupErrorDetail = result.cleanupErrorDetail;
        }

        return runSummary;
      }),
      medians: {
        lcpMs: roundToHundredths(gate.lcpMedianMs),
        tbtMs: roundToHundredths(gate.tbtMedianMs)
      },
      thresholds: {
        lcpMs: lcpThresholdMs,
        tbtMs: tbtThresholdMs
      },
      passed: gate.passed
    };

    if (reportPathArgument) {
      const reportPath = await writeReportFile(
        {
          baseUrl,
          chromeFlags,
          webGlRenderer,
          runCount: lighthouseRunCount,
          tbtMode: gate.tbtMode,
          tbtEnforced: gate.tbtEnforced,
          thresholds: {
            lcpMs: lcpThresholdMs,
            tbtMs: tbtThresholdMs
          },
          medians: summary.medians,
          runs: runResults.map((result) => ({
            runIndex: result.runIndex,
            performanceScore: result.performanceScore,
            lcpMs: roundToHundredths(result.lcpMs),
            tbtMs: roundToHundredths(result.tbtMs),
            cleanupErrorRecovered: result.cleanupErrorRecovered,
            cleanupErrorDetail: result.cleanupErrorDetail,
            report: result.report
          }))
        },
        reportPathArgument
      );
      summary.reportPath = reportPath;
    }

    console.log(JSON.stringify(summary, null, 2));
    if (!gate.tbtEnforced) {
      console.log(
        "TBT not enforced on this run (--tbt-mode=report): software WebGL on CI runners can't measure it; enforce it against the preview from a desktop machine (ADR-0034)"
      );
    }

    if (!gate.passed) {
      const failureParts = [];
      if (!gate.lcpPassed) {
        failureParts.push(
          `LCP ${roundToHundredths(gate.lcpMedianMs)} ms (limit ${lcpThresholdMs})`
        );
      }
      if (gate.tbtEnforced && !gate.tbtPassed) {
        failureParts.push(
          `TBT ${roundToHundredths(gate.tbtMedianMs)} ms (limit ${tbtThresholdMs})`
        );
      }

      throw new Error(
        `Lighthouse gate failed (median of ${lighthouseRunCount} runs): ${failureParts.join(", ")}.`
      );
    }
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
