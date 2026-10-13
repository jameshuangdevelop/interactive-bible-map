import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { zipSync } from "fflate";

import { ANCIENT_GEO_INPUTS, ancientGeoCache, extractZip, fetchPinnedInput, readJsonFile } from "../scripts/lib/ancient-geo-inputs.mjs";

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

async function withDirectory(run) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-ancient-geo-inputs-test-"));
  try {
    await run(directory);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

test("every pinned input has a commit-pinned URL and a SHA-256", () => {
  for (const input of Object.values(ANCIENT_GEO_INPUTS)) {
    assert.match(input.url, /^https:\/\/raw\.githubusercontent\.com\/(AWMC\/geodata|nvkelso\/natural-earth-vector)\/[0-9a-f]{40}\//);
    assert.match(input.sha256, /^[0-9a-f]{64}$/);
    assert.doesNotMatch(input.url, / /);
  }
  assert.equal(new Set(Object.values(ANCIENT_GEO_INPUTS).map((input) => input.file)).size, Object.keys(ANCIENT_GEO_INPUTS).length);
});

test("fetchPinnedInput downloads a file, checks its SHA-256 and reuses it afterwards", async () => {
  await withDirectory(async (directory) => {
    const bytes = Buffer.from('{"type":"FeatureCollection","features":[]}');
    const input = { file: "layer.geojson", url: "https://example.test/layer.geojson", sha256: sha256(bytes) };
    let requests = 0;
    const fetchImpl = async () => {
      requests += 1;
      return { ok: true, arrayBuffer: async () => bytes };
    };
    const target = await fetchPinnedInput(input, directory, { fetchImpl });
    assert.deepEqual(await fs.readFile(target), bytes);
    await fetchPinnedInput(input, directory, { fetchImpl });
    assert.equal(requests, 1);
  });
});

test("fetchPinnedInput stops when the download is not the pinned file", async () => {
  await withDirectory(async (directory) => {
    const input = { file: "layer.geojson", url: "https://example.test/layer.geojson", sha256: sha256(Buffer.from("the pinned bytes")) };
    const fetchImpl = async () => ({ ok: true, arrayBuffer: async () => Buffer.from("different bytes") });
    await assert.rejects(fetchPinnedInput(input, directory, { fetchImpl }), /not the pinned/);
    await assert.rejects(fs.access(path.join(directory, "layer.geojson")));
    const failing = async () => ({ ok: false, status: 404, statusText: "Not Found" });
    await assert.rejects(fetchPinnedInput(input, directory, { fetchImpl: failing }), /404 Not Found/);
  });
});

test("fetchPinnedInput replaces a cached file whose bytes changed", async () => {
  await withDirectory(async (directory) => {
    const bytes = Buffer.from("the pinned bytes");
    const input = { file: "layer.bin", url: "https://example.test/layer.bin", sha256: sha256(bytes) };
    await fs.writeFile(path.join(directory, "layer.bin"), "edited by hand");
    await fetchPinnedInput(input, directory, { fetchImpl: async () => ({ ok: true, arrayBuffer: async () => bytes }) });
    assert.deepEqual(await fs.readFile(path.join(directory, "layer.bin")), bytes);
  });
});

test("extractZip unpacks an archive and refuses entries outside the folder", async () => {
  await withDirectory(async (directory) => {
    const zipPath = path.join(directory, "archive.zip");
    await fs.writeFile(zipPath, zipSync({ "political_shading/herod/herod.prj": new TextEncoder().encode("GEOGCS"), "empty/": new Uint8Array() }));
    const extracted = await extractZip(zipPath, path.join(directory, "out"));
    assert.equal(await fs.readFile(path.join(extracted, "political_shading", "herod", "herod.prj"), "utf8"), "GEOGCS");
    const evilPath = path.join(directory, "evil.zip");
    await fs.writeFile(evilPath, zipSync({ "../escaped.txt": new TextEncoder().encode("no") }));
    await assert.rejects(extractZip(evilPath, path.join(directory, "out2")), /outside/);
  });
});

test("readJsonFile ignores a byte-order mark", async () => {
  await withDirectory(async (directory) => {
    const filePath = path.join(directory, "bom.geojson");
    await fs.writeFile(filePath, '\uFEFF{"type":"FeatureCollection","features":[]}');
    assert.deepEqual(await readJsonFile(filePath), { type: "FeatureCollection", features: [] });
  });
});

test("ancientGeoCache lays out inputs, work and report folders under one root", () => {
  const cache = ancientGeoCache(path.join(os.tmpdir(), "some-cache"));
  assert.equal(cache.inputs, path.join(os.tmpdir(), "some-cache", "inputs"));
  assert.equal(cache.work, path.join(os.tmpdir(), "some-cache", "work"));
  assert.equal(cache.previews, path.join(os.tmpdir(), "some-cache", "report", "previews"));
});
