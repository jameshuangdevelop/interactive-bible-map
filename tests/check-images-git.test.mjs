import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  loadBaseMediaRecordsByFileName,
  loadChangedAiFilesSinceRef,
  readMediaRecordAtRef
} from "../scripts/lib/check-images-git.mjs";

function createMissingPathAtRefError(relativePath, ref) {
  const error = new Error(`fatal: path '${relativePath}' exists on disk, but not in '${ref}'`);
  error.stderr = `fatal: path '${relativePath}' exists on disk, but not in '${ref}'`;
  return error;
}

test("readMediaRecordAtRef returns missing when file does not exist at ref", async () => {
  const repositoryRoot = "Q:\\repo";
  const changedSinceRef = "base-ref";
  const fileName = "new-place.json";

  const result = await readMediaRecordAtRef({
    changedSinceRef,
    fileName,
    repositoryRoot,
    execFile: async () => {
      throw createMissingPathAtRefError(`data/media/${fileName}`, changedSinceRef);
    }
  });

  assert.equal(result.status, "missing");
});

test("loadBaseMediaRecordsByFileName treats parse failures at ref as missing and warns once", async () => {
  const changedSinceRef = "base-ref";
  const mediaRecords = [
    { fileName: "broken.json" },
    { fileName: "good.json" }
  ];

  const { baseMediaRecordsByFileName, parseWarnings } = await loadBaseMediaRecordsByFileName({
    changedSinceRef,
    mediaRecords,
    repositoryRoot: "Q:\\repo",
    execFile: async (_file, args) => {
      if (args[1] === `${changedSinceRef}:data/media/broken.json`) {
        return { stdout: "{this-is-not-valid-json}" };
      }

      if (args[1] === `${changedSinceRef}:data/media/good.json`) {
        return { stdout: "{\"locationId\":\"good\",\"images\":[]}" };
      }

      throw new Error(`Unexpected git show target: ${args[1]}`);
    }
  });

  assert.equal(baseMediaRecordsByFileName.has("broken.json"), false);
  assert.equal(baseMediaRecordsByFileName.has("good.json"), true);
  assert.equal(parseWarnings.length, 1);
  assert.match(parseWarnings[0], /broken\.json/u);
});

test("loadChangedAiFilesSinceRef keeps only changed existing .webp AI files", async () => {
  const repositoryRoot = "Q:\\repo";
  const existingPaths = new Set([
    path.resolve(repositoryRoot, "media/ai/kept.webp"),
    path.resolve(repositoryRoot, "media/ai/also-kept.webp")
  ]);

  const changedAiFiles = await loadChangedAiFilesSinceRef({
    changedSinceRef: "base-ref",
    repositoryRoot,
    execFile: async () => ({
      stdout: [
        "media/ai/kept.webp",
        "media\\ai\\also-kept.webp",
        "media/ai/missing.webp",
        "media/ai/not-webp.jpg"
      ].join("\n")
    }),
    stat: async (absolutePath) => {
      if (existingPaths.has(absolutePath)) {
        return {
          isFile: () => true
        };
      }

      throw new Error("ENOENT");
    }
  });

  assert.deepEqual(Array.from(changedAiFiles).sort(), [
    "media/ai/also-kept.webp",
    "media/ai/kept.webp"
  ]);
});
