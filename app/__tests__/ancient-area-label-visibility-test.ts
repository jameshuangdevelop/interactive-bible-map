import fs from "node:fs";
import path from "node:path";

import type {
  AncientTimelinePayload
} from "../src/features/map/ancient-layer.types";
import type { PlaceIndexRecord } from "../src/features/map/types";
import {
  linkedTimelineLocationIds,
  shouldShowAreaLabelOnAncientMap
} from "../src/features/map/ancient-area-label-visibility";

function readGeneratedJson(relativePath: string) {
  const filePath = path.resolve(__dirname, "..", "public", "generated", relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

describe("ancient area label visibility", () => {
  test("hides M3 area labels for every record linked from timeline entities", () => {
    const timeline = readGeneratedJson("ancient.timeline.json") as AncientTimelinePayload;
    const places = readGeneratedJson("places.index.json") as PlaceIndexRecord[];
    const linkedLocationIds = linkedTimelineLocationIds(timeline.entities);
    const provinceOrEmpirePlaces = places.filter(
      (place) => place.type === "province" || place.type === "empire"
    );

    const hiddenPlaceIds = new Set<string>();
    for (const place of provinceOrEmpirePlaces) {
      const visible = shouldShowAreaLabelOnAncientMap({
        placeId: place.id,
        linkedLocationIds
      });
      if (!visible) {
        hiddenPlaceIds.add(place.id);
      }
    }

    for (const place of provinceOrEmpirePlaces) {
      if (linkedLocationIds.has(place.id)) {
        expect(hiddenPlaceIds.has(place.id)).toBe(true);
      } else {
        expect(hiddenPlaceIds.has(place.id)).toBe(false);
      }
    }
  });
});
