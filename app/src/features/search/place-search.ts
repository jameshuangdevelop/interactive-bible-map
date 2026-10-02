import { getPrimaryPlaceName, isDisputedPlace } from "../map/place-visibility";
import type { PlaceIndexRecord, PlaceType } from "../map/types";

type MatchRank = 0 | 1 | 2;
type PrefixRank = 0 | 1;

const combiningMarksPattern = /\p{M}+/gu;
const wordPattern = /[\p{L}\p{N}]+/gu;
const nonWordPattern = /[^\p{L}\p{N}]+/gu;

export type SearchMatchKind = "exact" | "prefix" | "word-start" | "typo";
export type HighlightRange = [number, number];

interface FoldedTextWithMap {
  folded: string;
  originalIndexByFoldedIndex: number[];
}

interface NameMatch {
  name: string;
  matchKind: SearchMatchKind;
  rank: MatchRank;
  prefixRank: PrefixRank;
  highlightRange: HighlightRange | null;
}

interface RankedResult {
  place: PlaceIndexRecord;
  title: string;
  titleFolded: string;
  subtitle: string;
  nameMatch: NameMatch;
  matchedNameIsTitle: boolean;
}

export interface PlaceSearchResult {
  place: PlaceIndexRecord;
  title: string;
  subtitle: string;
  matchKind: SearchMatchKind;
  matchedName: string;
  matchedNameIsTitle: boolean;
  titleHighlightRange: HighlightRange | null;
  alsoName: string | null;
  alsoNameHighlightRange: HighlightRange | null;
}

export function normalizeForSearch(value: string) {
  return value.normalize("NFD").replace(combiningMarksPattern, "").toLowerCase();
}

function normalizeLettersOnly(value: string) {
  return normalizeForSearch(value).replace(nonWordPattern, "");
}

function foldTextWithMap(value: string): FoldedTextWithMap {
  let folded = "";
  const originalIndexByFoldedIndex: number[] = [];

  for (let index = 0; index < value.length; ) {
    const codePoint = value.codePointAt(index);
    if (codePoint === undefined) {
      break;
    }

    const symbol = String.fromCodePoint(codePoint);
    const foldedSymbol = normalizeForSearch(symbol);

    for (const foldedCharacter of foldedSymbol) {
      folded += foldedCharacter;
      originalIndexByFoldedIndex.push(index);
    }

    index += symbol.length;
  }

  return {
    folded,
    originalIndexByFoldedIndex
  };
}

function toOriginalRange(
  map: FoldedTextWithMap,
  startFoldedIndex: number,
  endFoldedIndexExclusive: number,
  originalTextLength: number
): HighlightRange | null {
  const clampedStart = Math.max(0, startFoldedIndex);
  const clampedEnd = Math.max(clampedStart, endFoldedIndexExclusive);
  const start = map.originalIndexByFoldedIndex[clampedStart];
  if (start === undefined) {
    return null;
  }

  const nextOriginalStart =
    map.originalIndexByFoldedIndex[clampedEnd] ??
    map.originalIndexByFoldedIndex[map.originalIndexByFoldedIndex.length - 1] ??
    originalTextLength;
  const end =
    clampedEnd >= map.originalIndexByFoldedIndex.length
      ? originalTextLength
      : Math.max(start + 1, nextOriginalStart);

  return [start, Math.max(start + 1, end)];
}

function findWordStartMatch(foldedText: string, foldedQuery: string) {
  const matcher = new RegExp(wordPattern.source, "gu");
  let match = matcher.exec(foldedText);

  while (match) {
    const word = match[0];
    if (word.startsWith(foldedQuery)) {
      return match.index;
    }

    match = matcher.exec(foldedText);
  }

  return -1;
}

