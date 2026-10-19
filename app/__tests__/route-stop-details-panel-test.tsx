import { renderToStaticMarkup } from "react-dom/server";

import { RouteStopDetailsPanel } from "../src/components/app-shell.web";
import type { LoadedRoutesData, RouteStopRecord } from "../src/features/routes/types";

const bibliographyById = new Map<string, LoadedRoutesData["index"]["bibliography"][number]>([
  [
    "fixture-source",
    {
      id: "fixture-source",
      type: "book",
      title: "Fixture bibliography",
      authors: ["A. Writer"],
      year: 2026,
      url: "https://example.test/fixture-source"
    }
  ]
]);

function renderPanel(stop: RouteStopRecord, showBackToRoute: boolean) {
  return renderToStaticMarkup(
    <RouteStopDetailsPanel
      bibliographyById={bibliographyById}
      onBackToRoute={() => {}}
      onClose={() => {}}
      selectedRouteStop={stop}
      showBackToRoute={showBackToRoute}
    />
  );
}

describe("route stop details panel", () => {
  test("renders a single-candidate route stop without the candidate-sites section", () => {
    const markup = renderPanel(
      {
        id: "single-stop",
        name: "Seleucia",
        todayName: "Samandağ",
        candidates: [
          {
            label: "Seleucia Pieria",
            coordinates: [35.968, 36.119],
            coordinateSource: "wikidata:Q2207807",
            confidence: "high",
            support: "Fixture support.",
            sources: ["wikidata:Q2207807"]
          }
        ],
        scripture: [{ ref: "Acts 13:4", book: "Acts", textWEB: "So, being sent out by the Holy Spirit..." }],
        sources: ["bib:fixture-source"],
        status: "draft"
      },
      false
    );

    expect(markup).toContain(">Seleucia<");
    expect(markup).toContain("Today: Samandağ");
    expect(markup).toContain(">In the Bible<");
    expect(markup).toContain("Acts 13:4");
    expect(markup).toContain(">Sources · 1<");
    expect(markup).toContain("Fixture bibliography");
    expect(markup).toContain("aria-label=\"Close\"");
    expect(markup).not.toContain(">Candidate sites<");
    expect(markup).not.toContain("Back to route");
  });

  test("renders disputed route-stop candidates, passages, sources, and back link", () => {
    const markup = renderPanel(
      {
        id: "disputed-stop",
        name: "Disputed stop",
        todayName: "Proposed near the Sea of Galilee",
        candidates: [
          {
            label: "Candidate A",
            coordinates: [34.2, 33.4],
            coordinateSource: "openbible:capernaum",
            confidence: "disputed",
            support: "Fixture support A.",
            sources: ["openbible:capernaum"]
          },
          {
            label: "Candidate B",
            coordinates: [34.26, 33.38],
            coordinateSource: "pleiades:678180",
            confidence: "disputed",
            support: "Fixture support B.",
            sources: ["pleiades:678180"]
          }
        ],
        scripture: [{ ref: "Matthew 5:1", book: "Matthew", textWEB: "Seeing the multitudes..." }],
        sources: ["bib:fixture-source"],
        status: "draft"
      },
      true
    );

    expect(markup).toContain("‹ Back to route");
    expect(markup).toContain(">Candidate sites<");
    expect(markup).toContain(">Candidate A<");
    expect(markup).toContain(">Candidate B<");
    expect(markup).toContain(">In the Bible<");
    expect(markup).toContain("Matthew 5:1");
    expect(markup).toContain(">Sources · 1<");
    expect(markup).toContain("Fixture bibliography");
    expect(markup).toContain("aria-label=\"Close\"");
  });
});
