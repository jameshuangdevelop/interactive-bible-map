import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const defaultOutputRoot = "/tmp/m5-22-basemap-fixture";

const odblTextUrl = "https://opendatacommons.org/licenses/odbl/odbl-10.txt";
const notoOflTextUrl =
  "https://raw.githubusercontent.com/versatiles-org/versatiles-fonts/main/fonts/Noto%20Sans/LICENSE";

const releaseNotesLicenceBlock = `**Licences.** This archive is not covered by the repository's MIT licence or by the project's CC BY-SA 4.0 data licence. Each part keeps its own licence:

- **OpenStreetMap data (all vector tiles):** Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [Open Database License 1.0 (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/). The tiles are an unmodified extract of the tilesets that OpenFreeMap and VersaTiles publish, and this archive holds the whole extract. The full tilesets: [OpenFreeMap planet downloads](https://btrfs.openfreemap.com/files.txt) and [VersaTiles downloads](https://download.versatiles.org/).
- **OpenFreeMap tiles and TileJSON:** [OpenFreeMap](https://openfreemap.org) [© OpenMapTiles](https://www.openmaptiles.org/) Data from [OpenStreetMap](https://www.openstreetmap.org/copyright). OpenMapTiles schema © MapTiler.com & OpenMapTiles contributors: design [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), code [BSD 3-Clause](https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md). Low-zoom data from [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- **VersaTiles tiles:** [VersaTiles](https://versatiles.org) © OpenStreetMap contributors (ODbL 1.0), in the [Shortbread](https://shortbread-tiles.org/) schema (CC0 1.0). Land cover: © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), through VersaTiles' [Landcover Vectors](https://github.com/versatiles-org/landcover-vectors) (CC BY 4.0). Dataset: Zanaga, D., Van De Kerchove, R., Daems, D., De Keersmaecker, W., Brockmann, C., Kirches, G., Wevers, J., Cartus, O., Santoro, M., Fritz, S., Lesiv, M., Herold, M., Tsendbazar, N.E., Xu, P., Ramoino, F., Arino, O., 2022. ESA WorldCover 10 m 2021 v200. https://doi.org/10.5281/zenodo.7254221
- **Label glyphs:** Noto Sans, under the [SIL Open Font License 1.1](https://openfontlicense.org/). The copyright notices and the licence text are in \`LICENSES/OFL-1.1-Noto-Sans.txt\`.
- **Icons:** OpenFreeMap's \`ofm_f384\` sprite ([openfreemap-styles](https://github.com/hyperknot/openfreemap-styles), MIT; icons from the Liberty and OSM Bright styles, BSD 3-Clause and CC BY 3.0/4.0; [Maki](https://github.com/mapbox/maki), CC0 1.0). Full notices are in \`LICENSES/OpenFreeMap-sprite.txt\`. VersaTiles' \`base\` sprite ([versatiles-style](https://github.com/versatiles-org/versatiles-style)), CC0 1.0.

The licensors provide this material as is, without warranty. See each licence.
`;

function currentDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseArg(flagName) {
  const prefixed = `--${flagName}=`;
  for (const argument of process.argv.slice(2)) {
    if (argument.startsWith(prefixed)) {
      return argument.slice(prefixed.length);
    }
  }
  return null;
}

function runTarCreate(cwd, outputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("tar", ["-cf", outputPath, "."], {
      cwd,
      stdio: ["ignore", "ignore", "pipe"]
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`tar create failed: ${stderr.trim() || `exit ${code}`}`));
    });
  });
}

