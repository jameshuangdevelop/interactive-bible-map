// PNG previews of the routes' lines for the build report, drawn in Web Mercator with equal scaling
// on both axes, as the map draws them, with Natural Earth's land and lakes filled, so a line that
// crosses land or water shows. They are written to the build's cache, outside the repository.

import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { toMercator } from "./route-line-surface.mjs";

// Web Mercator metres per pixel at zoom z (256-pixel tiles).
export function metresPerPixelAtZoom(zoom) {
  return (2 * Math.PI * 6378137) / (256 * 2 ** zoom);
}

function ringPath(ring, project, box) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let index = 0; index < ring.xs.length; index += 1) {
    minX = Math.min(minX, ring.xs[index]);
    maxX = Math.max(maxX, ring.xs[index]);
    minY = Math.min(minY, ring.ys[index]);
    maxY = Math.max(maxY, ring.ys[index]);
  }
  if (maxX < box.minX || minX > box.maxX || maxY < box.minY || minY > box.maxY) return "";
  const parts = [];
  for (let index = 0; index < ring.xs.length; index += 1) {
    const [x, y] = project(ring.xs[index], ring.ys[index]);
    parts.push(`${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `${parts.join("")}Z`;
}

const STYLE = {
  sea: { color: "#1A73E8", dash: "10 6" },
  land: { color: "#1A73E8", dash: null },
  unknown: { color: "#5f6368", dash: "2 5" }
};

// `extent` is { minLon, minLat, maxLon, maxLat }; the image is drawn at `zoom` (Web Mercator),
// scaled by `pixelRatio`. Lines are { coordinates, mode }, stops [lon, lat] points.
export async function writePreviewPng({ filePath, model, extent, zoom, pixelRatio = 2, lines, stops = [], title }) {
  const [minX, minY] = toMercator([extent.minLon, extent.minLat]);
  const [maxX, maxY] = toMercator([extent.maxLon, extent.maxLat]);
  const scale = pixelRatio / metresPerPixelAtZoom(zoom);
  const width = Math.max(1, Math.round((maxX - minX) * scale));
  const height = Math.max(1, Math.round((maxY - minY) * scale));
  const project = (x, y) => [(x - minX) * scale, (maxY - y) * scale];
  const box = { minX, minY, maxX, maxY };
  const landPaths = model.rings.filter((ring) => ring.surfaceKind === "land").map((ring) => ringPath(ring, project, box)).join("");
  const lakePaths = model.rings.filter((ring) => ring.surfaceKind === "lake").map((ring) => ringPath(ring, project, box)).join("");
  const linePaths = lines.map(({ coordinates, mode }) => {
    const style = STYLE[mode] ?? STYLE.unknown;
    const d = coordinates
      .map((coordinate, index) => {
        const [x, y] = project(...toMercator(coordinate));
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join("");
    const width = 2 * pixelRatio;
    return `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="${width + 2 * pixelRatio}" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="${style.color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${style.dash ? ` stroke-dasharray="${style.dash}"` : ""}/>`;
  }).join("");
  const stopMarks = stops
    .map((coordinate) => {
      const [x, y] = project(...toMercator(coordinate));
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${2.5 * pixelRatio}" fill="#ffffff" stroke="#202124" stroke-width="${pixelRatio}"/>`;
    })
    .join("");
  const label = title
    ? `<text x="${8 * pixelRatio}" y="${18 * pixelRatio}" font-family="sans-serif" font-size="${12 * pixelRatio}" fill="#202124">${title}</text>`
    : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="#aad3df"/>` +
    `<path d="${landPaths}" fill="#f2efe9" fill-rule="evenodd" stroke="#9e9a8f" stroke-width="0.6"/>` +
    `<path d="${lakePaths}" fill="#aad3df" fill-rule="evenodd" stroke="#7fa7bd" stroke-width="0.6"/>` +
    `${linePaths}${stopMarks}${label}</svg>`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await sharp(Buffer.from(svg), { limitInputPixels: false }).png().toFile(filePath);
  return { filePath, width, height, zoom, pixelRatio };
}

// The zoom at which an extent fits in `maxPixels` (at pixel ratio 1), at most `maxZoom`.
export function zoomToFit(extent, maxPixels, maxZoom = 9) {
  const [minX, minY] = toMercator([extent.minLon, extent.minLat]);
  const [maxX, maxY] = toMercator([extent.maxLon, extent.maxLat]);
  const span = Math.max(maxX - minX, maxY - minY);
  return Math.min(maxZoom, Math.log2((2 * Math.PI * 6378137 * maxPixels) / (256 * span)));
}
