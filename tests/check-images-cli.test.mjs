import assert from "node:assert/strict";
import test from "node:test";

import { readChangedSinceRef } from "../scripts/lib/check-images-cli.mjs";

test("readChangedSinceRef returns null when option is absent", () => {
  assert.equal(readChangedSinceRef(["--other-flag"]), null);
});

test("readChangedSinceRef parses --changed-since <ref>", () => {
  assert.equal(readChangedSinceRef(["--changed-since", "abc123"]), "abc123");
});

test("readChangedSinceRef parses --changed-since=<ref>", () => {
  assert.equal(readChangedSinceRef(["--changed-since=abc123"]), "abc123");
});

test("readChangedSinceRef throws when --changed-since has no value", () => {
  assert.throws(
    () => readChangedSinceRef(["--changed-since"]),
    /Option --changed-since requires a git ref value\./u
  );
});

test("readChangedSinceRef throws when --changed-since is followed by another option", () => {
  assert.throws(
    () => readChangedSinceRef(["--changed-since", "--another-option"]),
    /Option --changed-since requires a git ref value\./u
  );
});
