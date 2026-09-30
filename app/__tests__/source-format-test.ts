import { formatSourceCitation } from "../src/features/place-panel/source-format";

describe("source citation formatting", () => {
  const bibliographyById = new Map([
    [
      "sample-book",
      {
        id: "sample-book",
        type: "book" as const,
        title: "Sample Book",
        authors: ["Author One", "Author Two"],
        year: 2026,
        publisher: "Sample Press",
        url: "https://example.com/sample-book"
      }
    ]
  ]);

  test.each([
    {
      sourceId: "openbible:capernaum",
      expectedLabel: "OpenBible capernaum",
      expectedUrl: "https://www.openbible.info/geo/ancient/af2161c/capernaum"
    },
    {
      sourceId: "pleiades:678231",
      expectedLabel: "Pleiades place 678231",
      expectedUrl: "https://pleiades.stoa.org/places/678231"
    },
    {
      sourceId: "dare:21094",
      expectedLabel: "DARE 21094",
      expectedUrl: "https://imperium.ahlfeldt.se/places/21094"
    },
    {
      sourceId: "wikidata:Q1218",
      expectedLabel: "Wikidata Q1218",
      expectedUrl: "https://www.wikidata.org/wiki/Q1218"
    },
    {
      sourceId: "osm:way/12345",
      expectedLabel: "OpenStreetMap way/12345",
      expectedUrl: "https://www.openstreetmap.org/way/12345"
    },
    {
      sourceId: "naturalearth:1159152091",
      expectedLabel: "Natural Earth 1159152091",
      expectedUrl: "https://www.naturalearthdata.com/"
    },
    {
      sourceId: "commons:File:Example.jpg",
      expectedLabel: "Wikimedia Commons File:Example.jpg",
      expectedUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg"
    },
    {
      sourceId: "orbis:1234",
      expectedLabel: "ORBIS 1234",
      expectedUrl: "https://orbis.stanford.edu/"
    },
    {
      sourceId: "awmc:feature-1",
      expectedLabel: "AWMC feature-1",
      expectedUrl: "https://github.com/AWMC/geodata"
    },
    {
      sourceId: "wikipedia:Capernaum",
      expectedLabel: "Wikipedia Capernaum",
      expectedUrl: "https://en.wikipedia.org/wiki/Capernaum"
    },
    {
      sourceId: "perseus:urn:cts:greekLit:tlg0526",
      expectedLabel: "Perseus urn:cts:greekLit:tlg0526",
      expectedUrl: "https://www.perseus.tufts.edu/hopper/text?doc=urn%3Acts%3AgreekLit%3Atlg0526"
    },
    {
      sourceId: "scripture:Mark 1:21",
      expectedLabel: "Mark 1:21",
      expectedUrl: null
    }
  ])("formats '$sourceId'", ({ sourceId, expectedLabel, expectedUrl }) => {
    const citation = formatSourceCitation(sourceId, bibliographyById);
    expect(citation.label).toBe(expectedLabel);
    expect(citation.url).toBe(expectedUrl);
  });

  test("formats bibliography source IDs with author, title, and year", () => {
    const citation = formatSourceCitation("bib:sample-book", bibliographyById);
    expect(citation.label).toBe("Author One, Author Two, Sample Book (2026)");
    expect(citation.url).toBe("https://example.com/sample-book");
  });

  test("falls back to the OpenBible atlas page when slug mapping is missing", () => {
    const citation = formatSourceCitation("openbible:missing-slug", bibliographyById);
    expect(citation.url).toBe("https://www.openbible.info/geo/");
  });
});
