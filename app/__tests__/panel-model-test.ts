import {
  AI_BASED_ON_LABEL,
  buildImageKindLabel,
  buildImagePromptBriefUrl,
  buildImageCreditFields,
  buildPhotoCreditEntry,
  buildHierarchyItems,
  collectSourceIdsInPanelOrder,
  groupScriptureByBook,
  imageIndexesToLoad,
  isAiReconstructionImage,
  nextImageIndex,
  shouldRenderThumbnailRow
} from "../src/features/place-panel/panel-model";
import type { MediaImageRecord, PlaceIndexRecord, PlaceRecord } from "../src/features/map/types";

describe("place panel model helpers", () => {
  const romanEmpire: PlaceIndexRecord = {
    id: "roman-empire",
    names: { ancient: ["Roman Empire"], alternate: [] },
    type: "empire",
    zoomTier: "region",
    prominence: "standard",
    parentId: null,
    candidates: [{ label: "Rome", coordinates: [12.5, 41.9], confidence: "high" }]
  };

  const achaia: PlaceIndexRecord = {
    id: "achaia",
    names: { ancient: ["Achaia"], alternate: [] },
    type: "province",
    zoomTier: "region",
    prominence: "standard",
    parentId: "roman-empire",
    candidates: [{ label: "Achaia", coordinates: [22.45, 37.89], confidence: "high" }]
  };

  test("renders the Italy hierarchy exception text", () => {
    const italy: PlaceIndexRecord = {
      id: "italy",
      names: { ancient: ["Italy"], modern: "Italy", alternate: [] },
      type: "province",
      zoomTier: "region",
      prominence: "standard",
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
      prominence: "standard",
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
      prominence: "standard",
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
      prominence: "standard",
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

  test("maps image kinds to labels and keeps missing kind unlabeled", () => {
    expect(buildImageKindLabel("modern")).toBe("Today");
    expect(buildImageKindLabel("historical")).toBe("Historical view");
    expect(buildImageKindLabel("site")).toBe("Excavated site");
    expect(buildImageKindLabel("reconstruction")).toBe("Reconstruction");
    expect(buildImageKindLabel("ai-reconstruction")).toBe("AI-generated reconstruction");
    expect(buildImageKindLabel(undefined)).toBeNull();
  });

  test("builds AI research-brief links and uses a fixed source label", () => {
    expect(buildImagePromptBriefUrl("capernaum")).toBe(
      "https://github.com/jameshuangdevelop/interactive-bible-map/blob/main/content/image-prompts/capernaum.md"
    );
    expect(buildImagePromptBriefUrl("capernaum", "Prompt 1: Market overview")).toBe(
      "https://github.com/jameshuangdevelop/interactive-bible-map/blob/main/content/image-prompts/capernaum.md#prompt-1-market-overview"
    );
    expect(AI_BASED_ON_LABEL).toBe("research brief");
  });

  test("supports AI records without Commons-only credit fields", () => {
    const aiImageWithoutCommonsCredits: MediaImageRecord = {
      id: "capernaum-ai-01",
      url: "media/ai/capernaum-ai-01.webp",
      caption: "AI overview reconstruction",
      kind: "ai-reconstruction",
      aiGenerated: true,
      generator: {
        tool: "DALL·E",
        model: "gpt-image-1",
        date: "2026-10-01"
      },
      promptRef: "Prompt 2: Synagogue and harbour",
      basedOn: ["wikidata:Q59174"]
    };

    expect(buildImageCreditFields(aiImageWithoutCommonsCredits)).toEqual({
      authorLabel: null,
      licenseLabel: null,
      toolLabel: "DALL·E"
    });
  });

  test("builds AI photo-credit entries with fixed 'Based on: research brief' wording", () => {
    const aiImage: MediaImageRecord = {
      id: "capernaum-ai-01",
      url: "media/ai/capernaum-ai-01.webp",
      caption: "AI overview reconstruction",
      kind: "ai-reconstruction",
      aiGenerated: true,
      license: "CC0 1.0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      generator: {
        tool: "Google Gemini API (Nano Banana Pro)",
        model: "gemini-3-pro-image",
        date: "2026-10-01"
      },
      promptRef: "Prompt 1: Shoreline overview",
      basedOn: ["wikidata:Q59174"]
    };

    expect(buildPhotoCreditEntry(aiImage, "capernaum").segments).toEqual([
      { key: "ai-label", text: "AI-generated reconstruction", href: null },
      { key: "tool", text: "Google Gemini API (Nano Banana Pro)", href: null },
      {
        key: "license",
        text: "CC0 1.0",
        href: "https://creativecommons.org/publicdomain/zero/1.0/"
      },
      {
        key: "based-on",
        text: "Based on: research brief",
        href: "https://github.com/jameshuangdevelop/interactive-bible-map/blob/main/content/image-prompts/capernaum.md#prompt-1-shoreline-overview"
      }
    ]);
  });

  test("builds commons photo-credit entries with author, license, and source links", () => {
    const commonsImage: MediaImageRecord = {
      id: "capernaum-02",
      kind: "modern",
      url: "https://upload.wikimedia.org/wikipedia/commons/1/1a/example.jpg",
      width: 1600,
      height: 1067,
      author: "Example Author",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourcePage: "https://commons.wikimedia.org/wiki/File:Example.jpg",
      caption: "Example caption",
      aiGenerated: false
    };

    expect(buildPhotoCreditEntry(commonsImage, "capernaum").segments).toEqual([
      { key: "photo", text: "Photo: Example Author", href: null },
      {
        key: "license",
        text: "CC BY-SA 4.0",
        href: "https://creativecommons.org/licenses/by-sa/4.0/"
      },
      {
        key: "source",
        text: "Wikimedia Commons",
        href: "https://commons.wikimedia.org/wiki/File:Example.jpg"
      }
    ]);
  });

  test("computes cyclical image indices and thumbnail-row visibility", () => {
    expect(nextImageIndex(0, 10, 1)).toBe(1);
    expect(nextImageIndex(0, 10, -1)).toBe(9);
    expect(nextImageIndex(9, 10, 1)).toBe(0);
    expect(imageIndexesToLoad(0, 10)).toEqual([0, 1]);
    expect(imageIndexesToLoad(9, 10)).toEqual([9, 0]);
    expect(imageIndexesToLoad(0, 1)).toEqual([0]);
    expect(shouldRenderThumbnailRow(3)).toBe(false);
    expect(shouldRenderThumbnailRow(4)).toBe(true);
  });

  test("treats ai-reconstruction kind and aiGenerated flag as AI images", () => {
    expect(
      isAiReconstructionImage({
        kind: "ai-reconstruction",
        aiGenerated: true
      })
    ).toBe(true);
    expect(
      isAiReconstructionImage({
        kind: "modern",
        aiGenerated: true
      })
    ).toBe(true);
    expect(
      isAiReconstructionImage({
        kind: "modern",
        aiGenerated: false
      })
    ).toBe(false);
  });
});