async function sha256File(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function listFilesRecursively(rootDirectory) {
  const pending = [rootDirectory];
  const files = [];
  while (pending.length > 0) {
    const current = pending.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  files.sort((left, right) => left.localeCompare(right));
  return files;
}

function readOpenFreeMapPlanetVersion(manifest) {
  for (const entry of manifest.entries ?? []) {
    if (typeof entry.url !== "string") {
      continue;
    }
    if (!entry.url.includes("tiles.openfreemap.org/planet/")) {
      continue;
    }
    const match = entry.url.match(/\/planet\/([^/]+)\//u);
    if (match) {
      return match[1];
    }
  }
  return "unresolved";
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export function summarizeFixtureManifest(manifest) {
  const summary = {
    totalResponses: 0,
    openFreeMap: {
      vectorTiles: 0,
      tilejson: 0,
      glyphRanges: 0,
      spriteFiles: 0,
      reliefTiles: 0
    },
    versaTiles: {
      vectorTiles: 0,
      glyphRanges: 0,
      spriteFiles: 0,
      notFoundResponses: 0
    }
  };

  for (const entry of manifest.entries ?? []) {
    if (typeof entry?.url !== "string") {
      continue;
    }
    summary.totalResponses += 1;
    const parsed = new URL(entry.url);
    const status = Number(entry.status);
    if (parsed.hostname === "tiles.openfreemap.org") {
      if (/^\/planet\/[^/]+\/\d+\/\d+\/\d+\.pbf$/u.test(parsed.pathname)) {
        summary.openFreeMap.vectorTiles += 1;
      } else if (
        parsed.pathname === "/planet" ||
        /^\/planet\/[^/]+\/tiles\.json$/u.test(parsed.pathname)
      ) {
        summary.openFreeMap.tilejson += 1;
      } else if (/^\/fonts\/[^/]+\/\d+-\d+\.pbf$/u.test(parsed.pathname)) {
        summary.openFreeMap.glyphRanges += 1;
      } else if (/^\/sprites\/[^/]+\/[^/]+\.(?:json|png)$/u.test(parsed.pathname)) {
        summary.openFreeMap.spriteFiles += 1;
      } else if (/^\/natural_earth\/ne2sr\/\d+\/\d+\/\d+\.png$/u.test(parsed.pathname)) {
        summary.openFreeMap.reliefTiles += 1;
      }
      continue;
    }

    if (parsed.hostname === "tiles.versatiles.org") {
      if (/^\/tiles\/osm\/\d+\/\d+\/\d+$/u.test(parsed.pathname)) {
        summary.versaTiles.vectorTiles += 1;
      } else if (/^\/assets\/glyphs\/[^/]+\/\d+-\d+\.pbf$/u.test(parsed.pathname)) {
        summary.versaTiles.glyphRanges += 1;
      } else if (/^\/assets\/sprites\/[^/]+\.(?:json|png)$/u.test(parsed.pathname)) {
        summary.versaTiles.spriteFiles += 1;
      }
      if (status === 404) {
        summary.versaTiles.notFoundResponses += 1;
      }
    }
  }

  return summary;
}

function buildSourceSummaryLines({ planetVersion, reliefTileCount }) {
  const reliefSuffix =
    reliefTileCount > 0
      ? ` This archive includes ${reliefTileCount} relief tile${reliefTileCount === 1 ? "" : "s"}.`
      : " This archive holds no relief tiles.";
  return {
    openFreeMap:
      `nothing was fetched from OpenFreeMap's public tile service (tiles.openfreemap.org). The vector tiles were read from OpenFreeMap's public planet download for that build (https://btrfs.openfreemap.com/areas/planet/${planetVersion}/tiles.pmtiles). This project's recorder built the TileJSON from the same file's metadata, with its attribution and layer list unchanged. The label glyphs come from maplibre/demotiles (https://github.com/maplibre/demotiles) and the \`ofm_f384\` sprite from hyperknot/openfreemap-styles (https://github.com/hyperknot/openfreemap-styles). They are the same files OpenFreeMap serves.${reliefSuffix}`,
    versaTiles: "recorded from https://tiles.versatiles.org.",
    storage:
      "Apart from that TileJSON, each response body is stored unmodified, as received from the sources above, and compressed with gzip."
  };
}

function countNoun(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatOpenFreeMapContentLine(summary) {
  const parts = [
    countNoun(summary.openFreeMap.vectorTiles, "vector tile"),
    summary.openFreeMap.tilejson === 1 ? "the TileJSON" : `${summary.openFreeMap.tilejson} TileJSON files`,
    countNoun(summary.openFreeMap.glyphRanges, "glyph range"),
    countNoun(summary.openFreeMap.spriteFiles, "sprite file")
  ];
  if (summary.openFreeMap.reliefTiles > 0) {
    parts.push(countNoun(summary.openFreeMap.reliefTiles, "relief tile"));
  }
  return parts.join(", ");
}

export function buildNoticeMarkdown({ date, planetVersion, reliefTileCount }) {
  const sourceLines = buildSourceSummaryLines({ planetVersion, reliefTileCount });
  return `# Notice: recorded basemap responses (test fixture)

This archive is a test fixture of Interactive Bible Map (https://github.com/jameshuangdevelop/interactive-bible-map). It holds the basemap responses that the project's browser tests replay, so the tests don't need the network. It is not part of the app.

Recorded: ${date}. OpenFreeMap planet build: ${planetVersion}.
OpenFreeMap files: ${sourceLines.openFreeMap}
VersaTiles files: ${sourceLines.versaTiles}

\`manifest.json\` lists each URL and the file in \`responses/\` that holds its body. ${sourceLines.storage} This project wrote \`manifest.json\`; it holds only URLs, HTTP headers and file names.

This archive is not covered by the project's MIT licence or its CC BY-SA 4.0 data licence. Each part keeps its own licence, listed below by URL. Nothing here adds any condition to those licences.

## Vector tiles: OpenStreetMap data
URLs starting with https://tiles.openfreemap.org/planet/ or https://tiles.versatiles.org/tiles/osm/

Map data © OpenStreetMap contributors (https://www.openstreetmap.org/copyright).
It is available under the Open Database License 1.0 (ODbL): https://opendatacommons.org/licenses/odbl/1-0/ (a copy is in LICENSES/ODbL-1.0.txt).
These tiles are an unmodified extract of the tilesets that OpenFreeMap and VersaTiles publish. This archive holds the whole extract. The full tilesets: https://btrfs.openfreemap.com/files.txt (OpenFreeMap planet downloads) and https://download.versatiles.org/ (VersaTiles).

## OpenFreeMap tiles and TileJSON
URLs starting with https://tiles.openfreemap.org/planet

OpenFreeMap (https://openfreemap.org) © OpenMapTiles (https://www.openmaptiles.org/) Data from OpenStreetMap (https://www.openstreetmap.org/copyright)

The tiles use the OpenMapTiles schema, © MapTiler.com & OpenMapTiles contributors (https://openmaptiles.org/). Schema design: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Schema code: BSD 3-Clause (https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md). The low zoom levels also hold Natural Earth data (public domain). OpenFreeMap is MIT-licensed.

## VersaTiles tiles
URLs starting with https://tiles.versatiles.org/tiles/osm/

VersaTiles (https://versatiles.org) © OpenStreetMap contributors. Schema: Shortbread (https://shortbread-tiles.org/), CC0 1.0.

Land cover: © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium. Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). It reaches these tiles through VersaTiles' Landcover Vectors (https://github.com/versatiles-org/landcover-vectors), which are derived from ESA WorldCover and also licensed CC BY 4.0. This project has not modified them.
Dataset: Zanaga, D., Van De Kerchove, R., Daems, D., De Keersmaecker, W., Brockmann, C., Kirches, G., Wevers, J., Cartus, O., Santoro, M., Fritz, S., Lesiv, M., Herold, M., Tsendbazar, N.E., Xu, P., Ramoino, F., Arino, O., 2022. ESA WorldCover 10 m 2021 v200. https://doi.org/10.5281/zenodo.7254221

## Label glyphs: Noto Sans
URLs starting with https://tiles.openfreemap.org/fonts/ or https://tiles.versatiles.org/assets/glyphs/

Glyphs converted from the Noto Sans fonts: OpenFreeMap's by maplibre/demotiles (https://github.com/maplibre/demotiles), and VersaTiles' by VersaTiles Fonts (https://github.com/versatiles-org/versatiles-fonts). Licence: SIL Open Font License 1.1. The copyright notices and the full licence are in LICENSES/OFL-1.1-Noto-Sans.txt.

## Icon sprites
URLs starting with https://tiles.openfreemap.org/sprites/ofm_f384/: OpenFreeMap's sprite (https://github.com/hyperknot/openfreemap-styles), MIT, © 2023 Zsolt Ero. It is built from icons of the Liberty and OSM Bright styles (code BSD 3-Clause, © 2014 Mapbox and © 2016 KlokanTech.com & OpenMapTiles contributors; design CC BY 3.0 and CC BY 4.0), from Maki icons (CC0 1.0) and from a public-domain arrow (https://commons.wikimedia.org/wiki/File:Arrowright.svg). The full notices are in LICENSES/OpenFreeMap-sprite.txt.

URLs starting with https://tiles.versatiles.org/assets/sprites/: VersaTiles' sprite (https://github.com/versatiles-org/versatiles-style), CC0 1.0.

## Relief tiles
URLs starting with https://tiles.openfreemap.org/natural_earth/ne2sr/: Natural Earth II shaded relief (https://www.naturalearthdata.com/), public domain. The tiles come from https://github.com/lukasmartinelli/naturalearthtiles, released under the PDDL 1.0. Made with Natural Earth.

## No warranty
The licensors provide all of this as is, without warranty. See the disclaimers in each licence.
`;
}

function buildOflNotoFile(oflBody) {
  return `Noto Sans glyphs in this archive (converted to map glyphs by maplibre/demotiles for OpenFreeMap, and by VersaTiles Fonts for VersaTiles):
Copyright 2012 Google Inc. All Rights Reserved.
Copyright 2022 The Noto Project Authors (https://github.com/notofonts/latin-greek-cyrillic)
Noto is a trademark of Google LLC.

This Font Software is licensed under the SIL Open Font License, Version 1.1.

${oflBody.trim()}
`;
}

function buildSpriteNoticesText(libertyLicenseText) {
  const separator = "\n-----\n";
  const separatorIndex = libertyLicenseText.indexOf(separator);
  const noticesBody =
    separatorIndex === -1
      ? libertyLicenseText.trim()
      : libertyLicenseText.slice(separatorIndex + separator.length).trimStart();
  return `Notices for the OpenFreeMap sprite ofm_f384 (https://github.com/hyperknot/openfreemap-styles/tree/main/sprites/sprites/ofm_f384), copied unchanged from the upstream licence files.

${noticesBody}
`;
}

export function buildReleaseNotesMarkdown({
  date,
  tag,
  archiveName,
  sha256,
  bytes,
  files,
  planetVersion,
  summary
}) {
  const sourceLines = buildSourceSummaryLines({
    planetVersion,
    reliefTileCount: summary.openFreeMap.reliefTiles
  });
  return `<!-- Release metadata -->
<!-- tag: ${tag} -->
<!-- asset: ${archiveName} -->
<!-- sha256: ${sha256} -->
<!-- bytes: ${bytes} -->
<!-- files: ${files} -->

**Test fixture, not an app release.** This archive holds the basemap responses that the browser tests of Interactive Bible Map replay, so the tests don't depend on the network. It is not part of the app and is never deployed with it.

- File: \`${archiveName}\` · SHA-256 \`${sha256}\` · ${bytes} bytes · ${files} files
- Recorded: ${date}. OpenFreeMap planet build: \`${planetVersion}\`.
- Contents: ${countNoun(summary.totalResponses, "response")}. From OpenFreeMap: ${formatOpenFreeMapContentLine(summary)}. From VersaTiles: ${countNoun(summary.versaTiles.vectorTiles, "vector tile")}, ${countNoun(summary.versaTiles.glyphRanges, "glyph range")}, ${countNoun(summary.versaTiles.spriteFiles, "sprite file")} and ${countNoun(summary.versaTiles.notFoundResponses, '"not found" (404) reply')}.
- OpenFreeMap files: ${sourceLines.openFreeMap}
- VersaTiles files: ${sourceLines.versaTiles}
- ${sourceLines.storage} \`manifest.json\` maps each URL to its file. \`NOTICE.md\` and the \`LICENSES/\` folder inside the archive give the full notices.

${releaseNotesLicenceBlock}`;
}

async function writeReleaseNotesDraft({
  outputRoot,
  date,
  tag,
  archiveName,
  sha256,
  bytes,
  files,
  planetVersion,
  summary
}) {
  const releaseNotesPath = path.join(outputRoot, `${archiveName.replace(/\.tar$/u, "")}-release-notes.md`);
  const contents = buildReleaseNotesMarkdown({
    date,
    tag,
    archiveName,
    sha256,
    bytes,
    files,
    planetVersion,
    summary
  });
  await fs.writeFile(releaseNotesPath, `${contents}\n`);
  return releaseNotesPath;
}

export async function run() {
  const date = process.env.IBM_BASEMAP_FIXTURE_DATE?.trim() || currentDateString();
  const inputDirectory =
    parseArg("input-dir") || path.join(defaultOutputRoot, `store-${date}`);
  const outputRoot = parseArg("output-dir") || defaultOutputRoot;
  const archiveName = `basemap-fixture-${date}.tar`;
  const archivePath = path.resolve(outputRoot, archiveName);
  const absoluteInputDirectory = path.resolve(inputDirectory);

  await fs.access(path.join(absoluteInputDirectory, "manifest.json"));
  await fs.mkdir(path.resolve(outputRoot), { recursive: true });
  const stagingDirectory = path.join(
    outputRoot,
    `.pack-staging-${date}-${process.pid}-${Date.now()}`
  );
  await fs.rm(stagingDirectory, { recursive: true, force: true });
  await fs.cp(absoluteInputDirectory, stagingDirectory, { recursive: true });

  const manifest = JSON.parse(
    await fs.readFile(path.join(stagingDirectory, "manifest.json"), "utf8")
  );
  const planetVersion = readOpenFreeMapPlanetVersion(manifest);
  const summary = summarizeFixtureManifest(manifest);

  await fs.mkdir(path.join(stagingDirectory, "LICENSES"), { recursive: true });
  await fs.writeFile(
    path.join(stagingDirectory, "NOTICE.md"),
    buildNoticeMarkdown({
      date,
      planetVersion,
      reliefTileCount: summary.openFreeMap.reliefTiles
    })
  );
  const oflText = await fetchText(notoOflTextUrl);
  await fs.writeFile(
    path.join(stagingDirectory, "LICENSES", "OFL-1.1-Noto-Sans.txt"),
    buildOflNotoFile(oflText)
  );
  const libertyLicenseText = await fs.readFile(
    path.join(repositoryRoot, "app", "public", "styles", "liberty", "LICENSE.txt"),
    "utf8"
  );
  await fs.writeFile(
    path.join(stagingDirectory, "LICENSES", "OpenFreeMap-sprite.txt"),
    buildSpriteNoticesText(libertyLicenseText)
  );
  await fs.writeFile(
    path.join(stagingDirectory, "LICENSES", "ODbL-1.0.txt"),
    await fetchText(odblTextUrl)
  );

  const stagedManifest = {
    ...manifest,
    metadata: {
      ...(manifest.metadata ?? {}),
      notice: "NOTICE.md"
    }
  };
  await fs.writeFile(
    path.join(stagingDirectory, "manifest.json"),
    `${JSON.stringify(stagedManifest, null, 2)}\n`
  );

  await fs.rm(archivePath, { force: true });
  await runTarCreate(stagingDirectory, archivePath);

  const archiveStats = await fs.stat(archivePath);
  const archiveSha256 = await sha256File(archivePath);
  const allFiles = await listFilesRecursively(stagingDirectory);
  const tag = `test-fixture-basemap-${date}`;

  const releaseNotesDraftPath = await writeReleaseNotesDraft({
    outputRoot: path.resolve(outputRoot),
    date,
    tag,
    archiveName,
    sha256: archiveSha256,
    bytes: archiveStats.size,
    files: allFiles.length,
    planetVersion,
    summary
  });

  console.log(`Archive: ${archivePath}`);
  console.log(`SHA-256: ${archiveSha256}`);
  console.log(`Bytes: ${archiveStats.size}`);
  console.log(`Files: ${allFiles.length}`);
  console.log(`Recorded at: ${manifest.metadata?.generatedAt ?? "unknown"}`);
  console.log(`OpenFreeMap planet version: ${planetVersion}`);
  console.log(`Release notes draft: ${releaseNotesDraftPath}`);
  console.log("");
  console.log("Run this command after fact-check sign-off (PO only):");
  console.log(
    `gh release create ${tag} "${archivePath}" --repo jameshuangdevelop/interactive-bible-map --title "Test fixture: recorded basemap responses, ${date} (not an app release)" --notes-file "${releaseNotesDraftPath}" --prerelease`
  );
  console.log("");
  console.log("Suggested lock file payload:");
  console.log(
    JSON.stringify(
      {
        repo: "jameshuangdevelop/interactive-bible-map",
        tag,
        asset: archiveName,
        sha256: archiveSha256,
        bytes: archiveStats.size,
        files: allFiles.length,
        recordedAt: manifest.metadata?.generatedAt ?? null,
        upstream: {
          openfreemapPlanetVersion: planetVersion,
          versatiles:
            "Recorded from tiles.versatiles.org (demo server), including landcover attribution obligations."
        }
      },
      null,
      2
    )
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
