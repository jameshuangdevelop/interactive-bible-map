import {
  buildHierarchyItems,
  collectSourceIdsInPanelOrder,
  groupScriptureByBook
} from "../src/features/place-panel/panel-model";
import type { PlaceIndexRecord, PlaceRecord } from "../src/features/map/types";

describe("place panel model helpers", () => {
  const romanEmpire: PlaceIndexRecord = {
    id: "roman-empire",
    names: { ancient: ["Roman Empire"], alternate: [] },
    type: "empire",
    zoomTier: "region",
    parentId: null,
    candidates: [{ label: "Rome", coordinates: [12.5, 41.9], confidence: "high" }]
  };

  const achaia: PlaceIndexRecord = {
    id: "achaia",
    names: { ancient: ["Achaia"], alternate: [] },
    type: "province",
    zoomTier: "region",
    parentId: "roman-empire",
    candidates: [{ label: "Achaia", coordinates: [22.45, 37.89], confidence: "high" }]
  };

  test("renders the Italy hierarchy exception text", () => {
    const italy: PlaceIndexRecord = {
      id: "italy",
      names: { ancient: ["Italy"], modern: "Italy", alternate: [] },
      type: "province",
      zoomTier: "region",
      parentId: "roman-empire",
      candidates: [{ label: "Italy", coordinates: [11.09, 43.69], confidence: "high" }]
    };

    const items = buildHierarchyItems(
      italy,
      new Map([
        [romanEmpire.id, romanEmpire],
        [italy.id, italy]
      ])
    );

    expect(items).toEqual([
      {
        label: "Governed directly from Rome",
        placeId: null
      },
      {
        label: "Roman Empire",
        placeId: "roman-empire"
      }
    ]);
  });

  test("renders the Arabia hierarchy exception text without empire suffix", () => {
    const arabia: PlaceIndexRecord = {
      id: "arabia",
      names: { ancient: ["Arabia"], alternate: [] },
      type: "province",
      zoomTier: "region",
      parentId: "roman-empire",
      candidates: [{ label: "Arabia", coordinates: [35.0, 30.0], confidence: "high" }]
    };

    const items = buildHierarchyItems(
      arabia,
      new Map([
        [romanEmpire.id, romanEmpire],
        [arabia.id, arabia]
      ])
    );

    expect(items).toEqual([
      {
        label: "Client kingdom allied with Rome",
        placeId: null
      }
    ]);
  });

  test("renders type, parent, and empire for city records", () => {
    const corinth: PlaceIndexRecord = {
      id: "corinth",
      names: { ancient: ["Corinth"], alternate: [] },
      type: "city",
      zoomTier: "city",
      parentId: "achaia",
      candidates: [{ label: "Corinth", coordinates: [22.88, 37.9], confidence: "high" }]
    };

    const items = buildHierarchyItems(
      corinth,
      new Map([
        [romanEmpire.id, romanEmpire],
        [achaia.id, achaia],
        [corinth.id, corinth]
      ])
    );

    expect(items).toEqual([
      { label: "City", placeId: null },
      { label: "Achaia", placeId: "achaia" },
      { label: "Roman Empire", placeId: "roman-empire" }
    ]);
  });

  test("shows only 'Empire' for empire records", () => {
    expect(
      buildHierarchyItems(romanEmpire, new Map([[romanEmpire.id, romanEmpire]]))
    ).toEqual([{ label: "Empire", placeId: null }]);
  });

  test("groups scripture by canonical order", () => {
    const grouped = groupScriptureByBook([
      { ref: "John 4:46", book: "John", textWEB: "..." },
      { ref: "Matthew 4:13", book: "Matthew", textWEB: "..." },
      { ref: "Mark 1:21", book: "Mark", textWEB: "..." }
    ]);

    expect(grouped.map((entry) => entry.book)).toEqual(["Matthew", "Mark", "John"]);
  });

  test("collects unique source IDs in panel-display order", () => {
    const record: PlaceRecord = {
      id: "example",
      names: { ancient: ["Example"], alternate: [] },
      type: "city",
      zoomTier: "city",
      parentId: null,
      candidates: [
        {
          label: "Example",
          coordinates: [1, 2],
          confidence: "high",
          coordinateSource: "wikidata:Q1",
          support: "Support text",
          sources: ["wikidata:Q1", "openbible:example"]
        }
      ],
      summary: {
        text: "Summary",
        sources: ["openbible:example", "scripture:Mark 1:21"]
      },
      history: [
        {
          text: "History",
          sources: ["bib:sample"]
        }
      ],
      scripture: [],
      otConnections: [
        {
          ref: "Isaiah 9:1",
          note: "Note",
          sources: ["scripture:Isaiah 9:1", "bib:sample"]
        }
      ],
      politicalHistory: [],
      status: "verified",
      verifiedBy: "fact-checker",
      lastReviewed: "2026-09-30"
    };

    expect(collectSourceIdsInPanelOrder(record)).toEqual([
      "wikidata:Q1",
      "openbible:example",
      "scripture:Mark 1:21",
      "bib:sample",
      "scripture:Isaiah 9:1"
    ]);
  });
});
