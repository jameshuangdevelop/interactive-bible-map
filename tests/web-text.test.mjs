import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getWebTextForReference, loadWebVerseIndex } from "../scripts/lib/web-text.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const miniVplPath = path.join(testDirectory, "fixtures", "web", "engwebp-mini.vpl.txt");

test("verse range lookup joins WEB verses in order", async () => {
  const verseIndex = await loadWebVerseIndex(miniVplPath);
  const text = getWebTextForReference("Mark 1:21-22", verseIndex);
  assert.equal(
    text,
    "They went into Capernaum, and immediately on the Sabbath day he entered into the synagogue and taught. They were astonished at his teaching, for he taught them as having authority, and not as the scribes."
  );
});
