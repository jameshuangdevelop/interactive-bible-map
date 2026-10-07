import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const aiMediaSourceDirectory = path.join(repositoryRoot, "media", "ai");
const aiMediaDistDirectory = path.join(repositoryRoot, "app", "dist", "media", "ai");

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child =
      process.platform === "win32"
        ? spawn(
            process.env.ComSpec ?? "cmd.exe",
            ["/d", "/s", "/c", `${command} ${args.join(" ")}`],
            {
              stdio: "inherit"
            }
          )
        : spawn(command, args, {
            stdio: "inherit"
          });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed (${command} ${args.join(" ")}) with exit code ${code}.`));
    });
  });
}

async function copyAiMediaIntoDist() {
  let sourceEntries = null;
  try {
    sourceEntries = await fs.readdir(aiMediaSourceDirectory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await fs.rm(aiMediaDistDirectory, { recursive: true, force: true });
      return {
        sourceDirectoryExists: false,
        copiedFileNames: []
      };
    }

    throw error;
  }

  const webpFileNames = sourceEntries
    .filter((entry) => entry.isFile() && entry.name.toLocaleLowerCase().endsWith(".webp"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  await fs.rm(aiMediaDistDirectory, { recursive: true, force: true });
  if (webpFileNames.length === 0) {
    return {
      sourceDirectoryExists: true,
      copiedFileNames: []
    };
  }

  await fs.mkdir(aiMediaDistDirectory, { recursive: true });
  for (const fileName of webpFileNames) {
    const sourcePath = path.join(aiMediaSourceDirectory, fileName);
    const destinationPath = path.join(aiMediaDistDirectory, fileName);
    await fs.copyFile(sourcePath, destinationPath);
  }

  return {
    sourceDirectoryExists: true,
    copiedFileNames: webpFileNames
  };
}

async function run() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  await runCommand(npmCommand, ["run", "export:web", "--workspace", "interactive-bible-map-app"]);

  const copyResult = await copyAiMediaIntoDist();
  if (!copyResult.sourceDirectoryExists) {
    console.log("Skipped AI media copy: media/ai/ does not exist.");
    return;
  }

  if (copyResult.copiedFileNames.length === 0) {
    console.log("No AI WebP files found in media/ai/.");
    return;
  }

  console.log(
    `Copied ${copyResult.copiedFileNames.length} AI WebP file(s) to app/dist/media/ai: ${copyResult.copiedFileNames.join(", ")}`
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
