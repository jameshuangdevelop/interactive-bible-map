import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseReference, VPL_BOOK_CODE_TO_NAME } from "./books.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..", "..");

export const DEFAULT_WEB_VPL_PATH = path.join(
  repositoryRoot,
  "data",
  "reference",
  "engwebp_vpl.txt"
);

const verseIndexCache = new Map();

const VPL_LINE_PATTERN =
  /^(?<code>[1-3A-Z]{3}) (?<chapter>[1-9][0-9]*):(?<verse>[1-9][0-9]*) (?<text>.+)$/u;

export function makeVerseKey(book, chapter, verse) {
  return `${book} ${chapter}:${verse}`;
}

export async function loadWebVerseIndex(vplPath = DEFAULT_WEB_VPL_PATH) {
  const resolvedPath = path.resolve(vplPath);

  if (verseIndexCache.has(resolvedPath)) {
    return verseIndexCache.get(resolvedPath);
  }

  const content = await fs.readFile(resolvedPath, "utf8");
  const verseIndex = new Map();

  for (const line of content.split(/\r?\n/u)) {
    if (line.trim().length === 0) {
      continue;
    }

    const match = VPL_LINE_PATTERN.exec(line);
    if (!match?.groups) {
      continue;
    }

    const bookName = VPL_BOOK_CODE_TO_NAME[match.groups.code];
    if (!bookName) {
      continue;
    }

    const chapter = Number.parseInt(match.groups.chapter, 10);
    const verse = Number.parseInt(match.groups.verse, 10);
    const verseKey = makeVerseKey(bookName, chapter, verse);
    verseIndex.set(verseKey, match.groups.text.trim());
  }

  if (verseIndex.size === 0) {
    throw new Error(`No verses were parsed from ${resolvedPath}`);
  }

  verseIndexCache.set(resolvedPath, verseIndex);
  return verseIndex;
}

export function getWebTextForReference(reference, verseIndex) {
  const parsed = parseReference(reference);
  const verses = [];

  for (let verse = parsed.startVerse; verse <= parsed.endVerse; verse += 1) {
    const verseKey = makeVerseKey(parsed.book, parsed.chapter, verse);
    const verseText = verseIndex.get(verseKey);

    if (!verseText) {
      throw new Error(`WEB text missing for ${verseKey}`);
    }

    verses.push(verseText);
  }

  return verses.join(" ");
}
