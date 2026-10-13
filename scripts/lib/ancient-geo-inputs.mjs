// Inputs and cache for `npm run build:ancient-geo`. Every upstream file is downloaded from a URL pinned
// to a commit and checked against the SHA-256 of the bytes the committed data/geo/ files were built from,
// so a rebuild either reproduces them or stops. The OpenStreetMap rivers are a committed file instead
// (data/geo/sources/osm-waterways.geojson; see scripts/lib/osm-waterways.mjs).
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { unzipSync } from "fflate";

export const AWMC_COMMIT = "7ecf8bccea2efe1e1e9df2daf6001942de73fb87";
export const NATURAL_EARTH_COMMIT = "ca96624a56bd078437bca8184e78163e5039ad19";
const AWMC_BASE_URL = `https://raw.githubusercontent.com/AWMC/geodata/${AWMC_COMMIT}`;
const NATURAL_EARTH_BASE_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NATURAL_EARTH_COMMIT}`;

const awmc = (upstreamPath, file, sha256) => ({ file, upstreamPath, url: `${AWMC_BASE_URL}/${upstreamPath.split("/").map(encodeURIComponent).join("/")}`, sha256 });
const naturalEarth = (upstreamPath, file, sha256) => ({ file, upstreamPath, url: `${NATURAL_EARTH_BASE_URL}/${upstreamPath}`, sha256 });

// AWMC geodata (ODbL 1.0) and Natural Earth (public domain). `upstreamPath` is the path cited in
// provenance; `file` is the name in the cache.
export const ANCIENT_GEO_INPUTS = Object.freeze({
  awmcCulturalShapefiles: awmc("Cultural Shapefiles Apr 2024.zip", "awmc-cultural-shapefiles.zip", "ae209bd54b2cea712881e75b88f4957f11eee8ae846fd4d7dbe3fe50a7681bc8"),
  awmcCoastlineShapefile: awmc("Physical Data/shoreline/coastline.zip", "awmc-coastline.zip", "a6257500d99051072de3bb4348e8af8cb5deb98bf2d18a87659751e4c4ae6d6a"),
  awmcShoreline: awmc("Physical Data/shoreline/shoreline.geojson", "awmc-shoreline.geojson", "1497761447e0c11d01f50d3795647494d554b7d492b2f9ca64385d5da2a69212"),
  awmcRoads: awmc("Cultural-Data/roads/roads.geojson", "awmc-roads.geojson", "d28e5a1675a59df0037a84e6a8dc5f6b8efc75dbbd74a76ace59dd8285604516"),
  awmcAd200Provinces: awmc("Cultural-Data/political_shading/roman_empire_ce_200_provinces/roman_empire_ce_200_provinces.geojson", "awmc-ad200-provinces.geojson", "62789827619f774997aa494c0f3b0b985e761b0308786e02bcc35e5644bab11b"),
  awmcAd117Extent: awmc("Cultural-Data/political_shading/roman_empire_ce_117_extent/roman_empire_ce_117_extent.geojson", "awmc-ad117-extent.geojson", "1ddd9ac15006e8b9ffd4d185d0302295c3d7c321e9bc8ae3fd627e12d128ba29"),
  awmcAd200Extent: awmc("Cultural-Data/political_shading/roman_empire_ce_200_extent/roman_empire_ce_200_extent.geojson", "awmc-ad200-extent.geojson", "b1517aa96d43547925985069f8beefa761c361cad5986d35c7d607e86821527d"),
  awmc60BceExtent: awmc("Cultural-Data/political_shading/roman_empire_bce_60/roman_empire_bce_60.geojson", "awmc-60bce-extent.geojson", "e940ea2facff6163e02ab969d30b26f729c27e1e99db6eee655f7ebc8ac286d3"),
  awmcSenatorialProvinces: awmc("Cultural-Data/political_shading/senatorial_province/roman_senatorial_provinces.geojson", "awmc-senatorial-provinces.geojson", "ce96241d22e3d731b5b23a60cd05e636d0c96e87b6007b55ae6bb9e96523c8a1"),
  awmcHerodsKingdom: awmc("Cultural-Data/political_shading/herod/herods_kingdom.geojson", "awmc-herods-kingdom.geojson", "98dfe0590206677ce4984a3c95dae805412b83eef7545c959ba9d0681dd65c31"),
  naturalEarthLand: naturalEarth("geojson/ne_10m_land.geojson", "ne-10m-land.geojson", "1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416"),
  naturalEarthCoastline: naturalEarth("geojson/ne_10m_coastline.geojson", "ne-10m-coastline.geojson", "6f75ae0e0de157b14946e2255eb1f5486d9a13819032e26d4610852d296788f6"),
  naturalEarthLakes: naturalEarth("geojson/ne_10m_lakes.geojson", "ne-10m-lakes.geojson", "2d036f53dedec578001c5c30c2959ee7d4eebc1306900fa4367c49929ec8f2d9")
});

// The cache folder: `inputs/` keeps the checked downloads between runs, `work/` holds intermediates and
// is emptied at the start of every run, and `report/` holds the composition report and its previews.
// ANCIENT_GEO_CACHE moves it; by default it lies in the system temp folder.
export function ancientGeoCache(root = process.env.ANCIENT_GEO_CACHE || path.join(os.tmpdir(), "ibm-ancient-geo")) {
  const resolved = path.resolve(root);
  return {
    root: resolved,
    inputs: path.join(resolved, "inputs"),
    work: path.join(resolved, "work"),
    report: path.join(resolved, "report"),
    previews: path.join(resolved, "report", "previews")
  };
}

export async function sha256OfFile(filePath) {
  return crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

// Returns the cached copy of an input, downloading it first when it is missing or its bytes are not the
// pinned ones. A download whose SHA-256 differs from the pinned value stops the build.
export async function fetchPinnedInput(input, directory, { fetchImpl = fetch } = {}) {
  const target = path.join(directory, input.file);
  const cached = await sha256OfFile(target).catch(() => null);
  if (cached === input.sha256) return target;
  const response = await fetchImpl(input.url);
  if (!response.ok) throw new Error(`Download failed: ${input.url}: ${response.status} ${response.statusText}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = crypto.createHash("sha256").update(bytes).digest("hex");
  if (actual !== input.sha256) throw new Error(`${input.url} has SHA-256 ${actual}, not the pinned ${input.sha256}`);
  await fs.mkdir(directory, { recursive: true });
  const partial = `${target}.part`;
  await fs.writeFile(partial, bytes);
  await fs.rename(partial, target);
  return target;
}

// Every input in ANCIENT_GEO_INPUTS, by key, as checked files in `directory`.
export async function fetchPinnedInputs(directory, options = {}) {
  const entries = await Promise.all(Object.entries(ANCIENT_GEO_INPUTS).map(async ([key, input]) => [key, await fetchPinnedInput(input, directory, options)]));
  return Object.fromEntries(entries);
}

// Unpacks a zip archive into an empty folder. Entry names may not leave it.
export async function extractZip(zipPath, destinationDirectory) {
  const destination = path.resolve(destinationDirectory);
  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(destination, { recursive: true });
  for (const [name, bytes] of Object.entries(unzipSync(new Uint8Array(await fs.readFile(zipPath))))) {
    if (name.endsWith("/")) continue;
    const target = path.resolve(destination, name);
    if (!target.startsWith(`${destination}${path.sep}`)) throw new Error(`Zip entry ${name} lies outside ${destination}`);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  }
  return destination;
}

// JSON from a file, without a byte-order mark if the source has one.
export async function readJsonFile(filePath) {
  return JSON.parse((await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/, ""));
}
