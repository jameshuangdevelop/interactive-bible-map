export const CANONICAL_BOOKS = Object.freeze([
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
]);

export const OLD_TESTAMENT_BOOKS = new Set(CANONICAL_BOOKS.slice(0, 39));

export const VPL_BOOK_CODE_TO_NAME = Object.freeze({
  GEN: "Genesis",
  EXO: "Exodus",
  LEV: "Leviticus",
  NUM: "Numbers",
  DEU: "Deuteronomy",
  JOS: "Joshua",
  JDG: "Judges",
  RUT: "Ruth",
  "1SA": "1 Samuel",
  "2SA": "2 Samuel",
  "1KI": "1 Kings",
  "2KI": "2 Kings",
  "1CH": "1 Chronicles",
  "2CH": "2 Chronicles",
  EZR: "Ezra",
  NEH: "Nehemiah",
  EST: "Esther",
  JOB: "Job",
  PSA: "Psalms",
  PRO: "Proverbs",
  ECC: "Ecclesiastes",
  SOL: "Song of Solomon",
  ISA: "Isaiah",
  JER: "Jeremiah",
  LAM: "Lamentations",
  EZE: "Ezekiel",
  DAN: "Daniel",
  HOS: "Hosea",
  JOE: "Joel",
  AMO: "Amos",
  OBA: "Obadiah",
  JON: "Jonah",
  MIC: "Micah",
  NAH: "Nahum",
  HAB: "Habakkuk",
  ZEP: "Zephaniah",
  HAG: "Haggai",
  ZEC: "Zechariah",
  MAL: "Malachi",
  MAT: "Matthew",
  MAR: "Mark",
  LUK: "Luke",
  JOH: "John",
  ACT: "Acts",
  ROM: "Romans",
  "1CO": "1 Corinthians",
  "2CO": "2 Corinthians",
  GAL: "Galatians",
  EPH: "Ephesians",
  PHI: "Philippians",
  COL: "Colossians",
  "1TH": "1 Thessalonians",
  "2TH": "2 Thessalonians",
  "1TI": "1 Timothy",
  "2TI": "2 Timothy",
  TIT: "Titus",
  PHM: "Philemon",
  HEB: "Hebrews",
  JAM: "James",
  "1PE": "1 Peter",
  "2PE": "2 Peter",
  "1JO": "1 John",
  "2JO": "2 John",
  "3JO": "3 John",
  JUD: "Jude",
  REV: "Revelation"
});

const REFERENCE_PATTERN =
  /^(?<book>(?:[1-3] )?[A-Za-z]+(?: [A-Za-z]+)*) (?<chapter>[1-9][0-9]*):(?<startVerse>[1-9][0-9]*)(?:-(?<endVerse>[1-9][0-9]*))?$/u;

export function parseReference(reference) {
  const trimmed = reference.trim();
  const match = REFERENCE_PATTERN.exec(trimmed);

  if (!match?.groups) {
    throw new Error(`Invalid scripture reference format: ${reference}`);
  }

  const chapter = Number.parseInt(match.groups.chapter, 10);
  const startVerse = Number.parseInt(match.groups.startVerse, 10);
  const endVerse = match.groups.endVerse
    ? Number.parseInt(match.groups.endVerse, 10)
    : startVerse;

  if (endVerse < startVerse) {
    throw new Error(
      `Invalid scripture range in ${reference}: end verse is before start verse`
    );
  }

  return {
    book: match.groups.book,
    chapter,
    startVerse,
    endVerse
  };
}
