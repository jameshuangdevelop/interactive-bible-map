import { getPrimaryPlaceName } from "../map/place-visibility";
import type {
  Confidence,
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

export interface GroupedScriptureBook {
  book: string;
  passages: ScriptureEntry[];
}

export interface HierarchyItem {
  label: string;
  placeId: string | null;
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
