import assert from "node:assert/strict";
import test from "node:test";

import {
  CHANGED_SINCE_REASONS,
  selectImagesChangedSinceRef
} from "../scripts/lib/check-images-changed-since.mjs";

function mediaRecord(fileName, locationId, images) {
  return { fileName, locationId, images };
}

test("selectImagesChangedSinceRef selects every image in a new media file", () => {
  const currentMediaRecords = [
    mediaRecord("new-place.json", "new-place", [
      {
        id: "new-place-01",
        url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/new-place.jpg",
        width: 1200,
        height: 800,
        kind: "modern",
        aiGenerated: false
      }
    ])
  ];

  const { selected, summary } = selectImagesChangedSinceRef({
    currentMediaRecords,
    baseMediaRecordsByFileName: new Map(),
    changedAiFiles: new Set()
  });

  assert.equal(selected.length, 1);
  assert.deepEqual(selected[0].reasons, [CHANGED_SINCE_REASONS.NEW_MEDIA_FILE]);
  assert.equal(summary.newMediaFileImages, 1);
  assert.equal(summary.selectedImages, 1);
});

test("selectImagesChangedSinceRef selects images newly added to an existing media file", () => {
  const currentMediaRecords = [
    mediaRecord("capernaum.json", "capernaum", [
      {
        id: "capernaum-01",
        url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/capernaum-01.jpg",
        width: 1200,
        height: 800,
        kind: "modern",
        aiGenerated: false
      },
      {
        id: "capernaum-02",
        url: "https://upload.wikimedia.org/wikipedia/commons/b/bb/capernaum-02.jpg",
        width: 1400,
        height: 900,
        kind: "site",
        aiGenerated: false
      }
    ])
  ];
  const baseMediaRecordsByFileName = new Map([
    [
      "capernaum.json",
      {
        locationId: "capernaum",
        images: [
          {
            id: "capernaum-01",
            url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/capernaum-01.jpg",
            width: 1200,
            height: 800,
            kind: "modern",
            aiGenerated: false
          }
        ]
      }
    ]
  ]);

  const { selected, summary } = selectImagesChangedSinceRef({
    currentMediaRecords,
    baseMediaRecordsByFileName,
    changedAiFiles: new Set()
  });

  assert.equal(selected.length, 1);
  assert.deepEqual(selected[0].reasons, [CHANGED_SINCE_REASONS.ADDED_IMAGE]);
  assert.equal(selected[0].imageId, "capernaum-02");
  assert.equal(summary.addedImages, 1);
  assert.equal(summary.unchangedImages, 1);
});

test("selectImagesChangedSinceRef selects images with changed check fields", () => {
  const currentMediaRecords = [
    mediaRecord("bethlehem.json", "bethlehem", [
      {
        id: "bethlehem-01",
        url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/bethlehem.jpg",
        width: 1600,
        height: 900,
        kind: "modern",
        aiGenerated: false
      }
    ])
  ];
  const baseMediaRecordsByFileName = new Map([
    [
      "bethlehem.json",
      {
        locationId: "bethlehem",
        images: [
          {
            id: "bethlehem-01",
            url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/bethlehem.jpg",
            width: 1200,
            height: 900,
            kind: "modern",
            aiGenerated: false
          }
        ]
      }
    ]
  ]);

  const { selected, summary } = selectImagesChangedSinceRef({
    currentMediaRecords,
    baseMediaRecordsByFileName,
    changedAiFiles: new Set()
  });

  assert.equal(selected.length, 1);
  assert.deepEqual(selected[0].reasons, [CHANGED_SINCE_REASONS.CHANGED_METADATA]);
  assert.deepEqual(selected[0].changedFields, ["width"]);
  assert.equal(summary.changedMetadataImages, 1);
});

test("selectImagesChangedSinceRef skips unchanged images and counts removed images", () => {
  const currentMediaRecords = [
    mediaRecord("jericho.json", "jericho", [
      {
        id: "jericho-01",
        url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/jericho-01.jpg",
        width: 1200,
        height: 800,
        kind: "modern",
        aiGenerated: false
      }
    ])
  ];
  const baseMediaRecordsByFileName = new Map([
    [
      "jericho.json",
      {
        locationId: "jericho",
        images: [
          {
            id: "jericho-01",
            url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/jericho-01.jpg",
            width: 1200,
            height: 800,
            kind: "modern",
            aiGenerated: false
          },
          {
            id: "jericho-02",
            url: "https://upload.wikimedia.org/wikipedia/commons/b/bb/jericho-02.jpg",
            width: 1200,
            height: 800,
            kind: "site",
            aiGenerated: false
          }
        ]
      }
    ]
  ]);

  const { selected, summary } = selectImagesChangedSinceRef({
    currentMediaRecords,
    baseMediaRecordsByFileName,
    changedAiFiles: new Set()
  });

  assert.equal(selected.length, 0);
  assert.equal(summary.unchangedImages, 1);
  assert.equal(summary.removedImages, 1);
});

test("selectImagesChangedSinceRef selects unchanged AI images when the AI file changed", () => {
  const currentMediaRecords = [
    mediaRecord("jerusalem.json", "jerusalem", [
      {
        id: "jerusalem-ai-01",
        url: "media/ai/jerusalem-ai-01.webp",
        width: 1600,
        height: 900,
        kind: "ai-reconstruction",
        aiGenerated: true
      }
    ])
  ];
  const baseMediaRecordsByFileName = new Map([
    [
      "jerusalem.json",
      {
        locationId: "jerusalem",
        images: [
          {
            id: "jerusalem-ai-01",
            url: "media/ai/jerusalem-ai-01.webp",
            width: 1600,
            height: 900,
            kind: "ai-reconstruction",
            aiGenerated: true
          }
        ]
      }
    ]
  ]);

  const { selected, summary } = selectImagesChangedSinceRef({
    currentMediaRecords,
    baseMediaRecordsByFileName,
    changedAiFiles: new Set(["media\\ai\\jerusalem-ai-01.webp"])
  });

  assert.equal(selected.length, 1);
  assert.deepEqual(selected[0].reasons, [CHANGED_SINCE_REASONS.CHANGED_AI_FILE]);
  assert.equal(summary.aiFileChangedImages, 1);
  assert.equal(summary.selectedImages, 1);
});
