import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");

function currentDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function runPlaywrightRecord(recordDirectory) {
  return new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(command, ["run", "verify:web:playwright", "--", "--workers=1", "--retries=0"], {
      cwd: repositoryRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        FULL_SUITE: "1",
        IBM_BASEMAP_RECORD: "1",
        IBM_BASEMAP_RECORD_DIR: recordDirectory
      }
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Playwright record run failed with exit code ${code}.`));
    });
  });
}

async function run() {
  const date = process.env.IBM_BASEMAP_FIXTURE_DATE?.trim() || currentDateString();
  const baseDirectory = process.env.IBM_BASEMAP_WORK_DIR?.trim() || "/tmp/m5-22-basemap-fixture";
  const recordDirectory = path.resolve(baseDirectory, `store-${date}`);
  await fs.rm(recordDirectory, { recursive: true, force: true });
  await fs.mkdir(recordDirectory, { recursive: true });

  console.log(`Recording basemap fixture into ${recordDirectory}`);
  await runPlaywrightRecord(recordDirectory);

  const manifestPath = path.join(recordDirectory, "manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const entryCount = Array.isArray(manifest.entries) ? manifest.entries.length : 0;
  console.log(`Recorded ${entryCount} unique basemap URL response(s).`);
  console.log(`Record directory: ${recordDirectory}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
