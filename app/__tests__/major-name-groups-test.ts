import fs from "node:fs";
import path from "node:path";

import {
  buildMajorNameFeatures,
  groupMajorNamesAtZoom,
  majorGroupLabelText,
  MAJOR_NAME_MAX_BAND,
  measureLabelBox,
  measureLabelLineWidths,
  measureMajorNameBox,
  type MajorNameGroup,
  type MajorNameInput
} from "../src/features/map/major-name-groups";
import type { PinFeature } from "../src/features/map/map-render-data";

interface LocationRecord {
  id: string;
  prominence: string;
  zoomTier: string;
  names: { ancient: string[] };
  candidates: { coordinates: [number, number] }[];
}

function readMajorInputs(): MajorNameInput[] {
  const directory = path.resolve(__dirname, "..", "..", "data", "locations");
  const records = fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".json"))
    .map(
      (fileName) =>
        JSON.parse(fs.readFileSync(path.join(directory, fileName), "utf8")) as LocationRecord
    )
    .filter((record) => record.prominence === "major" && record.zoomTier === "city")
    .sort((left, right) => left.id.localeCompare(right.id));

  return records.map((record, index) => ({
    placeId: record.id,
    placeName: record.names.ancient[0],
    importanceRank: index,
    coordinates: record.candidates[0].coordinates
  }));
}

function project([longitude, latitude]: [number, number], zoom: number) {
  const worldSize = 512 * 2 ** zoom;
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * worldSize
  };
}

function touchingNames(groups: MajorNameGroup[], zoom: number) {
  const placed = groups.map((group) => {
    const text =
      group.members.length > 1
        ? majorGroupLabelText(group.top.placeName, group.members.length)
        : group.top.placeName;
    const box = measureMajorNameBox(group);
    const point = project(group.top.coordinates, zoom);
    return { text, box, x: point.x, y: point.y + box.centerOffsetY };
  });

  const touching: string[] = [];
  for (let left = 0; left < placed.length; left += 1) {
    for (let right = left + 1; right < placed.length; right += 1) {
      const a = placed[left];
      const b = placed[right];
      if (
        Math.abs(a.x - b.x) <= (a.box.width + b.box.width) / 2 &&
        Math.abs(a.y - b.y) <= (a.box.height + b.box.height) / 2
      ) {
        touching.push(`${a.text} / ${b.text}`);
      }
    }
  }
  return touching;
}

