import {
  ANCIENT_AWMC_ATTRIBUTION,
  ANCIENT_MAIN_BASEMAP_ATTRIBUTION,
  MODERN_MAIN_BASEMAP_ATTRIBUTION
} from "../src/features/map/constants";
import { getAttributionMarkup } from "../src/features/map/attribution";

describe("map attribution", () => {
  test("includes AWMC only once on the ancient map in routes mode", () => {
    const markup = getAttributionMarkup("main", "ancient", true);
    const awmcCount = markup.split(ANCIENT_AWMC_ATTRIBUTION).length - 1;
    expect(awmcCount).toBe(1);
    expect(markup).toContain(ANCIENT_MAIN_BASEMAP_ATTRIBUTION);
  });

  test("appends AWMC in routes mode on the modern map", () => {
    const markup = getAttributionMarkup("main", "modern", true);
    expect(markup).toContain(MODERN_MAIN_BASEMAP_ATTRIBUTION);
    expect(markup).toContain(ANCIENT_AWMC_ATTRIBUTION);
  });

  test("does not append AWMC in non-routes modern mode", () => {
    const markup = getAttributionMarkup("main", "modern", false);
    expect(markup).toBe(MODERN_MAIN_BASEMAP_ATTRIBUTION);
  });
});
