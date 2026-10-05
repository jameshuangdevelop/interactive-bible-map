import type { PlaceNames } from "./types";

const COUNTRY_DISPLAY_NAME_OVERRIDES: Readonly<Record<string, string>> = Object.freeze({
  "west bank": "the West Bank",
  "golan heights": "the Golan Heights"
});
const combiningMarksPattern = /\p{M}+/gu;
const wordPattern = /[\p{L}\p{N}]+/gu;

function normalizeDisplayText(value: string | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizedKey(value: string) {
  return value.normalize("NFKD").replace(combiningMarksPattern, "").toLowerCase();
}

function splitWords(value: string) {
  return normalizedKey(value).match(wordPattern) ?? [];
}

function containsWordSequence(haystackWords: string[], needleWords: string[]) {
  if (needleWords.length === 0 || haystackWords.length < needleWords.length) {
    return false;
  }

  for (let startIndex = 0; startIndex <= haystackWords.length - needleWords.length; startIndex += 1) {
    let matched = true;
    for (let offset = 0; offset < needleWords.length; offset += 1) {
      if (haystackWords[startIndex + offset] !== needleWords[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return true;
    }
  }

  return false;
}

function modernNameContainsCountryAsWholeWords(modernNameWords: string[], country: string) {
  return containsWordSequence(modernNameWords, splitWords(country));
}

function toDisplayCountryLabel(country: string, includeArticle: boolean) {
  if (!includeArticle) {
    return country;
  }

  return COUNTRY_DISPLAY_NAME_OVERRIDES[normalizedKey(country)] ?? country;
}

function joinCountries(countries: string[]) {
  if (countries.length === 0) {
    return null;
  }

  if (countries.length === 1) {
    return countries[0];
  }

  if (countries.length === 2) {
    return `${countries[0]} and ${countries[1]}`;
  }

  return `${countries.slice(0, -1).join(", ")} and ${countries[countries.length - 1]}`;
}

export function buildModernLocationLabel(names: Pick<PlaceNames, "modern" | "modernCountries">) {
  const modernName = normalizeDisplayText(names.modern);
  const modernNameWords = modernName ? splitWords(modernName) : [];
  const seenCountries = new Set<string>();
  const modernCountries = (names.modernCountries ?? [])
    .map((country) => normalizeDisplayText(country))
    .filter((country): country is string => country !== null)
    .filter((country) => {
      const key = normalizedKey(country);
      if (seenCountries.has(key)) {
        return false;
      }

      seenCountries.add(key);
      return true;
    })
    .filter((country) => {
      if (modernNameWords.length === 0) {
        return true;
      }

      return !modernNameContainsCountryAsWholeWords(modernNameWords, country);
    });

  const countriesForDisplay = modernCountries.map((country, index) =>
    toDisplayCountryLabel(country, modernName ? index > 0 : true)
  );

  const countriesText = joinCountries(countriesForDisplay);
  if (modernName && countriesText) {
    return `${modernName}, ${countriesText}`;
  }

  if (modernName) {
    return modernName;
  }

  if (countriesText) {
    return countriesText;
  }

  return null;
}
