import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..", "..");

const mapLibreDistDirectory = path.join(repositoryRoot, "node_modules", "maplibre-gl", "dist");
const workerEntryFileName = "maplibre-gl-worker.mjs";

const importSpecifierPatterns = [
  /\bimport\s*(?:[\w*$\s{},]*?)\s*from\s*["']([^"']+)["']/gu,
  /\bimport\s*["']([^"']+)["']/gu,
  /\bexport\s+[^"']*?\s+from\s+["']([^"']+)["']/gu,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu
];

async function resolveRelativeImportPathAsync(fromFilePath, specifier) {
  const fromDirectory = path.dirname(fromFilePath);
  const basePath = path.resolve(fromDirectory, specifier);
  const candidates = [
    basePath,
    `${basePath}.mjs`,
    `${basePath}.js`,
    path.join(basePath, "index.mjs"),
    path.join(basePath, "index.js")
  ];

  for (const candidatePath of candidates) {
    try {
      const stats = await fs.stat(candidatePath);
      if (stats.isFile()) {
        return candidatePath;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function collectRelativeStaticImports(sourceCode) {
  const imports = new Set();

  for (const pattern of importSpecifierPatterns) {
    for (const match of sourceCode.matchAll(pattern)) {
      const specifier = match[1];
      if (!specifier || !specifier.startsWith(".")) {
        continue;
      }

      imports.add(specifier);
    }
  }

  return Array.from(imports).sort((left, right) => left.localeCompare(right));
}

export async function collectWorkerAssetPaths(
  workerEntryPath = path.join(mapLibreDistDirectory, workerEntryFileName)
) {
  const pending = [workerEntryPath];
  const seen = new Set();
  const orderedAssetPaths = [];

  while (pending.length > 0) {
    const filePath = pending.shift();
    if (!filePath || seen.has(filePath)) {
      continue;
    }

    seen.add(filePath);
    orderedAssetPaths.push(filePath);

    const source = await fs.readFile(filePath, "utf8");
    const importSpecifiers = collectRelativeStaticImports(source);

    for (const specifier of importSpecifiers) {
      const resolvedPath = await resolveRelativeImportPathAsync(filePath, specifier);
      if (!resolvedPath) {
        throw new Error(
          `Could not resolve relative worker import '${specifier}' from ${filePath}.`
        );
      }

      pending.push(resolvedPath);
    }
  }

  return orderedAssetPaths;
}

export async function copyMapLibreWorkerAssets({
  workerEntryPath = path.join(mapLibreDistDirectory, workerEntryFileName),
  destinationDirectory = path.join(repositoryRoot, "app", "public")
} = {}) {
  const workerBaseDirectory = path.dirname(workerEntryPath);
  const assetPaths = await collectWorkerAssetPaths(workerEntryPath);
  const copiedRelativePaths = [];

  await fs.mkdir(destinationDirectory, { recursive: true });

  for (const assetPath of assetPaths) {
    const relativePath = path.relative(workerBaseDirectory, assetPath);
    const destinationPath = path.join(destinationDirectory, relativePath);

    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(assetPath, destinationPath);

    copiedRelativePaths.push(relativePath);
  }

  return {
    destinationDirectory,
    workerEntryPath,
    copiedRelativePaths: copiedRelativePaths.sort((left, right) =>
      left.localeCompare(right)
    )
  };
}

export async function verifyWorkerRelativeImportsInDirectory({
  workerFilePath
}) {
  const source = await fs.readFile(workerFilePath, "utf8");
  const importSpecifiers = collectRelativeStaticImports(source);
  const missingSpecifierPaths = [];

  for (const specifier of importSpecifiers) {
    const resolved = await resolveRelativeImportPathAsync(workerFilePath, specifier);
    if (!resolved) {
      missingSpecifierPaths.push(specifier);
    }
  }

  return {
    importSpecifiers,
    missingSpecifierPaths
  };
}

export function workerPathInPublicDirectory(
  destinationDirectory = path.join(repositoryRoot, "app", "public")
) {
  return path.join(destinationDirectory, workerEntryFileName);
}
