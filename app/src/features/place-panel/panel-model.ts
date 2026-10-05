import { getPrimaryPlaceName } from "../map/place-visibility";
import type {
  Confidence,
  MediaImageRecord,
  PlaceIndexRecord,
  PlaceNames,
  PlaceRecord,
  ScriptureEntry,
  SourceId
} from "../map/types";

const REFERENCE_PATTERN =
  /^(?<book>(?:[1-3] )?[A-Za-z]+(?: [A-Za-z]+)*) (?<chapter>[1-9][0-9]*):(?<startVerse>[1-9][0-9]*)(?:-(?<endVerse>[1-9][0-9]*))?$/u;

const CANONICAL_BOOKS = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation"
] as const;

const bookIndexByName: Map<string, number> = new Map(
  CANONICAL_BOOKS.map((book, index) => [book, index] as [string, number])
);

const HIERARCHY_LINE_EXCEPTIONS_BY_ID: Readonly<Record<string, string>> = Object.freeze({
  italy: "Governed directly from Rome · Roman Empire",
  arabia: "Client kingdom allied with Rome"
});

const IMAGE_KIND_LABEL_BY_KIND: Readonly<Record<NonNullable<MediaImageRecord["kind"]>, string>> =
  Object.freeze({
    modern: "Today",
    historical: "Historical view",
    site: "Excavated site",
    reconstruction: "Reconstruction",
    "ai-reconstruction": "AI-generated reconstruction"
  });

const IMAGE_PROMPTS_BASE_URL =
  "https://github.com/jameshuangdevelop/interactive-bible-map/blob/main/content/image-prompts";
// Keep raw source IDs in data only; readers get a single brief link label.
export const AI_BASED_ON_LABEL = "research brief";
const WORD_CHARACTER_PATTERN = /[\p{Letter}\p{Number}]/u;
const WORD_BODY_CHARACTER_PATTERN = /[\p{Letter}\p{Number}'’]/u;
const CAPITALIZED_WORD_START_PATTERN = /^\p{Lu}/u;
const SENTENCE_BOUNDARY_PATTERN = /[.!?]/u;
const LOWERCASE_LINK_NAME_CONNECTORS = new Set(["the", "of", "on", "in", "and", "beyond"]);
const OPENING_WORD_PUNCTUATION = new Set(['"', "“", "‘", "(", "[", "{"]);
const CLOSING_WORD_PUNCTUATION = new Set(['"', "”", "’", "'", ")", "]", "}"]);
const TRAILING_NEIGHBOR_PUNCTUATION = new Set([".", ...CLOSING_WORD_PUNCTUATION]);
// Keep in sync with schema/location.schema.json ($defs.modernCountry).
const MODERN_COUNTRY_NAMES = [
  "Türkiye",
  "Greece",
  "Italy",
  "Israel",
  "Jordan",
  "Lebanon",
  "Syria",
  "Egypt",
  "Cyprus",
  "Malta",
  "Iraq",
  "Iran",
  "Albania",
  "North Macedonia",
  "Libya",
  "West Bank",
  "Golan Heights"
] as const;

export interface GroupedScriptureBook {
  book: string;
  passages: ScriptureEntry[];
}

export interface HierarchyItem {
  label: string;
  placeId: string | null;
}

export interface ImageCreditFields {
  authorLabel: string | null;
  licenseLabel: string | null;
  toolLabel: string | null;
}

export interface PhotoCreditSegment {
  key: string;
  text: string;
  href: string | null;
}

export interface PhotoCreditEntry {
  imageId: string;
  segments: PhotoCreditSegment[];
}

export interface AboutPlaceMention {
  placeId: string;
  paragraphIndex: number;
  start: number;
  end: number;
  text: string;
}

function githubHeadingAnchor(heading: string) {
  return heading
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/gu, "-");
}

function normalizeOptionalText(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCircularIndex(index: number, imageCount: number) {
  if (!Number.isFinite(index) || imageCount <= 0) {
    return 0;
  }

  const normalized = Math.trunc(index) % imageCount;
  return normalized >= 0 ? normalized : normalized + imageCount;
}

function isSameDisplayLabel(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: "accent", usage: "search" }) === 0;
}

