import fs from "node:fs";
import path from "node:path";

import {
  CITE_ONLY_BIBLE_VERSIONS,
  FALLBACK_VERSATILES_SOURCES_CREDITS_MARKDOWN,
  MAIN_BASEMAP_SOURCES_CREDITS_MARKDOWN,
  UPSTREAM_SOURCES,
  WEB_NOTICE_TEXT
} from "../src/features/search/sources-credits-content";

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/gu, "\n").trim();
}

function readRepositoryFile(...segments: string[]) {
  const repositoryRoot = path.resolve(__dirname, "..", "..");
  return fs.readFileSync(path.join(repositoryRoot, ...segments), "utf8");
}

function extractMarkdownCodeBlock(source: string, sectionHeading: string) {
  const sectionStart = source.indexOf(sectionHeading);
  if (sectionStart < 0) {
    throw new Error(`Could not extract markdown block for section '${sectionHeading}'.`);
  }

  const drawerHeading = '**2. "Sources & credits" drawer:**';
  const drawerStart = source.indexOf(drawerHeading, sectionStart);
  if (drawerStart < 0) {
    throw new Error(`Could not find drawer heading for section '${sectionHeading}'.`);
  }

  const fenceStart = source.indexOf("```markdown", drawerStart);
  if (fenceStart < 0) {
    throw new Error(`Could not find markdown fence for section '${sectionHeading}'.`);
  }

  const blockStart = source.indexOf("\n", fenceStart);
  if (blockStart < 0) {
    throw new Error(`Could not find markdown content start for section '${sectionHeading}'.`);
  }

  const fenceEnd = source.indexOf("```", blockStart + 1);
  if (fenceEnd < 0) {
    throw new Error(`Could not find markdown content end for section '${sectionHeading}'.`);
  }

  return source.slice(blockStart + 1, fenceEnd).trimEnd();
}

describe("sources and credits text constants", () => {
  const licensesDocument = readRepositoryFile("docs", "LICENSES.md");
  const attributionDocument = readRepositoryFile("ATTRIBUTION.md");

  test("keeps WEB notice verbatim from docs/LICENSES.md", () => {
    const match = licensesDocument.match(/## WEB \(Bible text\) attribution wording\s*> ([^\n]+)/u);
    if (!match) {
      throw new Error("Could not find WEB notice in docs/LICENSES.md.");
    }

    expect(normalizeLineEndings(WEB_NOTICE_TEXT)).toBe(normalizeLineEndings(match[1]));
  });

  test("keeps main and VersaTiles drawer strings verbatim from docs/LICENSES.md", () => {
    const mainBlock = extractMarkdownCodeBlock(
      licensesDocument,
      "#### Main basemap: Liberty on OpenFreeMap"
    );
    const versaTilesBlock = extractMarkdownCodeBlock(
      licensesDocument,
      "#### Fallback B: VersaTiles public tile server (acceptable for outages only)"
    );

    expect(normalizeLineEndings(MAIN_BASEMAP_SOURCES_CREDITS_MARKDOWN)).toBe(
      normalizeLineEndings(mainBlock)
    );
    expect(normalizeLineEndings(FALLBACK_VERSATILES_SOURCES_CREDITS_MARKDOWN)).toBe(
      normalizeLineEndings(versaTilesBlock)
    );
  });

  test("lists every upstream source from ATTRIBUTION.md", () => {
    const tableStart = attributionDocument.indexOf("| Source | Used for |");
    if (tableStart < 0) {
      throw new Error("Could not locate upstream sources table in ATTRIBUTION.md.");
    }

    const lines = attributionDocument.slice(tableStart).split(/\r?\n/gu);
    const sourceNamesFromTable: string[] = [];

    for (const line of lines) {
      if (!line.startsWith("|")) {
        break;
      }

      if (line.startsWith("| Source |") || line.startsWith("|---")) {
        continue;
      }

      const columns = line
        .split("|")
        .slice(1, -1)
        .map((column: string) => column.trim());
      if (columns.length >= 1 && columns[0].length > 0) {
        sourceNamesFromTable.push(columns[0]);
      }
    }

    expect(UPSTREAM_SOURCES.map((entry) => entry.name)).toEqual(sourceNamesFromTable);
  });

  test("keeps all six cite-only Bible versions for spelling checks", () => {
    expect(CITE_ONLY_BIBLE_VERSIONS).toEqual([
      "NIV (Biblica)",
      "ESV (Crossway)",
      "NLT (Tyndale House Foundation)",
      "KJV",
      "NKJV (Thomas Nelson)",
      "CSB (Holman Bible Publishers)"
    ]);
  });
});