describe("major name groups", () => {
  const majors = readMajorInputs();

  test("reads the major places from the data", () => {
    expect(majors.length).toBeGreaterThanOrEqual(20);
    expect(majors.map((major) => major.placeId)).toEqual(
      expect.arrayContaining(["jerusalem", "nazareth", "ephesus", "rome"])
    );
  });

  test("measures names as MapLibre shapes them, wrapping long names like MapLibre", () => {
    expect(measureLabelLineWidths("Jerusalem", 10)).toEqual([115]);
    expect(measureLabelLineWidths("Jerusalem +4", 30)).toEqual([147]);
    expect(measureLabelLineWidths("Antioch on the Orontes", 10)).toEqual([124, 138]);
    expect(measureLabelLineWidths("Bethany beyond the Jordan", 10)).toEqual([189, 120]);

    const box = measureLabelBox("Jerusalem");
    expect(box.width).toBeCloseTo((115 * 13) / 24 + 6, 5);
    expect(box.height).toBeCloseTo(1.2 * 13 + 6, 5);
  });

  test.each([
    ["by data order", (inputs: MajorNameInput[]) => inputs],
    [
      "in reverse order",
      (inputs: MajorNameInput[]) =>
        inputs.map((input, index) => ({ ...input, importanceRank: inputs.length - index }))
    ]
  ])(
    "shows every major once per zoom, with no two names touching until the next zoom (%s)",
    (_label, order) => {
      const inputs = order(majors);
      for (let zoom = 0; zoom <= MAJOR_NAME_MAX_BAND; zoom += 1) {
        const groups = groupMajorNamesAtZoom(inputs, zoom);
        const shown = groups.flatMap((group) => group.members.map((member) => member.placeId));
        expect(shown.sort()).toEqual(inputs.map((input) => input.placeId).sort());
        for (const group of groups) {
          expect(group.members[0]).toBe(group.top);
        }
        expect(touchingNames(groups, zoom)).toEqual([]);
        expect(touchingNames(groups, zoom + 0.999)).toEqual([]);
      }
    }
  );

  test.each(["bethany", "cana", "jerusalem", "philadelphia-lydia"])(
    "puts the selected place (%s) first, so its own name shows, and still nothing touches",
    (selectedId) => {
      const inputs = majors.map((major) => ({
        ...major,
        selected: major.placeId === selectedId,
        hasMultipleCandidates: major.placeId === "cana"
      }));
      for (let zoom = 0; zoom <= MAJOR_NAME_MAX_BAND; zoom += 1) {
        const groups = groupMajorNamesAtZoom(inputs, zoom);
        const selectedGroup = groups.find((group) =>
          group.members.some((member) => member.placeId === selectedId)
        );
        expect(selectedGroup?.top.placeId).toBe(selectedId);
        expect(touchingNames(groups, zoom)).toEqual([]);
        expect(touchingNames(groups, zoom + 0.999)).toEqual([]);
      }
    }
  );

  test("measures a selected name at its larger size, raised above a first candidate's dot", () => {
    const cana = majors.find((major) => major.placeId === "cana");
    if (!cana) {
      throw new Error("Expected Cana in the data.");
    }

    const plain = measureMajorNameBox({ top: cana, members: [cana] });
    const selected = { ...cana, selected: true, hasMultipleCandidates: true };
    const raised = measureMajorNameBox({ top: selected, members: [selected] });
    expect(plain.centerOffsetY).toBe(0);
    expect(raised.width).toBeGreaterThan(plain.width);
    expect(raised.centerOffsetY).toBeCloseTo(-(0.45 * 14 + raised.height / 2), 5);
  });

  test("keeps Nazareth's and Jerusalem's names apart on the opening map's zoom", () => {
    const groups = groupMajorNamesAtZoom(
      majors.filter((major) => major.placeId === "jerusalem" || major.placeId === "nazareth"),
      4
    );
    expect(groups).toHaveLength(2);
  });

  test("groups under the most important place, which names the group", () => {
    const jerusalem = majors.find((major) => major.placeId === "jerusalem");
    const bethany = majors.find((major) => major.placeId === "bethany");
    if (!jerusalem || !bethany) {
      throw new Error("Expected Jerusalem and Bethany in the data.");
    }

    const groups = groupMajorNamesAtZoom(
      [
        { ...bethany, importanceRank: 1 },
        { ...jerusalem, importanceRank: 0 }
      ],
      6
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].top.placeId).toBe("jerusalem");
    expect(groups[0].members.map((member) => member.placeId)).toEqual(["jerusalem", "bethany"]);
  });

  test("builds one feature per name for each zoom band, keeping cluster-style properties", () => {
    const pins = majors.map(
      (major) =>
        ({
          type: "Feature",
          id: `pin:${major.placeId}`,
          geometry: { type: "Point", coordinates: major.coordinates },
          properties: {
            placeId: major.placeId,
            placeName: major.placeName,
            labelText: major.placeName,
            importanceRank: major.importanceRank
          }
        }) as unknown as PinFeature
    );

    const collection = buildMajorNameFeatures(pins);
    for (let band = 0; band <= MAJOR_NAME_MAX_BAND; band += 1) {
      const inBand = collection.features.filter((feature) => feature.properties.groupBand === band);
      const shown = inBand.flatMap((feature) =>
        "cluster" in feature.properties
          ? feature.properties.memberPlaceIds.split(",")
          : [feature.properties.placeId]
      );
      expect(shown.sort()).toEqual(majors.map((major) => major.placeId).sort());

      for (const feature of inBand) {
        if (!("cluster" in feature.properties)) {
          continue;
        }
        const properties = feature.properties;
        const memberIds = properties.memberPlaceIds.split(",");
        expect(properties.point_count).toBe(memberIds.length);
        expect(memberIds[0]).toBe(properties.topPlaceId);
        expect(properties.labelText).toBe(
          majorGroupLabelText(properties.memberNames.split(", ")[0], memberIds.length)
        );
      }
    }

    const groupIds = collection.features
      .filter((feature) => "cluster" in feature.properties)
      .map((feature) => ("cluster" in feature.properties ? feature.properties.cluster_id : -1));
    expect(new Set(groupIds).size).toBe(groupIds.length);
  });
});
