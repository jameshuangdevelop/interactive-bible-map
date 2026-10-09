import fs from "node:fs";
import path from "node:path";

import type {
  AncientStopPayload,
  AncientTimelinePayload
} from "../src/features/map/ancient-layer.types";
import type { PlaceIndexRecord } from "../src/features/map/types";
import {
  activeHolderLocationIds,
  linkedTimelineLocationIds,
  shouldShowProvinceAreaLabelAtStop
} from "../src/features/map/ancient-area-label-visibility";

function readGeneratedJson(relativePath: string) {
  const filePath = path.resolve(__dirname, "..", "public", "generated", relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

describe("ancient province label visibility", () => {
  test("hides only linked province records with no active holder record at each stop", () => {
    const timeline = readGeneratedJson("ancient.timeline.json") as AncientTimelinePayload;
    const places = readGeneratedJson("places.index.json") as PlaceIndexRecord[];
    const linkedLocationIds = linkedTimelineLocationIds(timeline.entities);
    const sortedStops = [...timeline.stops].sort((left, right) => left.year - right.year);
    const provinceOrEmpirePlaces = places.filter(
      (place) => place.type === "province" || place.type === "empire"
    );

    const hiddenYearsByPlaceId = new Map<string, number[]>();
    for (const place of provinceOrEmpirePlaces) {
      hiddenYearsByPlaceId.set(place.id, []);
    }

    for (const stop of sortedStops) {
      const stopPayload = readGeneratedJson(
        `ancient.stop.${stop.id}.json`
      ) as AncientStopPayload;
      const activeLocationIds = activeHolderLocationIds(stopPayload.areas);

      for (const place of provinceOrEmpirePlaces) {
        if (!linkedLocationIds.has(place.id)) {
          continue;
        }
        const visible = shouldShowProvinceAreaLabelAtStop({
          placeId: place.id,
          linkedLocationIds,
          activeLocationIds
        });
        if (!visible) {
          hiddenYearsByPlaceId.get(place.id)?.push(stop.year);
        }
      }
    }

    expect(hiddenYearsByPlaceId.get("judea-province")).toEqual([-4, 41]);
    expect(hiddenYearsByPlaceId.get("cappadocia")).toEqual([-4, 6]);
    expect(hiddenYearsByPlaceId.get("achaia")).toEqual([67, 70, 72, 74]);

    for (const [placeId, years] of hiddenYearsByPlaceId.entries()) {
      if (placeId === "judea-province" || placeId === "cappadocia" || placeId === "achaia") {
        continue;
      }
      expect(years).toEqual([]);
    }
  });
});
