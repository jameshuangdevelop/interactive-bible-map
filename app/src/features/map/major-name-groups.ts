import type { Feature, FeatureCollection, Point } from "geojson";

import type { PinFeature, PinFeatureProperties } from "./map-render-data";
import type { Coordinates } from "./types";

// Major places' names are grouped where they would overlap (ADR-0043 item 5): for each whole zoom,
// names are measured as MapLibre will draw them, centred on their points, and a name that would
// touch a more important one joins its group ("Jerusalem +4"). The selected place comes first, so
// its name always shows (ADR-0035 item 4). Points only move apart as the map zooms in while names
// keep their size, so a zoom's groups also fit until the next whole zoom.

export const MAJOR_NAME_FONT_SIZE_PX = 13;
export const MAJOR_SELECTED_NAME_FONT_SIZE_PX = 15;
// A selected place with several candidates has its name just above its first candidate's dot.
export const MAJOR_SELECTED_NAME_RAISE_EM = 0.45;
export const MAJOR_NAME_MAX_WIDTH_EM = 10;
export const MAJOR_GROUP_NAME_MAX_WIDTH_EM = 30;
export const MAJOR_NAME_MAX_BAND = 16;

const GLYPH_EM = 24;
const LINE_HEIGHT_EM = 1.2;
// MapLibre's default text-padding, plus 1 px so rounding never lets two names touch.
const BOX_PADDING_PX = 3;

// Advances of Noto Sans Bold at MapLibre's 24 px glyph size, read from OpenFreeMap's
// "Noto Sans Bold/0-255.pbf". Regular is narrower, so these are safe for every major's name.
const ASCII_ADVANCES = [
  6, 6, 11, 15, 13, 21, 18, 6, 8, 8, 13, 13, 6, 7, 6, 9, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 6,
  6, 13, 13, 13, 11, 21, 16, 16, 15, 17, 13, 13, 17, 18, 9, 7, 15, 13, 22, 19, 19, 15, 19, 15, 13,
  13, 18, 15, 23, 16, 14, 13, 7, 9, 7, 13, 9, 14, 14, 15, 12, 15, 14, 9, 15, 15, 7, 7, 14, 7, 23,
  15, 14, 15, 15, 10, 11, 10, 15, 13, 20, 13, 13, 11, 9, 13, 9, 13
];
const LATIN1_LETTER_ADVANCES = [
  16, 16, 16, 16, 16, 16, 22, 15, 13, 13, 13, 13, 9, 9, 9, 9, 17, 19, 19, 19, 19, 19, 19, 13, 19,
  18, 18, 18, 18, 14, 15, 17, 14, 14, 14, 14, 14, 14, 22, 12, 14, 14, 14, 14, 7, 7, 7, 7, 14, 15,
  14, 14, 14, 14, 14, 13, 14, 15, 15, 15, 15, 13, 15, 13
];
// The widest glyph in the font, so a character outside the tables is never under-measured.
const FALLBACK_ADVANCE = 23;

// MapLibre's line-breaking rules for Latin text (src/symbol/shaping.ts in MapLibre GL JS 6.10).
const WHITESPACE_CODE_POINTS = new Set([0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20]);
const BREAKABLE_CODE_POINTS = new Set([
  0x0a, 0x0d, 0x20, 0x26, 0x29, 0x2b, 0x2d, 0x2f, 0xad, 0xb7, 0x200b, 0x2010, 0x2013, 0x2027
]);
const BREAKABLE_BEFORE_CODE_POINTS = new Set([0x28]);

function glyphAdvance(codePoint: number) {
  if (codePoint >= 32 && codePoint <= 126) {
    return ASCII_ADVANCES[codePoint - 32];
  }

  if (codePoint >= 192 && codePoint <= 255) {
    return LATIN1_LETTER_ADVANCES[codePoint - 192];
  }

  return FALLBACK_ADVANCE;
}