function parseReference(reference: string) {
  const match = REFERENCE_PATTERN.exec(reference.trim());
  if (!match?.groups) {
    return null;
  }

  const chapter = Number.parseInt(match.groups.chapter, 10);
  const startVerse = Number.parseInt(match.groups.startVerse, 10);
  return {
    chapter: Number.isFinite(chapter) ? chapter : Number.MAX_SAFE_INTEGER,
    startVerse: Number.isFinite(startVerse) ? startVerse : Number.MAX_SAFE_INTEGER
  };
}

function typeLabel(placeType: PlaceIndexRecord["type"]) {
  if (placeType === "natural-feature") {
    return "Natural feature";
  }

  return placeType.charAt(0).toUpperCase() + placeType.slice(1);
}

function pushUniqueName(target: string[], seen: Set<string>, value: string | undefined) {
  if (!value) {
    return;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return;
  }

  const key = trimmed.toLocaleLowerCase();
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  target.push(trimmed);
}

function normalizeComparableText(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value.trim().replace(/\s+/gu, " ").toLocaleLowerCase();
}

const MODERN_COUNTRY_COMPARABLE_NAMES = new Set(
  MODERN_COUNTRY_NAMES.map((countryName) => normalizeComparableText(countryName))
);

function normalizeDisplayNameForMatch(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

function normalizeNameWordForComparison(value: string) {
  return value.toLocaleLowerCase();
}

function buildNameMatchVariants(value: string) {
  const normalizedName = normalizeDisplayNameForMatch(value);
  if (normalizedName.length === 0) {
    return [] as string[];
  }

  const variants = [normalizedName];
  const firstWordMatch = /^(?<word>\p{Letter}+(?:['’]\p{Letter}+)*)/u.exec(normalizedName);
  const firstWord = firstWordMatch?.groups?.word;
  if (!firstWord) {
    return variants;
  }

  const firstWordLower = firstWord.toLocaleLowerCase();
  if (!LOWERCASE_LINK_NAME_CONNECTORS.has(firstWordLower)) {
    return variants;
  }

  const lowercaseVariant = `${firstWordLower}${normalizedName.slice(firstWord.length)}`;
  if (!variants.includes(lowercaseVariant)) {
    variants.push(lowercaseVariant);
  }

  const firstCharacter = firstWord.charAt(0);
  const titleCasedFirstWord = `${firstCharacter.toLocaleUpperCase()}${firstWord.slice(
    firstCharacter.length
  )}`;
  const titleCaseVariant = `${titleCasedFirstWord}${normalizedName.slice(firstWord.length)}`;
  if (!variants.includes(titleCaseVariant)) {
    variants.push(titleCaseVariant);
  }

  return variants;
}

function hasDisallowedLowercaseWords(value: string) {
  const words = value.match(/\p{Letter}+(?:['’]\p{Letter}+)?/gu) ?? [];
  for (const word of words) {
    const normalizedWord = normalizeNameWordForComparison(word);
    if (word !== normalizedWord) {
      continue;
    }

    if (!LOWERCASE_LINK_NAME_CONNECTORS.has(normalizedWord)) {
      return true;
    }
  }

  return false;
}

function isAllowedAboutLinkName(value: string) {
  return !hasDisallowedLowercaseWords(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function isWordCharacter(value: string | undefined) {
  return Boolean(value && WORD_CHARACTER_PATTERN.test(value));
}

function isWordBodyCharacter(value: string | undefined) {
  return Boolean(value && WORD_BODY_CHARACTER_PATTERN.test(value));
}

function isWholeWordMatch(text: string, start: number, end: number) {
  const before = start > 0 ? text[start - 1] : undefined;
  const after = end < text.length ? text[end] : undefined;
  return !isWordCharacter(before) && !isWordCharacter(after);
}

function isCapitalizedWord(word: string) {
  const trimmedWord = word.replace(/^['’"“‘]+/u, "");
  return CAPITALIZED_WORD_START_PATTERN.test(trimmedWord);
}

function isWhitespaceCharacter(value: string | undefined) {
  return Boolean(value && /\s/u.test(value));
}

function wordNearStartOfSentence(text: string, wordStart: number) {
  let cursor = wordStart - 1;
  while (cursor >= 0 && isWhitespaceCharacter(text[cursor])) {
    cursor -= 1;
  }

  while (cursor >= 0 && CLOSING_WORD_PUNCTUATION.has(text[cursor])) {
    cursor -= 1;
  }

  if (cursor < 0) {
    return true;
  }

  return SENTENCE_BOUNDARY_PATTERN.test(text[cursor]);
}

interface WordRange {
  start: number;
  end: number;
  text: string;
}

function readWordBackward(text: string, endInclusive: number) {
  if (endInclusive < 0 || endInclusive >= text.length) {
    return null as WordRange | null;
  }

  if (!isWordBodyCharacter(text[endInclusive])) {
    return null as WordRange | null;
  }

  let start = endInclusive;
  while (start > 0 && isWordBodyCharacter(text[start - 1])) {
    start -= 1;
  }

  return {
    start,
    end: endInclusive + 1,
    text: text.slice(start, endInclusive + 1)
  };
}

function readWordForward(text: string, start: number) {
  if (start < 0 || start >= text.length) {
    return null as WordRange | null;
  }

  if (!isWordBodyCharacter(text[start])) {
    return null as WordRange | null;
  }

  let end = start + 1;
  while (end < text.length && isWordBodyCharacter(text[end])) {
    end += 1;
  }

  return {
    start,
    end,
    text: text.slice(start, end)
  };
}

function readAdjacentWordBefore(text: string, matchStart: number) {
  const separator = matchStart > 0 ? text[matchStart - 1] : undefined;
  if (separator !== " " && separator !== "-") {
    return null as WordRange | null;
  }

  let cursor = matchStart - 2;
  while (cursor >= 0 && TRAILING_NEIGHBOR_PUNCTUATION.has(text[cursor])) {
    cursor -= 1;
  }

  return readWordBackward(text, cursor);
}

function readAdjacentWordAfter(text: string, matchEnd: number) {
  const separator = matchEnd < text.length ? text[matchEnd] : undefined;
  if (separator !== " " && separator !== "-") {
    return null as WordRange | null;
  }

  let cursor = matchEnd + 1;
  while (cursor < text.length && OPENING_WORD_PUNCTUATION.has(text[cursor])) {
    cursor += 1;
  }

  return readWordForward(text, cursor);
}

function isPartOfLongerCapitalizedName(text: string, start: number, end: number) {
  const beforeWord = readAdjacentWordBefore(text, start);
  if (
    beforeWord &&
    isCapitalizedWord(beforeWord.text) &&
    !wordNearStartOfSentence(text, beforeWord.start)
  ) {
    return true;
  }

  const afterWord = readAdjacentWordAfter(text, end);
  if (afterWord && isCapitalizedWord(afterWord.text) && !wordNearStartOfSentence(text, afterWord.start)) {
    return true;
  }

  return false;
}

function hasFollowingOfCapitalizedWord(text: string, end: number) {
  if (text.slice(end, end + 4) !== " of ") {
    return false;
  }

  const wordAfterOf = readWordForward(text, end + 4);
  return Boolean(wordAfterOf && isCapitalizedWord(wordAfterOf.text));
}

function shouldSkipAboutMatchForContext(text: string, start: number, end: number) {
  return isPartOfLongerCapitalizedName(text, start, end) || hasFollowingOfCapitalizedWord(text, end);
}

function namesForAboutMatching(place: PlaceIndexRecord) {
  return [getPrimaryPlaceName(place), ...place.names.ancient, ...place.names.alternate];
}

function collectNameOwners(places: PlaceIndexRecord[]) {
  const ownersByName = new Map<string, Set<string>>();

  for (const place of places) {
    const namesSeenForPlace = new Set<string>();
    for (const placeName of namesForAboutMatching(place)) {
      if (!isAllowedAboutLinkName(placeName)) {
        continue;
      }

      for (const nameVariant of buildNameMatchVariants(placeName)) {
        const normalized = normalizeComparableText(nameVariant);
        if (
          normalized.length === 0 ||
          namesSeenForPlace.has(normalized) ||
          MODERN_COUNTRY_COMPARABLE_NAMES.has(normalized)
        ) {
          continue;
        }

        namesSeenForPlace.add(normalized);

        const existing = ownersByName.get(normalized);
        if (existing) {
          existing.add(place.id);
          continue;
        }

        ownersByName.set(normalized, new Set([place.id]));
      }
    }
  }

  return ownersByName;
}

export interface AboutMatchCandidate {
  placeId: string;
  matcher: RegExp;
  priorityLength: number;
}

interface SelfNameMaskCandidate {
  matcher: RegExp;
  priorityLength: number;
}

export interface AboutPlaceMatchIndex {
  candidates: AboutMatchCandidate[];
  selfNameMaskCandidatesByPlaceId: Map<string, SelfNameMaskCandidate[]>;
}

function collectAboutMatchCandidates(places: PlaceIndexRecord[]): AboutMatchCandidate[] {
  const ownersByName = collectNameOwners(places);
  const candidates: AboutMatchCandidate[] = [];

  for (const place of places) {
    const namesSeenForPlace = new Set<string>();
    for (const placeName of namesForAboutMatching(place)) {
      if (!isAllowedAboutLinkName(placeName)) {
        continue;
      }

      for (const nameVariant of buildNameMatchVariants(placeName)) {
        const comparableName = normalizeComparableText(nameVariant);
        if (
          comparableName.length === 0 ||
          namesSeenForPlace.has(nameVariant) ||
          MODERN_COUNTRY_COMPARABLE_NAMES.has(comparableName)
        ) {
          continue;
        }

        namesSeenForPlace.add(nameVariant);
        const owners = ownersByName.get(comparableName);
        if (!owners || owners.size !== 1) {
          continue;
        }

        const displayName = normalizeDisplayNameForMatch(nameVariant);
        const pattern = escapeRegExp(displayName).replace(/\s+/gu, "\\s+");
        candidates.push({
          placeId: place.id,
          matcher: new RegExp(pattern, "gu"),
          priorityLength: displayName.length
        });
      }
    }
  }

  return candidates;
}

function collectSelfNameMaskCandidatesByPlaceId(places: PlaceIndexRecord[]) {
  const byPlaceId = new Map<string, SelfNameMaskCandidate[]>();

  for (const place of places) {
    const matchers: SelfNameMaskCandidate[] = [];
    const seenNames = new Set<string>();

    for (const placeName of namesForAboutMatching(place)) {
      for (const nameVariant of buildNameMatchVariants(placeName)) {
        const displayName = normalizeDisplayNameForMatch(nameVariant);
        if (displayName.length === 0 || seenNames.has(displayName)) {
          continue;
        }

        seenNames.add(displayName);
        const pattern = escapeRegExp(displayName).replace(/\s+/gu, "\\s+");
        matchers.push({
          matcher: new RegExp(pattern, "gu"),
          priorityLength: displayName.length
        });
      }
    }

    byPlaceId.set(place.id, matchers);
  }

  return byPlaceId;
}

export function buildAboutPlaceMatchIndex(places: PlaceIndexRecord[]): AboutPlaceMatchIndex {
  return {
    candidates: collectAboutMatchCandidates(places),
    selfNameMaskCandidatesByPlaceId: collectSelfNameMaskCandidatesByPlaceId(places)
  };
}

interface AboutMentionCandidate extends Omit<AboutPlaceMention, "text"> {
  priorityLength: number;
}

function rangesOverlap(
  left: Pick<AboutMentionCandidate, "start" | "end">,
  right: Pick<AboutMentionCandidate, "start" | "end">
) {
  return left.start < right.end && right.start < left.end;
}

interface ParagraphMatchRange {
  start: number;
  end: number;
  priorityLength: number;
}

function sortRangesByPositionAndLength(
  left: Pick<ParagraphMatchRange, "start" | "end" | "priorityLength">,
  right: Pick<ParagraphMatchRange, "start" | "end" | "priorityLength">
) {
  if (left.start !== right.start) {
    return left.start - right.start;
  }

  if (left.priorityLength !== right.priorityLength) {
    return right.priorityLength - left.priorityLength;
  }

  return left.end - right.end;
}

function collectMatchRangesFromCandidates(
  paragraphText: string,
  candidates: readonly Pick<SelfNameMaskCandidate, "matcher" | "priorityLength">[]
) {
  const ranges: ParagraphMatchRange[] = [];

  for (const candidate of candidates) {
    candidate.matcher.lastIndex = 0;
    let match: RegExpExecArray | null = candidate.matcher.exec(paragraphText);
    while (match) {
      const start = match.index;
      const end = start + match[0].length;
      if (isWholeWordMatch(paragraphText, start, end)) {
        ranges.push({
          start,
          end,
          priorityLength: candidate.priorityLength
        });
      }

      match = candidate.matcher.exec(paragraphText);
    }
  }

  return ranges;
}

function selectNonOverlappingRanges(ranges: ParagraphMatchRange[]) {
  if (ranges.length === 0) {
    return [] as ParagraphMatchRange[];
  }

  const sortedRanges = [...ranges].sort(sortRangesByPositionAndLength);
  const selectedRanges: ParagraphMatchRange[] = [];

  for (const range of sortedRanges) {
    if (selectedRanges.some((selectedRange) => rangesOverlap(selectedRange, range))) {
      continue;
    }

    selectedRanges.push(range);
  }

  return selectedRanges;
}

function maskRangesInText(paragraphText: string, rangesToMask: ParagraphMatchRange[]) {
  if (rangesToMask.length === 0) {
    return paragraphText;
  }

  let maskedText = paragraphText;
  const rangesInReverseOrder = [...rangesToMask].sort((left, right) => right.start - left.start);
  for (const range of rangesInReverseOrder) {
    maskedText =
      maskedText.slice(0, range.start) +
      " ".repeat(range.end - range.start) +
      maskedText.slice(range.end);
  }

  return maskedText;
}

function maskCurrentPlaceNamesInParagraph({
  matchIndex,
  currentPlaceId,
  paragraphText
}: {
  matchIndex: AboutPlaceMatchIndex;
  currentPlaceId: string;
  paragraphText: string;
}) {
  const selfNameMaskCandidates = matchIndex.selfNameMaskCandidatesByPlaceId.get(currentPlaceId);
  if (!selfNameMaskCandidates || selfNameMaskCandidates.length === 0) {
    return paragraphText;
  }

  const maskRanges = collectMatchRangesFromCandidates(paragraphText, selfNameMaskCandidates);
  if (maskRanges.length === 0) {
    return paragraphText;
  }

  return maskRangesInText(paragraphText, selectNonOverlappingRanges(maskRanges));
}

export function matchAboutPlaceMentions({
  matchIndex,
  currentPlaceId,
  paragraphs
}: {
  matchIndex: AboutPlaceMatchIndex;
  currentPlaceId: string;
  paragraphs: string[];
}) {
  if (paragraphs.length === 0 || matchIndex.candidates.length === 0) {
    return [] as AboutPlaceMention[];
  }

  const allMatches: AboutMentionCandidate[] = [];
  paragraphs.forEach((paragraphText, paragraphIndex) => {
    if (!paragraphText) {
      return;
    }

    const maskedParagraphText = maskCurrentPlaceNamesInParagraph({
      matchIndex,
      currentPlaceId,
      paragraphText
    });

    for (const candidate of matchIndex.candidates) {
      if (candidate.placeId === currentPlaceId) {
        continue;
      }

      candidate.matcher.lastIndex = 0;
      let match: RegExpExecArray | null = candidate.matcher.exec(maskedParagraphText);
      while (match) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;
        if (
          isWholeWordMatch(maskedParagraphText, matchStart, matchEnd) &&
          !shouldSkipAboutMatchForContext(paragraphText, matchStart, matchEnd)
        ) {
          allMatches.push({
            placeId: candidate.placeId,
            paragraphIndex,
            start: matchStart,
            end: matchEnd,
            priorityLength: candidate.priorityLength
          });
        }

        match = candidate.matcher.exec(maskedParagraphText);
      }
    }
  });

  if (allMatches.length === 0) {
    return [] as AboutPlaceMention[];
  }

  allMatches.sort((left, right) => {
    if (left.paragraphIndex !== right.paragraphIndex) {
      return left.paragraphIndex - right.paragraphIndex;
    }

    if (left.start !== right.start) {
      return left.start - right.start;
    }

    if (left.priorityLength !== right.priorityLength) {
      return right.priorityLength - left.priorityLength;
    }

    return left.placeId.localeCompare(right.placeId);
  });

  const selectedPlaceIds = new Set<string>();
  const selectedByParagraph = new Map<number, AboutMentionCandidate[]>();

  for (const match of allMatches) {
    if (selectedPlaceIds.has(match.placeId)) {
      continue;
    }

    const selectedForParagraph = selectedByParagraph.get(match.paragraphIndex) ?? [];
    if (selectedForParagraph.some((existing) => rangesOverlap(existing, match))) {
      continue;
    }

    selectedPlaceIds.add(match.placeId);
    selectedForParagraph.push(match);
    selectedByParagraph.set(match.paragraphIndex, selectedForParagraph);
  }

  const selectedMatches: AboutPlaceMention[] = [];
  for (const [paragraphIndex, selectedForParagraph] of selectedByParagraph.entries()) {
    selectedForParagraph
      .sort((left, right) => left.start - right.start)
      .forEach((match) => {
        selectedMatches.push({
          placeId: match.placeId,
          paragraphIndex,
          start: match.start,
          end: match.end,
          text: paragraphs[paragraphIndex].slice(match.start, match.end)
        });
      });
  }

  selectedMatches.sort((left, right) => {
    if (left.paragraphIndex !== right.paragraphIndex) {
      return left.paragraphIndex - right.paragraphIndex;
    }

    return left.start - right.start;
  });

  return selectedMatches;
}

export function isDisputedRecord(place: Pick<PlaceIndexRecord, "candidates">) {
  return place.candidates.some((candidate) => candidate.confidence === "disputed");
}

export function confidenceLabel(confidence: Confidence, includeSuffix: boolean) {
  const base =
    confidence === "high"
      ? "High"
      : confidence === "medium"
        ? "Medium"
        : confidence === "low"
          ? "Low"
          : "Disputed";
  if (includeSuffix && confidence !== "disputed") {
    return `${base} confidence`;
  }

  return base;
}

export function buildAlsoKnownAs(names: PlaceNames) {
  const values: string[] = [];
  const seen = new Set<string>();

  for (const name of names.ancient.slice(1)) {
    pushUniqueName(values, seen, name);
  }

  for (const name of names.alternate) {
    pushUniqueName(values, seen, name);
  }

  return values;
}

export function sortScriptureByCanonicalOrder(scripture: ScriptureEntry[]) {
  return [...scripture].sort((left, right) => {
    const leftBookIndex = bookIndexByName.get(left.book) ?? Number.MAX_SAFE_INTEGER;
    const rightBookIndex = bookIndexByName.get(right.book) ?? Number.MAX_SAFE_INTEGER;
    if (leftBookIndex !== rightBookIndex) {
      return leftBookIndex - rightBookIndex;
    }

    const leftRef = parseReference(left.ref);
    const rightRef = parseReference(right.ref);
    if (leftRef && rightRef) {
      if (leftRef.chapter !== rightRef.chapter) {
        return leftRef.chapter - rightRef.chapter;
      }

      if (leftRef.startVerse !== rightRef.startVerse) {
        return leftRef.startVerse - rightRef.startVerse;
      }
    }

    return left.ref.localeCompare(right.ref);
  });
}

export function groupScriptureByBook(scripture: ScriptureEntry[]) {
  const grouped = new Map<string, ScriptureEntry[]>();
  for (const passage of sortScriptureByCanonicalOrder(scripture)) {
    const existing = grouped.get(passage.book);
    if (existing) {
      existing.push(passage);
      continue;
    }

    grouped.set(passage.book, [passage]);
  }

  const result: GroupedScriptureBook[] = [];
  for (const [book, passages] of grouped.entries()) {
    result.push({
      book,
      passages
    });
  }
  return result;
}

export function collectSourceIdsInPanelOrder(location: PlaceRecord) {
  const ordered: SourceId[] = [];
  const seen = new Set<string>();

  const ingest = (sourceIds: SourceId[] | undefined) => {
    if (!Array.isArray(sourceIds)) {
      return;
    }

    for (const sourceId of sourceIds) {
      if (typeof sourceId !== "string" || sourceId.length === 0 || seen.has(sourceId)) {
        continue;
      }
      seen.add(sourceId);
      ordered.push(sourceId);
    }
  };

  for (const candidate of location.candidates) {
    ingest(candidate.sources);
  }
  ingest(location.summary?.sources);
  for (const historyEntry of location.history) {
    ingest(historyEntry.sources);
  }
  for (const connection of location.otConnections) {
    ingest(connection.sources);
  }

  return ordered;
}

function resolveParentAndEmpire(
  place: PlaceIndexRecord,
  placesById: Map<string, PlaceIndexRecord>
) {
  const parent = place.parentId ? placesById.get(place.parentId) ?? null : null;

  const visited = new Set<string>();
  let cursor = parent;
  let empire: PlaceIndexRecord | null = null;

  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    if (cursor.type === "empire") {
      empire = cursor;
      break;
    }

    if (!cursor.parentId) {
      break;
    }
    cursor = placesById.get(cursor.parentId) ?? null;
  }

  return {
    parent,
    empire
  };
}

export function buildHierarchyItems(
  place: PlaceIndexRecord,
  placesById: Map<string, PlaceIndexRecord>
): HierarchyItem[] {
  if (place.type === "empire") {
    return [
      {
        label: "Empire",
        placeId: null
      }
    ];
  }
  const { parent, empire } = resolveParentAndEmpire(place, placesById);
  const exceptionLine = HIERARCHY_LINE_EXCEPTIONS_BY_ID[place.id];
  if (exceptionLine) {
    const empireLabel = empire ? getPrimaryPlaceName(empire) : null;
    return exceptionLine
      .split("·")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0)
      .map((label) => ({
        label,
        placeId:
          empire && empireLabel && isSameDisplayLabel(label, empireLabel) ? empire.id : null
      }));
  }

  const items: HierarchyItem[] = [
    {
      label: typeLabel(place.type),
      placeId: null
    }
  ];

  if (parent) {
    items.push({
      label: getPrimaryPlaceName(parent),
      placeId: parent.id
    });
  }

  if (empire && empire.id !== parent?.id) {
    items.push({
      label: getPrimaryPlaceName(empire),
      placeId: empire.id
    });
  }

  return items;
}

export function buildImageKindLabel(kind: MediaImageRecord["kind"] | undefined) {
  if (!kind) {
    return null;
  }

  return IMAGE_KIND_LABEL_BY_KIND[kind] ?? null;
}

export function isAiReconstructionImage(
  image: Pick<MediaImageRecord, "kind" | "aiGenerated">
) {
  return image.kind === "ai-reconstruction" || image.aiGenerated;
}

export function buildImageCreditFields(
  image: Pick<MediaImageRecord, "author" | "license" | "generator">
): ImageCreditFields {
  return {
    authorLabel: normalizeOptionalText(image.author),
    licenseLabel: normalizeOptionalText(image.license),
    toolLabel: normalizeOptionalText(image.generator?.tool)
  };
}

export function buildPhotoCreditEntry(
  image: Pick<
    MediaImageRecord,
    | "id"
    | "kind"
    | "aiGenerated"
    | "author"
    | "license"
    | "licenseUrl"
    | "sourcePage"
    | "generator"
    | "promptRef"
  >,
  locationId: string
): PhotoCreditEntry {
  const { authorLabel, licenseLabel, toolLabel } = buildImageCreditFields(image);
  const segments: PhotoCreditSegment[] = [];

  if (isAiReconstructionImage(image)) {
    segments.push({
      key: "ai-label",
      text: "AI-generated reconstruction",
      href: null
    });

    if (toolLabel) {
      segments.push({
        key: "tool",
        text: toolLabel,
        href: null
      });
    }

    if (licenseLabel) {
      segments.push({
        key: "license",
        text: licenseLabel,
        href: normalizeOptionalText(image.licenseUrl)
      });
    }

    segments.push({
      key: "based-on",
      text: `Based on: ${AI_BASED_ON_LABEL}`,
      href: buildImagePromptBriefUrl(locationId, image.promptRef)
    });

    return {
      imageId: image.id,
      segments
    };
  }

  segments.push({
    key: "photo",
    text: authorLabel ? `Photo: ${authorLabel}` : "Photo",
    href: null
  });

  if (licenseLabel) {
    segments.push({
      key: "license",
      text: licenseLabel,
      href: normalizeOptionalText(image.licenseUrl)
    });
  }

  segments.push({
    key: "source",
    text: "Wikimedia Commons",
    href: normalizeOptionalText(image.sourcePage)
  });

  return {
    imageId: image.id,
    segments
  };
}

export function buildImagePromptBriefUrl(locationId: string, promptRef?: string) {
  const baseUrl = `${IMAGE_PROMPTS_BASE_URL}/${encodeURIComponent(locationId)}.md`;
  if (!promptRef) {
    return baseUrl;
  }

  const anchor = githubHeadingAnchor(promptRef);
  return anchor.length > 0 ? `${baseUrl}#${anchor}` : baseUrl;
}

export function nextImageIndex(activeIndex: number, imageCount: number, step: number) {
  if (imageCount <= 0) {
    return 0;
  }

  return normalizeCircularIndex(activeIndex + step, imageCount);
}

export function imageIndexesToLoad(activeIndex: number, imageCount: number) {
  if (imageCount <= 0) {
    return [] as number[];
  }

  if (imageCount === 1) {
    return [0];
  }

  const current = normalizeCircularIndex(activeIndex, imageCount);
  const next = nextImageIndex(current, imageCount, 1);
  return [current, next];
}

export function shouldRenderThumbnailRow(imageCount: number) {
  return imageCount > 3;
}