function isWithinOneEdit(left: string, right: string) {
  if (left === right) {
    return true;
  }

  const lengthDifference = Math.abs(left.length - right.length);
  if (lengthDifference > 1) {
    return false;
  }

  if (left.length === right.length) {
    const mismatchIndexes: number[] = [];
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) {
        mismatchIndexes.push(index);
        if (mismatchIndexes.length > 2) {
          return false;
        }
      }
    }

    if (mismatchIndexes.length === 1) {
      return true;
    }

    if (mismatchIndexes.length === 2) {
      const [first, second] = mismatchIndexes;
      return left[first] === right[second] && left[second] === right[first];
    }

    return false;
  }

  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  let shorterIndex = 0;
  let longerIndex = 0;
  let usedEdit = false;

  while (shorterIndex < shorter.length && longerIndex < longer.length) {
    if (shorter[shorterIndex] === longer[longerIndex]) {
      shorterIndex += 1;
      longerIndex += 1;
      continue;
    }

    if (usedEdit) {
      return false;
    }

    usedEdit = true;
    longerIndex += 1;
  }

  return true;
}

function isTypoMatch(foldedQueryLetters: string, name: string) {
  if (foldedQueryLetters.length < 5) {
    return false;
  }

  const foldedNameLetters = normalizeLettersOnly(name);
  if (foldedNameLetters.length >= 5 && isWithinOneEdit(foldedQueryLetters, foldedNameLetters)) {
    return true;
  }

  const words = name.match(wordPattern) ?? [];
  for (const word of words) {
    const foldedWordLetters = normalizeLettersOnly(word);
    if (foldedWordLetters.length < 5) {
      continue;
    }

    if (isWithinOneEdit(foldedQueryLetters, foldedWordLetters)) {
      return true;
    }
  }

  return false;
}

function findTypoHighlightRange(name: string, foldedQueryLetters: string): HighlightRange {
  const wordMatcher = new RegExp(wordPattern.source, "gu");
  let match = wordMatcher.exec(name);

  while (match) {
    const word = match[0];
    const foldedWordLetters = normalizeLettersOnly(word);
    if (foldedWordLetters.length >= 5 && isWithinOneEdit(foldedQueryLetters, foldedWordLetters)) {
      const start = match.index;
      const end = start + word.length;
      return [start, end];
    }

    match = wordMatcher.exec(name);
  }

  return [0, Math.max(1, name.length)];
}

function evaluateNameMatch(name: string, foldedQuery: string, foldedQueryLetters: string): NameMatch | null {
  const foldMap = foldTextWithMap(name);
  if (foldMap.folded.length === 0) {
    return null;
  }

  if (foldMap.folded === foldedQuery) {
    return {
      name,
      matchKind: "exact",
      rank: 0,
      prefixRank: 0,
      highlightRange: toOriginalRange(foldMap, 0, foldedQuery.length, name.length)
    };
  }

  if (foldMap.folded.startsWith(foldedQuery)) {
    return {
      name,
      matchKind: "prefix",
      rank: 1,
      prefixRank: 0,
      highlightRange: toOriginalRange(foldMap, 0, foldedQuery.length, name.length)
    };
  }

  const wordStartIndex = findWordStartMatch(foldMap.folded, foldedQuery);
  if (wordStartIndex >= 0) {
    return {
      name,
      matchKind: "word-start",
      rank: 1,
      prefixRank: 1,
      highlightRange: toOriginalRange(
        foldMap,
        wordStartIndex,
        wordStartIndex + foldedQuery.length,
        name.length
      )
    };
  }

  if (!isTypoMatch(foldedQueryLetters, name)) {
    return null;
  }

  return {
    name,
    matchKind: "typo",
    rank: 2,
    prefixRank: 0,
    highlightRange: findTypoHighlightRange(name, foldedQueryLetters)
  };
}

function toTypeLabel(placeType: PlaceType) {
  const normalized = placeType.replace("-", " ");
  return normalized[0]?.toUpperCase() + normalized.slice(1);
}