interface LineBreak {
  index: number;
  x: number;
  priorBreak: LineBreak | null;
  badness: number;
}

function lineBadness(lineWidth: number, targetWidth: number, penalty: number, isLastBreak: boolean) {
  const raggedness = (lineWidth - targetWidth) ** 2;
  if (isLastBreak) {
    return lineWidth < targetWidth ? raggedness / 2 : raggedness * 2;
  }

  return raggedness + Math.abs(penalty) * penalty;
}

function evaluateBreak(
  index: number,
  x: number,
  targetWidth: number,
  potentialBreaks: LineBreak[],
  penalty: number,
  isLastBreak: boolean
): LineBreak {
  let priorBreak: LineBreak | null = null;
  let badness = lineBadness(x, targetWidth, penalty, isLastBreak);
  for (const potentialBreak of potentialBreaks) {
    const breakBadness =
      lineBadness(x - potentialBreak.x, targetWidth, penalty, isLastBreak) + potentialBreak.badness;
    if (breakBadness <= badness) {
      priorBreak = potentialBreak;
      badness = breakBadness;
    }
  }

  return { index, x, priorBreak, badness };
}

/** Widths, in 24 px glyph units, of the lines MapLibre shapes a point label's text into. */
export function measureLabelLineWidths(text: string, maxWidthEm: number): number[] {
  const codePoints = Array.from(text).map((character) => character.codePointAt(0) ?? 0);
  if (codePoints.length === 0) {
    return [0];
  }

  const totalWidth = codePoints.reduce((sum, codePoint) => sum + glyphAdvance(codePoint), 0);
  const lineCount = Math.max(1, Math.ceil(totalWidth / (maxWidthEm * GLYPH_EM)));
  const targetWidth = totalWidth / lineCount;

  const potentialBreaks: LineBreak[] = [];
  let x = 0;
  for (let index = 0; index < codePoints.length; index += 1) {
    const codePoint = codePoints[index];
    if (!WHITESPACE_CODE_POINTS.has(codePoint)) {
      x += glyphAdvance(codePoint);
    }

    if (index < codePoints.length - 1) {
      const nextCodePoint = codePoints[index + 1];
      if (
        BREAKABLE_CODE_POINTS.has(codePoint) ||
        (index !== codePoints.length - 2 && BREAKABLE_BEFORE_CODE_POINTS.has(nextCodePoint))
      ) {
        let penalty = 0;
        if (codePoint === 0x0a || codePoint === 0x0d) {
          penalty -= 10_000;
        }
        if (codePoint === 0x28) {
          penalty += 50;
        }
        if (nextCodePoint === 0x29) {
          penalty += 50;
        }
        potentialBreaks.push(evaluateBreak(index + 1, x, targetWidth, potentialBreaks, penalty, false));
      }
    }
  }

  const breakIndices: number[] = [];
  for (
    let lineBreak: LineBreak | null = evaluateBreak(
      codePoints.length,
      x,
      targetWidth,
      potentialBreaks,
      0,
      true
    );
    lineBreak;
    lineBreak = lineBreak.priorBreak
  ) {
    breakIndices.unshift(lineBreak.index);
  }

  const widths: number[] = [];
  let lineStart = 0;
  for (const lineEnd of breakIndices) {
    const line = String.fromCodePoint(...codePoints.slice(lineStart, lineEnd)).trim();
    widths.push(
      Array.from(line).reduce((sum, character) => sum + glyphAdvance(character.codePointAt(0) ?? 0), 0)
    );
    lineStart = lineEnd;
  }

  return widths;
}

export interface LabelBoxSize {
  width: number;
  height: number;
}

