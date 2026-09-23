import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getWebTextForReference, loadWebVerseIndex } from "./lib/web-text.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");

function parseArguments(argv) {
  const options = {
    all: false,
    files: [],
    webVplPath: undefined
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    switch (argument) {
      case "--all":
        options.all = true;
        break;
      case "--file": {
        const filePath = argv[index + 1];
        if (!filePath) {
          throw new Error("--file requires a path");
        }
        options.files.push(path.resolve(filePath));
        index += 1;
        break;
      }
      case "--web-vpl": {
        const filePath = argv[index + 1];
        if (!filePath) {
          throw new Error("--web-vpl requires a path");
        }
        options.webVplPath = path.resolve(filePath);
        index += 1;
        break;
      }
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

async function listLocationFiles() {
  const locationDirectory = path.join(repositoryRoot, "data", "locations");
  const entries = await fs.readdir(locationDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(locationDirectory, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function stringifyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function updateScriptureInFile(locationFilePath, verseIndex) {
  const content = await fs.readFile(locationFilePath, "utf8");
  const locationRecord = JSON.parse(content);

  if (!Array.isArray(locationRecord.scripture) || locationRecord.scripture.length === 0) {
    return false;
  }

  let changed = false;

  for (const scripture of locationRecord.scripture) {
    if (!scripture || typeof scripture.ref !== "string") {
      continue;
    }

    const expectedText = getWebTextForReference(scripture.ref, verseIndex);
    if (scripture.textWEB !== expectedText) {
      scripture.textWEB = expectedText;
      changed = true;
    }
  }

  if (changed) {
    await fs.writeFile(locationFilePath, stringifyJson(locationRecord), "utf8");
  }

  return changed;
}

const options = parseArguments(process.argv.slice(2));
const targetFiles = options.all || options.files.length === 0 ? await listLocationFiles() : options.files;

if (targetFiles.length === 0) {
  console.log("No location JSON files found. Nothing to update.");
  process.exit(0);
}

const verseIndex = await loadWebVerseIndex(options.webVplPath);
let updatedCount = 0;

for (const filePath of targetFiles) {
  const changed = await updateScriptureInFile(filePath, verseIndex);
  if (changed) {
    updatedCount += 1;
    console.log(`Updated scripture text in ${path.relative(repositoryRoot, filePath)}`);
  }
}

console.log(
  `Processed ${targetFiles.length} file(s); updated ${updatedCount} file(s).`
);
