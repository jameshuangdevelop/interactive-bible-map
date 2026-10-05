import assert from "node:assert/strict";
import test from "node:test";

import { detectPagesProjectExists } from "../scripts/detect-pages-project.mjs";

test("detectPagesProjectExists matches an exact Project Name entry", () => {
  const raw = JSON.stringify(
    [
      {
        "Project Name": "interactive-bible-map",
        "Project Domains": "interactive-bible-map.pages.dev",
        "Git Provider": "Not linked",
        "Last Modified": "2026-10-01T00:00:00.000Z"
      }
    ],
    null,
    2
  );

  assert.equal(detectPagesProjectExists(raw, "interactive-bible-map"), true);
});

test("detectPagesProjectExists returns false for a non-matching project list", () => {
  const raw = JSON.stringify(
    [
      {
        "Project Name": "another-project"
      }
    ],
    null,
    2
  );

  assert.equal(detectPagesProjectExists(raw, "interactive-bible-map"), false);
});

test("detectPagesProjectExists handles a banner line before the JSON array", () => {
  const raw = `Wrangler 4.39.0
[
  {
    "Project Name": "interactive-bible-map"
  }
]`;

  assert.equal(detectPagesProjectExists(raw, "interactive-bible-map"), true);
});

test("detectPagesProjectExists returns false for an empty array", () => {
  assert.equal(detectPagesProjectExists("[]", "interactive-bible-map"), false);
});

test("detectPagesProjectExists returns false when output has no JSON array", () => {
  const raw = "No Pages projects found for this account.";
  assert.equal(detectPagesProjectExists(raw, "interactive-bible-map"), false);
});