/** The size, in pixels, of the collision box MapLibre gives a centred point label. */
export function measureLabelBox(
  text: string,
  fontSizePx: number = MAJOR_NAME_FONT_SIZE_PX,
  maxWidthEm: number = MAJOR_NAME_MAX_WIDTH_EM
): LabelBoxSize {
  const lineWidths = measureLabelLineWidths(text, maxWidthEm);
  const scale = fontSizePx / GLYPH_EM;
  return {
    width: Math.max(...lineWidths) * scale + BOX_PADDING_PX * 2,
    height: lineWidths.length * LINE_HEIGHT_EM * fontSizePx + BOX_PADDING_PX * 2
  };
}

export function majorGroupLabelText(topPlaceName: string, memberCount: number) {
  return `${topPlaceName} +${Math.max(0, memberCount - 1)}`;
}

/** Web Mercator pixel position at a zoom, for MapLibre's 512 px world tile. */
function projectToWorldPixels([longitude, latitude]: Coordinates, zoom: number) {
  const worldSize = 512 * 2 ** zoom;
  const sinLatitude = Math.sin((Math.max(-85.0511, Math.min(85.0511, latitude)) * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * worldSize
  };
}

export interface MajorNameInput {
  placeId: string;
  placeName: string;
  importanceRank: number;
  coordinates: Coordinates;
  selected?: boolean;
  hasMultipleCandidates?: boolean;
}

export interface MajorNameGroup {
  top: MajorNameInput;
  members: MajorNameInput[];
}

export interface MajorNameBox extends LabelBoxSize {
  /** How far the box's centre sits below the place's point, in pixels (negative is above). */
  centerOffsetY: number;
}

/** The box of a group's name, or of a lone place's name, as the map draws it at the top's point. */
export function measureMajorNameBox(group: MajorNameGroup): MajorNameBox {
  const fontSizePx = group.top.selected ? MAJOR_SELECTED_NAME_FONT_SIZE_PX : MAJOR_NAME_FONT_SIZE_PX;
  const box =
    group.members.length > 1
      ? measureLabelBox(
          majorGroupLabelText(group.top.placeName, group.members.length),
          fontSizePx,
          MAJOR_GROUP_NAME_MAX_WIDTH_EM
        )
      : measureLabelBox(group.top.placeName, fontSizePx);
  const raised = group.top.selected === true && group.top.hasMultipleCandidates === true;
  return {
    ...box,
    centerOffsetY: raised ? -(MAJOR_SELECTED_NAME_RAISE_EM * fontSizePx + box.height / 2) : 0
  };
}

interface PlacedGroup extends MajorNameGroup {
  x: number;
  y: number;
  box: MajorNameBox;
}

function boxesTouch(
  left: { x: number; y: number; box: MajorNameBox },
  right: { x: number; y: number; box: MajorNameBox }
) {
  return (
    Math.abs(left.x - right.x) <= (left.box.width + right.box.width) / 2 &&
    Math.abs(left.y + left.box.centerOffsetY - (right.y + right.box.centerOffsetY)) <=
      (left.box.height + right.box.height) / 2
  );
}

function compareForGrouping(left: MajorNameInput, right: MajorNameInput) {
  return (
    Number(right.selected === true) - Number(left.selected === true) ||
    left.importanceRank - right.importanceRank ||
    left.placeId.localeCompare(right.placeId)
  );
}

/** Groups major places so that no two of their names touch at `zoom`, the selected one first. */
export function groupMajorNamesAtZoom(majors: MajorNameInput[], zoom: number): MajorNameGroup[] {
  const ordered = [...majors].sort(compareForGrouping);
  const groups: PlacedGroup[] = [];

  for (const major of ordered) {
    const point = projectToWorldPixels(major.coordinates, zoom);
    const candidate = { ...point, box: measureMajorNameBox({ top: major, members: [major] }) };
    const host = groups.find((group) => boxesTouch(group, candidate));
    if (host) {
      host.members.push(major);
      host.box = measureMajorNameBox(host);
      continue;
    }

    groups.push({ top: major, members: [major], ...candidate });
  }

  // A group's name grows with its "+N", so merge groups until no two names touch.
  for (let merged = true; merged; ) {
    merged = false;
    for (let left = 0; left < groups.length && !merged; left += 1) {
      for (let right = left + 1; right < groups.length; right += 1) {
        if (boxesTouch(groups[left], groups[right])) {
          groups[left].members.push(...groups[right].members);
          groups.splice(right, 1);
          groups[left].box = measureMajorNameBox(groups[left]);
          merged = true;
          break;
        }
      }
    }
  }

  return groups.map(({ top, members }) => ({
    top,
    members: [...members].sort(compareForGrouping)
  }));
}

export interface MajorGroupFeatureProperties {
  cluster: true;
  cluster_id: number;
  point_count: number;
  minImportanceRank: number;
  topPlaceId: string;
  isSelectedPlace: boolean;
  hasMultipleCandidates: boolean;
  labelText: string;
  memberNames: string;
  memberPlaceIds: string;
  groupBand: number;
}

export type MajorSingleFeatureProperties = PinFeatureProperties & { groupBand: number };
export type MajorNameFeatureProperties = MajorGroupFeatureProperties | MajorSingleFeatureProperties;

/**
 * One feature per major name for every whole zoom from 0 to MAJOR_NAME_MAX_BAND: the places that
 * stand alone keep their own feature, and each group becomes one feature at its top place. Layers
 * show a band with `majorNameBandFilter`. Groups keep the property names of a MapLibre cluster.
 */
export function buildMajorNameFeatures(
  pins: PinFeature[]
): FeatureCollection<Point, MajorNameFeatureProperties> {
  const pinByPlaceId = new Map(pins.map((pin) => [pin.properties.placeId, pin]));
  const inputs: MajorNameInput[] = pins.map((pin) => ({
    placeId: pin.properties.placeId,
    placeName: pin.properties.placeName,
    importanceRank: pin.properties.importanceRank,
    coordinates: [pin.geometry.coordinates[0], pin.geometry.coordinates[1]],
    selected: pin.properties.isSelectedPlace === true,
    hasMultipleCandidates: pin.properties.hasMultipleCandidates === true
  }));

  const features: Feature<Point, MajorNameFeatureProperties>[] = [];
  for (let band = 0; band <= MAJOR_NAME_MAX_BAND; band += 1) {
    groupMajorNamesAtZoom(inputs, band).forEach((group, groupIndex) => {
      const topPin = pinByPlaceId.get(group.top.placeId);
      if (!topPin) {
        return;
      }

      if (group.members.length === 1) {
        features.push({
          type: "Feature",
          id: `${String(topPin.id ?? topPin.properties.placeId)}@${band}`,
          geometry: topPin.geometry,
          properties: { ...topPin.properties, groupBand: band }
        });
        return;
      }

      features.push({
        type: "Feature",
        id: `major-group:${band}:${group.top.placeId}`,
        geometry: topPin.geometry,
        properties: {
          cluster: true,
          cluster_id: band * 1_000 + groupIndex,
          point_count: group.members.length,
          minImportanceRank: group.top.importanceRank,
          topPlaceId: group.top.placeId,
          isSelectedPlace: group.top.selected === true,
          hasMultipleCandidates: group.top.hasMultipleCandidates === true,
          labelText: majorGroupLabelText(group.top.placeName, group.members.length),
          memberNames: group.members.map((member) => member.placeName).join(", "),
          memberPlaceIds: group.members.map((member) => member.placeId).join(","),
          groupBand: band
        }
      });
    });
  }

  return { type: "FeatureCollection", features };
}

/** Shows a feature only at the whole zoom it was grouped for; layout evaluates it per tile zoom. */
export const majorNameBandFilter = [
  "==",
  ["get", "groupBand"],
  ["min", MAJOR_NAME_MAX_BAND, ["max", 0, ["floor", ["zoom"]]]]
];
