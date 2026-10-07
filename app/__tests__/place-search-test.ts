import fs from "node:fs";
import path from "node:path";

import { normalizeForSearch, searchPlacesByName } from "../src/features/search/place-search";
import type { PlaceIndexRecord } from "../src/features/map/types";

function loadPlacesFromDataRecords(): PlaceIndexRecord[] {
  const repositoryRoot = path.resolve(__dirname, "..", "..");
  const locationsDirectory = path.join(repositoryRoot, "data", "locations");
  const fileNames = fs
    .readdirSync(locationsDirectory, { withFileTypes: true })
    .filter((entry: fs.Dirent) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry: fs.Dirent) => entry.name)
    .sort((left: string, right: string) => left.localeCompare(right));

  return fileNames.map((fileName: string) => {
    const payload = JSON.parse(
      fs.readFileSync(path.join(locationsDirectory, fileName), "utf8")
    ) as {
      id: string;
      names: { ancient?: string[]; modern?: string; alternate?: string[] };
      type: PlaceIndexRecord["type"];
      zoomTier: PlaceIndexRecord["zoomTier"];
      prominence: PlaceIndexRecord["prominence"];
      scripture?: unknown[];
      parentId?: string;
      candidates?: PlaceIndexRecord["candidates"];
    };

    return {
      id: payload.id,
      names: {
        ancient: payload.names?.ancient ?? [],
        modern: payload.names?.modern,
        alternate: payload.names?.alternate ?? []
      },
      type: payload.type,
      zoomTier: payload.zoomTier,
      prominence: payload.prominence,
      passageCount: Array.isArray(payload.scripture) ? payload.scripture.length : 0,
      parentId: payload.parentId ?? null,
      candidates: payload.candidates ?? []
    };
  });
}

const allPlaces = loadPlacesFromDataRecords();

describe("place-name search", () => {
  test("returns both Antioch records", () => {
    const results = searchPlacesByName(allPlaces, "Antioch");
    const antiochIds = results.map((result) => result.place.id);

    expect(antiochIds).toEqual(
      expect.arrayContaining(["antioch-pisidia", "antioch-syria"])
    );
    expect(antiochIds.filter((id) => id === "antioch-pisidia" || id === "antioch-syria")).toHaveLength(
      2
    );
  });

  test("finds Malta by Melita and Berea by Beroea with also-name notes", () => {
    const melitaResults = searchPlacesByName(allPlaces, "melita");
    expect(melitaResults[0]?.place.id).toBe("malta");
    expect(melitaResults[0]?.alsoName).toBe("Melita");

    const beroeaResults = searchPlacesByName(allPlaces, "beroea");
    const bereaResult = beroeaResults.find((result) => result.place.id === "berea");
    expect(bereaResult).toBeDefined();
    expect(bereaResult?.alsoName).toBe("Beroea");
  });

  test("finds Capernaum with one typo", () => {
    const results = searchPlacesByName(allPlaces, "capernam");
    expect(results.some((result) => result.place.id === "capernaum")).toBe(true);
  });

  test("does not match modern or non-English names", () => {
    expect(searchPlacesByName(allPlaces, "al-quds")).toHaveLength(0);
    expect(searchPlacesByName(allPlaces, "imwas")).toHaveLength(0);
    expect(searchPlacesByName(allPlaces, "alasehir")).toHaveLength(0);
  });

  test("ranks Corinth first for 'cor'", () => {
    const results = searchPlacesByName(allPlaces, "cor");
    expect(results[0]?.place.id).toBe("corinth");
  });

  test("returns no results for verse-like queries", () => {
    expect(searchPlacesByName(allPlaces, "John 3:16")).toHaveLength(0);
  });

  test("can find every indexed ancient and alternate name", () => {
    for (const place of allPlaces) {
      for (const name of [...place.names.ancient, ...place.names.alternate]) {
        const query = normalizeForSearch(name);
        const results = searchPlacesByName(allPlaces, query);
        expect(
          results.some((result) => result.place.id === place.id)
        ).toBe(true);
      }
    }
  });

  test("ignores diacritics while matching", () => {
    const syntheticPlace: PlaceIndexRecord = {
      id: "accent-fixture",
      names: {
        ancient: ["Capernaüm"],
        alternate: []
      },
      type: "city",
      zoomTier: "city",
      prominence: "standard",
      passageCount: 1,
      parentId: null,
      candidates: [{ label: "Capernaüm", coordinates: [35.5, 32.9], confidence: "high" }]
    };

    const results = searchPlacesByName([syntheticPlace], "capernaum");
    expect(results[0]?.place.id).toBe("accent-fixture");
  });

  test("adds countries to the search subtitle when a place has one modern site", () => {
    const syntheticPlace: PlaceIndexRecord = {
      id: "ephesus-fixture",
      names: {
        ancient: ["Ephesus"],
        modern: "Selçuk",
        modernCountries: ["Türkiye"],
        alternate: []
      },
      type: "city",
      zoomTier: "city",
      prominence: "major",
      passageCount: 26,
      parentId: null,
      candidates: [{ label: "Selçuk", coordinates: [27.35, 37.95], confidence: "high" }]
    };

    const results = searchPlacesByName([syntheticPlace], "eph");
    expect(results[0]?.subtitle).toBe("Selçuk, Türkiye · City");
  });

  test("uses countries-only subtitle for several-candidate records without one modern name", () => {
    const syntheticPlace: PlaceIndexRecord = {
      id: "multi-site-fixture",
      names: {
        ancient: ["Multi-site fixture"],
        modernCountries: ["Jordan", "West Bank"],
        alternate: []
      },
      type: "site",
      zoomTier: "site",
      prominence: "standard",
      passageCount: 0,
      parentId: null,
      candidates: [
        { label: "Candidate A", coordinates: [35.5, 31.7], confidence: "high" },
        { label: "Candidate B", coordinates: [35.6, 31.71], confidence: "low" }
      ]
    };

    const results = searchPlacesByName([syntheticPlace], "multi-site");
    expect(results[0]?.subtitle).toBe("Jordan and the West Bank · Site");
  });

  test("keeps disputed subtitle format for disputed places", () => {
    const disputedPlace: PlaceIndexRecord = {
      id: "disputed-fixture",
      names: {
        ancient: ["Emmaus fixture"],
        modernCountries: ["Israel", "West Bank"],
        alternate: []
      },
      type: "village",
      zoomTier: "city",
      prominence: "standard",
      passageCount: 2,
      parentId: null,
      candidates: [
        { label: "Candidate A", coordinates: [34.9, 31.8], confidence: "disputed" },
        { label: "Candidate B", coordinates: [35.0, 31.85], confidence: "low" }
      ]
    };

    const results = searchPlacesByName([disputedPlace], "emmaus");
    expect(results[0]?.subtitle).toBe("Disputed · 2 proposed sites · Village");
  });
});
