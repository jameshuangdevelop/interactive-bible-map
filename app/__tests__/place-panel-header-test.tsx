import { renderToStaticMarkup } from "react-dom/server";

import { PlacePanel } from "../src/features/place-panel/place-panel.web";
import type {
  PlaceDetailsPayload,
  PlaceIndexRecord,
  PlaceRecord,
  PlaceSelection
} from "../src/features/map/types";

const romanEmpire: PlaceIndexRecord = {
  id: "roman-empire",
  names: { ancient: ["Roman Empire"], alternate: [] },
  type: "empire",
  zoomTier: "region",
  prominence: "standard",
  passageCount: 0,
  parentId: null,
  candidates: [{ label: "Roman Empire", coordinates: [12.5, 41.9], confidence: "high" }]
};

const lycaonia: PlaceIndexRecord = {
  id: "lycaonia",
  names: { ancient: ["Lycaonia"], alternate: [] },
  type: "region",
  zoomTier: "region",
  prominence: "standard",
  passageCount: 0,
  parentId: "roman-empire",
  candidates: [{ label: "Lycaonia", coordinates: [33.2, 37.7], confidence: "high" }]
};

const lystra: PlaceIndexRecord = {
  id: "lystra",
  names: {
    ancient: ["Lystra"],
    alternate: [],
    modernCountries: ["Türkiye"]
  },
  type: "city",
  zoomTier: "city",
  prominence: "standard",
  passageCount: 2,
  parentId: "lycaonia",
  candidates: [{ label: "Lystra", coordinates: [32.51, 37.58], confidence: "high" }]
};

const lystraDetails: PlaceRecord = {
  ...lystra,
  candidates: [
    {
      ...lystra.candidates[0],
      coordinateSource: "wikidata:Q844470",
      support: "Widely accepted location near Hatunsaray.",
      sources: ["wikidata:Q844470"]
    }
  ],
  summary: {
    text: "Lystra was a city in Lycaonia visited during Paul's journeys.",
    sources: ["wikidata:Q844470"]
  },
  history: [],
  scripture: [],
  otConnections: [],
  politicalHistory: [],
  status: "verified",
  verifiedBy: "fact-checker",
  lastReviewed: "2026-10-15"
};

const selection: PlaceSelection = {
  placeId: "lystra",
  candidateIndex: 0
};

const places = [romanEmpire, lycaonia, lystra];
const placesById = new Map(places.map((place) => [place.id, place]));

function renderPanelMarkup(isSmallScreenExpanded: boolean) {
  const detailsPayload: PlaceDetailsPayload = {
    location: lystraDetails,
    media: null,
    bibliography: []
  };

  return renderToStaticMarkup(
    <PlacePanel
      selectedPlace={lystra}
      selection={selection}
      placeDetails={detailsPayload}
      isLoading={false}
      loadErrorMessage={null}
      places={places}
      placesById={placesById}
      isSmallScreen={true}
      isSmallScreenExpanded={isSmallScreenExpanded}
      onToggleSmallScreenExpanded={() => {}}
      onSmallScreenHandlePointerDown={() => {}}
      onClose={() => {}}
      onSelectPlace={() => {}}
      onSelectPlaceFromAbout={() => {}}
      onHighlightPlace={() => {}}
      onSelectCandidate={() => {}}
    />
  );
}

describe("place panel header on small screens", () => {
  test.each([
    { state: "collapsed", isSmallScreenExpanded: false },
    { state: "expanded", isSmallScreenExpanded: true }
  ])("shows Lystra header when sheet is $state and media is missing", ({ isSmallScreenExpanded }) => {
    const markup = renderPanelMarkup(isSmallScreenExpanded);

    expect(markup).toContain("<h1");
    expect(markup).toContain(">Lystra</h1>");
    expect(markup).toContain("Today: Türkiye");
    expect(markup).toContain("City");
    expect(markup).toContain("Lycaonia");
  });
});
