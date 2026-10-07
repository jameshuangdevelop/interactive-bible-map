import {
  AI_BASED_ON_LABEL,
  buildAboutPlaceMatchIndex,
  buildImageKindLabel,
  buildImagePromptBriefUrl,
  buildImageCreditFields,
  buildPhotoCreditEntry,
  buildHierarchyItems,
  collectSourceIdsInPanelOrder,
  groupScriptureByBook,
  imageIndexesToLoad,
  isAiReconstructionImage,
  matchAboutPlaceMentions,
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

  const createPlace = ({
    id,
    ancient,
    modern,
    alternate = []
  }: {
    id: string;
    ancient: string[];
    modern?: string;
    alternate?: string[];
  }): PlaceIndexRecord => ({
    id,
    names: {
      ancient,
      alternate,
      ...(modern ? { modern } : {})
    },
    type: "city",
    zoomTier: "city",
    prominence: "standard",
    parentId: null,
    candidates: [{ label: ancient[0] ?? id, coordinates: [1, 1], confidence: "high" }]
  });

  const matchMentions = ({
    places,
    currentPlaceId,
    paragraphs
  }: {
    places: PlaceIndexRecord[];
    currentPlaceId: string;
    paragraphs: string[];
  }) =>
    matchAboutPlaceMentions({
      matchIndex: buildAboutPlaceMatchIndex(places),
      currentPlaceId,
      paragraphs
    });

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

  test("matches longer unique names before shorter overlapping names", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "jerusalem", ancient: ["Jerusalem"] }),
      createPlace({
        id: "bethany-beyond-the-jordan",
        ancient: ["Bethany beyond the Jordan"],
        alternate: ["Bethany"]
      }),
      createPlace({ id: "bethany", ancient: ["Bethany"] })
    ];

    const matches = matchMentions({
      places,
      currentPlaceId: "jerusalem",
      paragraphs: ["Pilgrims crossed Bethany beyond the Jordan before returning by Bethany."]
    });

    expect(matches).toEqual([
      {
        placeId: "bethany-beyond-the-jordan",
        paragraphIndex: 0,
        start: 17,
        end: 42,
        text: "Bethany beyond the Jordan"
      }
    ]);
  });

  test("matches only whole words", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "jerusalem", ancient: ["Jerusalem"] }),
      createPlace({ id: "galilee", ancient: ["Galilee"] })
    ];

    const matches = matchMentions({
      places,
      currentPlaceId: "jerusalem",
      paragraphs: ["A Galileean village was nearby; Galilee remained a region in the north."]
    });

    expect(matches).toEqual([
      {
        placeId: "galilee",
        paragraphIndex: 0,
        start: 32,
        end: 39,
        text: "Galilee"
      }
    ]);
  });

  test("skips names shared by multiple places", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "jerusalem", ancient: ["Jerusalem"] }),
      createPlace({
        id: "antioch-on-the-orontes",
        ancient: ["Antioch on the Orontes"],
        alternate: ["Antioch"]
      }),
      createPlace({
        id: "antioch-in-pisidia",
        ancient: ["Antioch in Pisidia"],
        alternate: ["Antioch"]
      })
    ];

    const matches = matchMentions({
      places,
      currentPlaceId: "jerusalem",
      paragraphs: ["Travelers gathered at Antioch before sailing west."]
    });

    expect(matches).toEqual([]);
  });

  test("skips the place itself", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "galilee", ancient: ["Galilee"] }),
      createPlace({ id: "capernaum", ancient: ["Capernaum"] })
    ];

    const matches = matchMentions({
      places,
      currentPlaceId: "galilee",
      paragraphs: ["Galilee included Capernaum on its shore."]
    });

    expect(matches).toEqual([
      {
        placeId: "capernaum",
        paragraphIndex: 0,
        start: 17,
        end: 26,
        text: "Capernaum"
      }
    ]);
  });

  test("links only the first mention of each place across the full About", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "jerusalem", ancient: ["Jerusalem"] }),
      createPlace({ id: "capernaum", ancient: ["Capernaum"] })
    ];

    const matches = matchMentions({
      places,
      currentPlaceId: "jerusalem",
      paragraphs: [
        "Capernaum was active during the ministry years.",
        "Later, Capernaum remained important in memory."
      ]
    });

    expect(matches).toEqual([
      {
        placeId: "capernaum",
        paragraphIndex: 0,
        start: 0,
        end: 9,
        text: "Capernaum"
      }
    ]);
  });

  test("matches possessive mentions", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "jerusalem", ancient: ["Jerusalem"] }),
      createPlace({ id: "rome", ancient: ["Rome"] })
    ];

    const matches = matchMentions({
      places,
      currentPlaceId: "jerusalem",
      paragraphs: ["Rome's roads shaped travel."]
    });

    expect(matches).toEqual([
      {
        placeId: "rome",
        paragraphIndex: 0,
        start: 0,
        end: 4,
        text: "Rome"
      }
    ]);
  });

  test("matches hyphen-adjacent mentions", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "jerusalem", ancient: ["Jerusalem"] }),
      createPlace({ id: "antioch", ancient: ["Antioch"] })
    ];

    const matches = matchMentions({
      places,
      currentPlaceId: "jerusalem",
      paragraphs: ["Antioch-based trade shaped travel."]
    });

    expect(matches).toEqual([
      {
        placeId: "antioch",
        paragraphIndex: 0,
        start: 0,
        end: 7,
        text: "Antioch"
      }
    ]);
  });

  test("matches names with diacritics", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "ephesus", ancient: ["Ephesus"] }),
      createPlace({ id: "selcuk", ancient: ["Selçuk"] })
    ];

    const matches = matchMentions({
      places,
      currentPlaceId: "ephesus",
      paragraphs: ["Trade routes connected directly to Selçuk in the valley."]
    });

    expect(matches).toEqual([
      {
        placeId: "selcuk",
        paragraphIndex: 0,
        start: 35,
        end: 41,
        text: "Selçuk"
      }
    ]);
  });

  test("does not link modern country names", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "corinth", ancient: ["Corinth"] }),
      createPlace({ id: "achaia", ancient: ["Achaia"], alternate: ["Greece"] }),
      createPlace({ id: "italia", ancient: ["Italia"], alternate: ["Italy"] })
    ];

    const matches = matchMentions({
      places,
      currentPlaceId: "corinth",
      paragraphs: ["Travelers sailed across Greece and then crossed into Italy."]
    });

    expect(matches).toEqual([]);
  });

  test("skips known false About links from final assembled texts", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "asia", ancient: ["Asia"] }),
      createPlace({ id: "temple-mount", ancient: ["The Temple", "Herod's Temple"] }),
      createPlace({ id: "caesarea-maritima", ancient: ["Caesarea"] }),
      createPlace({ id: "bethany", ancient: ["Bethany"] }),
      createPlace({ id: "crete", ancient: ["Crete"] }),
      createPlace({ id: "antioch-pisidia", ancient: ["Antioch in Pisidia"] }),
      createPlace({ id: "athens", ancient: ["Athens"] }),
      createPlace({ id: "bethany-beyond-the-jordan", ancient: ["Bethany beyond the Jordan"] }),
      createPlace({ id: "bithynia", ancient: ["Bithynia"] }),
      createPlace({ id: "caesarea-philippi", ancient: ["Caesarea Philippi"] }),
      createPlace({ id: "cappadocia", ancient: ["Cappadocia"] }),
      createPlace({ id: "cilicia", ancient: ["Cilicia"] }),
      createPlace({ id: "corinth", ancient: ["Corinth"] }),
      createPlace({ id: "crete-cyrene", ancient: ["Crete and Cyrene"] }),
      createPlace({ id: "ephesus", ancient: ["Ephesus"] }),
      createPlace({ id: "galatia", ancient: ["Galatia"] }),
      createPlace({ id: "lycaonia", ancient: ["Lycaonia"] }),
      createPlace({ id: "mount-of-olives", ancient: ["Mount of Olives"] }),
      createPlace({ id: "mysia", ancient: ["Mysia"] }),
      createPlace({ id: "pamphylia", ancient: ["Pamphylia"] }),
      createPlace({ id: "parthian-empire", ancient: ["Parthian Empire"] }),
      createPlace({ id: "perga", ancient: ["Perga"] }),
      createPlace({ id: "philadelphia-lydia", ancient: ["Philadelphia"] }),
      createPlace({ id: "phrygia", ancient: ["Phrygia"] }),
      createPlace({ id: "pisidia", ancient: ["Pisidia"] }),
      createPlace({ id: "pontus", ancient: ["Pontus"] }),
      createPlace({ id: "sardis", ancient: ["Sardis"] }),
      createPlace({ id: "troas", ancient: ["Troas"] })
    ];

    const blockedScenarios: Array<{
      label: string;
      currentPlaceId: string;
      paragraph: string;
      blockedPlaceId: string;
      blockedText: string;
    }> = [
      {
        label: "bithynia-northwestern-asia-minor",
        currentPlaceId: "bithynia",
        paragraph:
          "Bithynia was a coastal province in northwestern Asia Minor, bequeathed to Rome by its last king in 74 BC.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "cappadocia-eastern-asia-minor",
        currentPlaceId: "cappadocia",
        paragraph:
          "Cappadocia was a Roman province in eastern Asia Minor, a kingdom until Rome annexed it in AD 17.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "cilicia-southeastern-asia-minor",
        currentPlaceId: "cilicia",
        paragraph:
          "Cilicia was the region of southeastern Asia Minor enclosed by the Taurus Mountains and the sea.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "galatia-central-asia-minor",
        currentPlaceId: "galatia",
        paragraph:
          "Galatia was both an ethnic homeland of Celtic settlers in the highlands of central Asia Minor and, from 25 BC, a much larger Roman province of the same name.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "lycaonia-central-southern-asia-minor",
        currentPlaceId: "lycaonia",
        paragraph: "Lycaonia was a plain in the central-southern part of Asia Minor.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "mysia-northwestern-asia-minor",
        currentPlaceId: "mysia",
        paragraph:
          "Mysia was a region of northwestern Asia Minor whose boundaries were never clearly fixed.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "pamphylia-southern-asia-minor",
        currentPlaceId: "pamphylia",
        paragraph: "Pamphylia was a narrow, fertile coastal plain in southern Asia Minor.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "perga-southern-asia-minor",
        currentPlaceId: "perga",
        paragraph: "Perga was a major city of Pamphylia in southern Asia Minor.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "philadelphia-lydia-asia-minor",
        currentPlaceId: "philadelphia-lydia",
        paragraph:
          "Philadelphia guarded the gateway to the high central plateau of Asia Minor and stood at the edge of the Katakekaumene.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "phrygia-central-asia-minor",
        currentPlaceId: "phrygia",
        paragraph: "Phrygia was a large, mountainous region of central Asia Minor.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "pisidia-southern-asia-minor",
        currentPlaceId: "pisidia",
        paragraph:
          "Pisidia was the rugged mountain country of southern Asia Minor, reaching north from the Taurus range behind the Pamphylian coast.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "pontus-northeastern-asia-minor",
        currentPlaceId: "pontus",
        paragraph:
          "Pontus was the country of northeastern Asia Minor on the southern side of the Black Sea.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "troas-northwestern-coast-asia-minor",
        currentPlaceId: "troas",
        paragraph:
          "Alexandria Troas was a Roman colony and port city near the northwestern coast of Asia Minor, close to the site of ancient Troy.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "parthian-central-asia",
        currentPlaceId: "parthian-empire",
        paragraph:
          "The Parthians began as the Parni, nomads from the steppes of Central Asia who seized the Seleucid satrapy of Parthia in the third century BC and took its name.",
        blockedPlaceId: "asia",
        blockedText: "Asia"
      },
      {
        label: "athens-temple-of-athena-nike",
        currentPlaceId: "athens",
        paragraph:
          "The Acropolis still carried its great fifth-century BC buildings nearly intact, including the small temple of Athena Nike.",
        blockedPlaceId: "temple-mount",
        blockedText: "temple"
      },
      {
        label: "corinth-temple-of-apollo",
        currentPlaceId: "corinth",
        paragraph:
          "Its best-known standing monument is the Temple of Apollo, built in the sixth century BC.",
        blockedPlaceId: "temple-mount",
        blockedText: "Temple"
      },
      {
        label: "ephesus-temple-of-artemis",
        currentPlaceId: "ephesus",
        paragraph:
          "The city's greatest landmark was the Temple of Artemis, one of the Seven Wonders of the ancient world.",
        blockedPlaceId: "temple-mount",
        blockedText: "Temple"
      },
      {
        label: "sardis-temple-of-artemis",
        currentPlaceId: "sardis",
        paragraph:
          "Today Sardis is an archaeological site where excavations continue to uncover the Temple of Artemis and the Roman-era bath complex.",
        blockedPlaceId: "temple-mount",
        blockedText: "Temple"
      },
      {
        label: "philadelphia-lydia-temple-of-my-god",
        currentPlaceId: "philadelphia-lydia",
        paragraph:
          "The risen Christ promises that whoever overcomes will become a pillar in the temple of my God.",
        blockedPlaceId: "temple-mount",
        blockedText: "temple"
      },
      {
        label: "caesarea-maritima-herods-temple",
        currentPlaceId: "caesarea-maritima",
        paragraph:
          "Today visitors to the site can see the ruins of a cathedral built where Herod's temple had stood.",
        blockedPlaceId: "temple-mount",
        blockedText: "Herod's temple"
      },
      {
        label: "mount-of-olives-temple-mount-span",
        currentPlaceId: "mount-of-olives",
        paragraph:
          "The Mount of Olives is the ridge east of Jerusalem's Old City, separated from the city and the Temple Mount by the Kidron Valley.",
        blockedPlaceId: "temple-mount",
        blockedText: "the Temple"
      },
      {
        label: "antioch-pisidia-colonia-caesarea",
        currentPlaceId: "antioch-pisidia",
        paragraph:
          "Antioch in Pisidia is also recorded under the additional name 'Col. Caesarea' (Colonia Caesarea), reflecting Roman colonial status.",
        blockedPlaceId: "caesarea-maritima",
        blockedText: "Caesarea"
      },
      {
        label: "caesarea-philippi-self-name",
        currentPlaceId: "caesarea-philippi",
        paragraph:
          "Caesarea Philippi was a city at the southwest foot of Mount Hermon, near the principal spring source of the Jordan River.",
        blockedPlaceId: "caesarea-maritima",
        blockedText: "Caesarea"
      },
      {
        label: "caesarea-philippi-self-short-name-in-history",
        currentPlaceId: "caesarea-philippi",
        paragraph:
          "Herod Philip built Caesarea at Paneas, in his tetrarchy.",
        blockedPlaceId: "caesarea-maritima",
        blockedText: "Caesarea"
      },
      {
        label: "bethany-beyond-the-jordan-self-name",
        currentPlaceId: "bethany-beyond-the-jordan",
        paragraph:
          "Bethany beyond the Jordan was a place in the Jordan Valley that John's Gospel names as where John the Baptist was baptizing.",
        blockedPlaceId: "bethany",
        blockedText: "Bethany"
      },
      {
        label: "bethany-beyond-the-jordan-self-short-name-in-history",
        currentPlaceId: "bethany-beyond-the-jordan",
        paragraph:
          "The third-century scholar Origen could not find a village called Bethany east of the Jordan in his own day.",
        blockedPlaceId: "bethany",
        blockedText: "Bethany"
      },
      {
        label: "crete-cyrene-self-name",
        currentPlaceId: "crete-cyrene",
        paragraph: "Crete and Cyrene was a senatorial province on the North African coast.",
        blockedPlaceId: "crete",
        blockedText: "Crete"
      }
    ];

    const failures: string[] = [];
    for (const scenario of blockedScenarios) {
      const matches = matchMentions({
        places,
        currentPlaceId: scenario.currentPlaceId,
        paragraphs: [scenario.paragraph]
      });

      const hasBlockedMatch = matches.some(
        (match) =>
          match.placeId === scenario.blockedPlaceId && match.text.includes(scenario.blockedText)
      );
      if (hasBlockedMatch) {
        failures.push(`${scenario.label}: ${JSON.stringify(matches)}`);
      }
    }

    expect(failures).toEqual([]);
  });

  test("keeps approved About links from final assembled texts", () => {
    const places: PlaceIndexRecord[] = [
      createPlace({ id: "jerusalem", ancient: ["Jerusalem"] }),
      createPlace({ id: "temple-mount", ancient: ["The Temple", "Herod's Temple"] }),
      createPlace({ id: "asia", ancient: ["Asia"] }),
      createPlace({ id: "colossae", ancient: ["Colossae"] }),
      createPlace({ id: "macedonia", ancient: ["Macedonia"] }),
      createPlace({ id: "achaia", ancient: ["Achaia"] }),
      createPlace({ id: "cyprus", ancient: ["Cyprus"] }),
      createPlace({ id: "salamis", ancient: ["Salamis"] }),
      createPlace({ id: "paphos", ancient: ["Paphos"] }),
      createPlace({ id: "philippi", ancient: ["Philippi"] }),
      createPlace({ id: "neapolis", ancient: ["Neapolis"] }),
      createPlace({
        id: "pool-of-siloam",
        modern: "Pool of Siloam",
        ancient: ["Siloam"]
      })
    ];

    const jerusalemTempleMatches = matchMentions({
      places,
      currentPlaceId: "jerusalem",
      paragraphs: [
        "The Gospels set Jesus' final days, trial, death and resurrection appearances in Jerusalem, and describe him at the Temple there."
      ]
    });
    expect(jerusalemTempleMatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          placeId: "temple-mount",
          text: "the Temple"
        })
      ])
    );

    const provinceOfAsiaMatches = matchMentions({
      places,
      currentPlaceId: "colossae",
      paragraphs: [
        "Colossae was a city of the Lycus River valley in the Roman province of Asia."
      ]
    });
    expect(provinceOfAsiaMatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          placeId: "asia",
          text: "Asia"
        })
      ])
    );

    const macedoniaAndAchaiaMatches = matchMentions({
      places,
      currentPlaceId: "jerusalem",
      paragraphs: [
        "Paul's letters describe a collection from the churches of Macedonia and Achaia for the poor among the saints in Jerusalem."
      ]
    });
    expect(macedoniaAndAchaiaMatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          placeId: "macedonia",
          text: "Macedonia"
        }),
        expect.objectContaining({
          placeId: "achaia",
          text: "Achaia"
        })
      ])
    );

    const salamisToPaphosMatches = matchMentions({
      places,
      currentPlaceId: "cyprus",
      paragraphs: [
        "Barnabas and Saul sailed to Cyprus and went through the island from Salamis to Paphos."
      ]
    });
    expect(salamisToPaphosMatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          placeId: "salamis",
          text: "Salamis"
        }),
        expect.objectContaining({
          placeId: "paphos",
          text: "Paphos"
        })
      ])
    );

    const neapolisMatches = matchMentions({
      places,
      currentPlaceId: "philippi",
      paragraphs: [
        "Philippi was linked to its port of Neapolis nine miles to the south by a road over the Symbolum ridge."
      ]
    });
    expect(neapolisMatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          placeId: "neapolis",
          text: "Neapolis"
        })
      ])
    );

    const poolOfSiloamMatches = matchMentions({
      places,
      currentPlaceId: "jerusalem",
      paragraphs: [
        "Archaeologists uncovered a monumental stepped pool from the Second Temple period, identified as the Pool of Siloam."
      ]
    });
    expect(poolOfSiloamMatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          placeId: "pool-of-siloam"
        })
      ])
    );
  });
});
