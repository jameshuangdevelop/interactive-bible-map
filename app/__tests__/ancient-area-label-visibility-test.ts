import fs from "node:fs";
import path from "node:path";

import type {
  AncientTimelinePayload
} from "../src/features/map/ancient-layer.types";
import {
  linkedTimelineLocationIds,
  shouldShowAreaLabelOnAncientMap
} from "../src/features/map/ancient-area-label-visibility";

interface LocationRecordForAreaLabelTest {
  id: string;
  type?: string;
}

function readRepositoryJson(relativePath: string) {
  const filePath = path.resolve(__dirname, "..", "..", relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readLocationRecords(): LocationRecordForAreaLabelTest[] {
  const locationsDirectory = path.resolve(__dirname, "..", "..", "data", "locations");
  return fs
    .readdirSync(locationsDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) =>
      JSON.parse(fs.readFileSync(path.join(locationsDirectory, fileName), "utf8")) as LocationRecordForAreaLabelTest
    );
}

describe("ancient area label visibility", () => {
  test("linked timeline location ids include expected province labels and exclude Galilee", () => {
    const timeline = readRepositoryJson("data/timeline.json") as AncientTimelinePayload;
    const linkedLocationIds = linkedTimelineLocationIds(timeline.entities);

    expect(linkedLocationIds.has("judea-province")).toBe(true);
    expect(linkedLocationIds.has("cappadocia")).toBe(true);
    expect(linkedLocationIds.has("galatia")).toBe(true);
    expect(linkedLocationIds.has("galilee")).toBe(false);
  });

  test("hides M3 area labels for every record linked from timeline entities", () => {
    const timeline = readRepositoryJson("data/timeline.json") as AncientTimelinePayload;
    const places = readLocationRecords();
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
