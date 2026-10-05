import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const maxFiles = 20_000;
const maxFileSizeBytes = 25 * 1024 * 1024;

async function collectFileStats(rootDirectory) {
  const stack = [rootDirectory];
  let fileCount = 0;
  let largestFile = {
    absolutePath: null,
    relativePath: null,
    sizeBytes: 0
  };

  while (stack.length > 0) {
    const currentDirectory = stack.pop();
    const entries = await fs.readdir(currentDirectory, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const { size } = await fs.stat(absolutePath);
      fileCount += 1;

      if (size > largestFile.sizeBytes) {
        largestFile = {
          absolutePath,
          relativePath: path.relative(rootDirectory, absolutePath),
          sizeBytes: size
        };
      }
    }
  }

  return {
    fileCount,
    largestFile
  };
}

async function run() {
  const rawTargetPath = process.argv[2] ?? path.join("app", "dist");
  const targetPath = path.resolve(repositoryRoot, rawTargetPath);

  await fs.access(targetPath);
  const stats = await collectFileStats(targetPath);

  const summary = {
    directory: targetPath,
    fileCount: stats.fileCount,
    fileCountLimit: maxFiles,
    largestFile: {
      path: stats.largestFile.relativePath,
      sizeBytes: stats.largestFile.sizeBytes,
      sizeLimitBytes: maxFileSizeBytes
    }
  };

  console.log(JSON.stringify(summary, null, 2));

  if (stats.fileCount > maxFiles) {
    throw new Error(
      `Cloudflare Pages file-count limit exceeded: ${stats.fileCount} files (limit ${maxFiles}).`
    );
  }

  if (stats.largestFile.sizeBytes > maxFileSizeBytes) {
    throw new Error(
      `Cloudflare Pages file-size limit exceeded by '${stats.largestFile.relativePath}': ${stats.largestFile.sizeBytes} bytes (limit ${maxFileSizeBytes}).`
    );
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
