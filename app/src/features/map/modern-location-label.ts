import type { PlaceNames } from "./types";

const COUNTRY_DISPLAY_NAME_OVERRIDES: Readonly<Record<string, string>> = Object.freeze({
  "west bank": "the West Bank",
  "golan heights": "the Golan Heights"
});
const combiningMarksPattern = /\p{M}+/gu;

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

function toDisplayCountryLabel(country: string) {
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
  const normalizedModernName = modernName ? normalizedKey(modernName) : null;
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
      if (!normalizedModernName) {
        return true;
      }

      return !normalizedModernName.includes(normalizedKey(country));
    })
    .map((country) => toDisplayCountryLabel(country));

  const countriesText = joinCountries(modernCountries);
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