function buildSubtitle(place: PlaceIndexRecord) {
  const typeLabel = toTypeLabel(place.type);

  if (isDisputedPlace(place)) {
    return `Disputed · ${place.candidates.length} proposed sites · ${typeLabel}`;
  }

  if (typeof place.names.modern === "string" && place.names.modern.trim().length > 0) {
    return `${place.names.modern} · ${typeLabel}`;
  }

  return typeLabel;
}

function uniqueSearchNames(place: PlaceIndexRecord) {
  const uniqueByFolded = new Set<string>();
  const names = [...place.names.ancient, ...place.names.alternate];
  const deduplicated: string[] = [];

  for (const name of names) {
    const folded = normalizeForSearch(name);
    if (folded.length === 0 || uniqueByFolded.has(folded)) {
      continue;
    }

    uniqueByFolded.add(folded);
    deduplicated.push(name);
  }

  return deduplicated;
}

function compareNameMatches(left: NameMatch, right: NameMatch, title: string) {
  if (left.rank !== right.rank) {
    return left.rank - right.rank;
  }

  if (left.prefixRank !== right.prefixRank) {
    return left.prefixRank - right.prefixRank;
  }

  const leftIsTitle = left.name === title;
  const rightIsTitle = right.name === title;
  if (leftIsTitle !== rightIsTitle) {
    return leftIsTitle ? -1 : 1;
  }

  const nameOrder = left.name.localeCompare(right.name, undefined, {
    sensitivity: "base"
  });
  if (nameOrder !== 0) {
    return nameOrder;
  }

  return left.name.localeCompare(right.name);
}

function rankPlaceMatch(place: PlaceIndexRecord, query: string): RankedResult | null {
  const foldedQuery = normalizeForSearch(query.trim());
  const foldedQueryLetters = normalizeLettersOnly(query);
  if (foldedQuery.length === 0) {
    return null;
  }

  const title = getPrimaryPlaceName(place);
  const matches = uniqueSearchNames(place)
    .map((name) => evaluateNameMatch(name, foldedQuery, foldedQueryLetters))
    .filter((match): match is NameMatch => match !== null);

  if (matches.length === 0) {
    return null;
  }

  matches.sort((left, right) => compareNameMatches(left, right, title));
  const bestMatch = matches[0];

  return {
    place,
    title,
    titleFolded: normalizeForSearch(title),
    subtitle: buildSubtitle(place),
    nameMatch: bestMatch,
    matchedNameIsTitle: bestMatch.name === title
  };
}

function compareRankedResults(left: RankedResult, right: RankedResult) {
  if (left.nameMatch.rank !== right.nameMatch.rank) {
    return left.nameMatch.rank - right.nameMatch.rank;
  }

  if (left.nameMatch.prefixRank !== right.nameMatch.prefixRank) {
    return left.nameMatch.prefixRank - right.nameMatch.prefixRank;
  }

  const byName = left.titleFolded.localeCompare(right.titleFolded);
  if (byName !== 0) {
    return byName;
  }

  return left.place.id.localeCompare(right.place.id);
}

export function searchPlacesByName(
  places: PlaceIndexRecord[],
  query: string,
  limit = 8
): PlaceSearchResult[] {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    return [];
  }

  const ranked = places
    .map((place) => rankPlaceMatch(place, trimmedQuery))
    .filter((entry): entry is RankedResult => entry !== null);

  ranked.sort(compareRankedResults);

  return ranked.slice(0, limit).map((entry) => ({
    place: entry.place,
    title: entry.title,
    subtitle: entry.subtitle,
    matchKind: entry.nameMatch.matchKind,
    matchedName: entry.nameMatch.name,
    matchedNameIsTitle: entry.matchedNameIsTitle,
    titleHighlightRange: entry.matchedNameIsTitle ? entry.nameMatch.highlightRange : null,
    alsoName: entry.matchedNameIsTitle ? null : entry.nameMatch.name,
    alsoNameHighlightRange: entry.matchedNameIsTitle ? null : entry.nameMatch.highlightRange
  }));
}
