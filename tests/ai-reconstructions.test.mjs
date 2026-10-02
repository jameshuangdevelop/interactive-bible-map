import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import {
  DEFAULT_AI_MODELS,
  GEMINI_SERVICE_TIERS,
  estimateGeminiCostUsd,
  generateImageWithProvider
} from "../scripts/lib/ai-providers.mjs";
import {
  derivePromptIdFromCandidateFileName,
  extractPromptTextFromMarkdown,
  findExistingCandidateFiles,
  parseAiCandidateFileName,
  parseGenerateAiArguments,
  parsePublishAiArguments,
  publishAiCandidate,
  sha256Hex,
  summarizeAiIncomingCosts,
  writeAiCandidateAndSidecar
} from "../scripts/lib/ai-reconstructions.mjs";
import { MAX_AI_IMAGE_BYTES, validateData } from "../scripts/lib/validator.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturesDirectory = path.join(testDirectory, "fixtures");
const validCaseLocationDirectory = path.join(fixturesDirectory, "cases", "valid", "locations");
const bibliographyFixturePath = path.join(fixturesDirectory, "bibliography.json");
const webFixturePath = path.join(fixturesDirectory, "web", "engwebp-mini.vpl.txt");

async function withTempDirectory(run) {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-ai-recon-"));
  try {
    return await run(temporaryDirectory);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}

function createRawRgbData(width, height, colorFromPixel) {
  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = colorFromPixel(x, y);
      const offset = ((y * width) + x) * 3;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
    }
  }
  return data;
}

async function createPngBuffer(width, height, colorFromPixel) {
  const rawData = createRawRgbData(width, height, colorFromPixel);
  return sharp(rawData, {
    raw: {
      width,
      height,
      channels: 3
    }
  })
    .png()
    .toBuffer();
}

async function writeCandidateWithSidecar({
  temporaryDirectory,
  promptId,
  fileName,
  imageBuffer
}) {
  const incomingDirectory = path.join(temporaryDirectory, "media", "ai-incoming");
  await fs.mkdir(incomingDirectory, { recursive: true });
  const candidatePath = path.join(incomingDirectory, fileName);
  const sidecarPath = `${candidatePath}.json`;
  await fs.writeFile(candidatePath, imageBuffer);
  await fs.writeFile(
    sidecarPath,
    `${JSON.stringify(
      {
        provider: "gemini",
        model: "gemini-3-pro-image",
        date: "2026-10-01T18:00:00.000Z",
        seed: 808,
        round: 1,
        promptId,
        prompt: "Prompt fixture text.",
        promptSha256: sha256Hex("Prompt fixture text.")
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  return { candidatePath, sidecarPath };
}

test("prompt extraction stops before Keep out section", () => {
  const markdown = `
# Capernaum brief

### AI-generated reconstruction — prompt capernaum-ai-01

Bird's-eye establishing shot of Capernaum at dawn.

Show the basalt village blocks near the lakeshore.

Keep out / keep vague: no modern skyline, no domes.

### AI-generated reconstruction — prompt capernaum-ai-02
Second prompt
`;

  const prompt = extractPromptTextFromMarkdown(markdown, "capernaum-ai-01");
  assert.equal(
    prompt,
    "Bird's-eye establishing shot of Capernaum at dawn.\n\nShow the basalt village blocks near the lakeshore."
  );
});

test("prompt extraction fails when heading is missing", () => {
  const markdown = "### AI-generated reconstruction — prompt bethlehem-ai-01\nPrompt text.\n";
  assert.throws(
    () => extractPromptTextFromMarkdown(markdown, "capernaum-ai-01"),
    /Missing heading/u
  );
});

test("prompt extraction keeps multi-paragraph prompt bodies", () => {
  const markdown = `
### AI-generated reconstruction — prompt jerusalem-ai-03

First paragraph.

Second paragraph with more detail.

Third paragraph.
`;

  const prompt = extractPromptTextFromMarkdown(markdown, "jerusalem-ai-03");
  assert.equal(
    prompt,
    "First paragraph.\n\nSecond paragraph with more detail.\n\nThird paragraph."
  );
});

test("prompt extraction supports CRLF line endings", () => {
  const markdown =
    "### AI-generated reconstruction — prompt capernaum-ai-01\r\n\r\nFirst paragraph.\r\n\r\nSecond paragraph.\r\n\r\nKeep out / keep vague: no modern buildings.\r\n";

  const prompt = extractPromptTextFromMarkdown(markdown, "capernaum-ai-01");
  assert.equal(prompt, "First paragraph.\n\nSecond paragraph.");
});

test("findExistingCandidateFiles finds only the requested round's variants", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    assert.deepEqual(
      await findExistingCandidateFiles({
        incomingDirectory: path.join(temporaryDirectory, "missing"),
        promptId: "capernaum-ai-01",
        round: 1,
        variants: 2
      }),
      []
    );

    for (const fileName of [
      "capernaum-ai-01-r1-v2.jpg",
      "capernaum-ai-01-r1-v2.jpg.json",
      "capernaum-ai-01-r1-v3.jpg",
      "capernaum-ai-01-r2-v1.jpg",
      "capernaum-ai-010-r1-v1.jpg"
    ]) {
      await fs.writeFile(path.join(temporaryDirectory, fileName), "x");
    }

    assert.deepEqual(
      await findExistingCandidateFiles({
        incomingDirectory: temporaryDirectory,
        promptId: "capernaum-ai-01",
        round: 1,
        variants: 2
      }),
      ["capernaum-ai-01-r1-v2.jpg", "capernaum-ai-01-r1-v2.jpg.json"]
    );
  });
});

test("writeAiCandidateAndSidecar writes expected file names and metadata", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await sharp({
      create: {
        width: 24,
        height: 16,
        channels: 3,
        background: { r: 51, g: 90, b: 180 }
      }
    })
      .png()
      .toBuffer();

    const promptText = "Ancient city overview with flat mud-brick roofs.";
    const result = await writeAiCandidateAndSidecar({
      incomingDirectory: temporaryDirectory,
      promptId: "capernaum-ai-01",
      round: 2,
      variant: 3,
      imageBuffer,
      provider: "openai",
      model: "gpt-image-2.5-flare",
      seed: 1234,
      promptText,
      now: new Date("2026-10-01T18:00:00.000Z")
    });

    assert.equal(path.basename(result.imagePath), "capernaum-ai-01-r2-v3.png");
    assert.equal(path.basename(result.sidecarPath), "capernaum-ai-01-r2-v3.png.json");

    const sidecar = JSON.parse(await fs.readFile(result.sidecarPath, "utf8"));
    assert.equal(sidecar.provider, "openai");
    assert.equal(sidecar.model, "gpt-image-2.5-flare");
    assert.equal(sidecar.seed, 1234);
    assert.equal(sidecar.round, 2);
    assert.equal(sidecar.promptId, "capernaum-ai-01");
    assert.equal(sidecar.prompt, promptText);
    assert.equal(sidecar.promptSha256, sha256Hex(promptText));
  });
});

test("writeAiCandidateAndSidecar records Gemini cost, tier, usage and edit metadata", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await sharp({
      create: {
        width: 24,
        height: 16,
        channels: 3,
        background: { r: 61, g: 70, b: 120 }
      }
    })
      .png()
      .toBuffer();

    const instructionText = "Make the city gate less crowded and adjust morning light.";
    const usageMetadata = {
      promptTokenCount: 1_000,
      candidatesTokenCount: 500,
      thoughtsTokenCount: 1_500
    };
    const estimatedCostUsd = estimateGeminiCostUsd({
      serviceTier: GEMINI_SERVICE_TIERS.FLEX,
      usageMetadata,
      inputImageCount: 1,
      outputImageCount: 1
    });

    const result = await writeAiCandidateAndSidecar({
      incomingDirectory: temporaryDirectory,
      promptId: "jerusalem-ai-01",
      round: 3,
      variant: 1,
      imageBuffer,
      provider: "gemini",
      model: "gemini-3-pro-image",
      seed: 888,
      promptText: instructionText,
      serviceTier: GEMINI_SERVICE_TIERS.FLEX,
      usageMetadata,
      estimatedCostUsd,
      parentCandidate: "jerusalem-ai-01-r2-v1.png",
      instructionText
    });

    assert.deepEqual(parseAiCandidateFileName(result.imagePath), {
      promptId: "jerusalem-ai-01",
      round: 3,
      variant: 1,
      extension: "png"
    });

    const sidecar = JSON.parse(await fs.readFile(result.sidecarPath, "utf8"));
    assert.equal(sidecar.serviceTier, "flex");
    assert.deepEqual(sidecar.usageMetadata, usageMetadata);
    assert.equal(sidecar.estimatedCostUsd, estimatedCostUsd);
    assert.equal(sidecar.parentCandidate, "jerusalem-ai-01-r2-v1.png");
    assert.equal(sidecar.instruction, instructionText);
    assert.equal(sidecar.instructionSha256, sha256Hex(instructionText));
  });
});

test("writeAiCandidateAndSidecar treats null usageMetadata as absent", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await sharp({
      create: {
        width: 24,
        height: 16,
        channels: 3,
        background: { r: 61, g: 70, b: 120 }
      }
    })
      .png()
      .toBuffer();

    const result = await writeAiCandidateAndSidecar({
      incomingDirectory: temporaryDirectory,
      promptId: "damascus-ai-01",
      round: 1,
      variant: 1,
      imageBuffer,
      provider: "gemini",
      model: "gemini-3-pro-image",
      seed: 889,
      promptText: "A dusk scene near Damascus.",
      serviceTier: GEMINI_SERVICE_TIERS.FLEX,
      usageMetadata: null,
      estimatedCostUsd: 0.067
    });

    const sidecar = JSON.parse(await fs.readFile(result.sidecarPath, "utf8"));
    assert.equal("usageMetadata" in sidecar, false);
    assert.equal(sidecar.estimatedCostUsd, 0.067);
  });
});

test("writeAiCandidateAndSidecar refuses to overwrite existing candidate files", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await sharp({
      create: {
        width: 16,
        height: 16,
        channels: 3,
        background: { r: 120, g: 70, b: 30 }
      }
    })
      .png()
      .toBuffer();

    const args = {
      incomingDirectory: temporaryDirectory,
      promptId: "capernaum-ai-01",
      round: 1,
      variant: 1,
      imageBuffer,
      provider: "openai",
      model: "gpt-image-2.5-flare",
      seed: 11,
      promptText: "Prompt text."
    };

    await writeAiCandidateAndSidecar(args);

    await assert.rejects(
      () => writeAiCandidateAndSidecar(args),
      /candidate already exists; use another --round/u
    );
  });
});

test("writeAiCandidateAndSidecar checks side-car path before writing image", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await sharp({
      create: {
        width: 16,
        height: 16,
        channels: 3,
        background: { r: 20, g: 100, b: 160 }
      }
    })
      .png()
      .toBuffer();

    const imagePath = path.join(temporaryDirectory, "capernaum-ai-01-r1-v1.png");
    const sidecarPath = `${imagePath}.json`;
    await fs.writeFile(sidecarPath, "{\"existing\":true}\n", "utf8");

    await assert.rejects(
      () =>
        writeAiCandidateAndSidecar({
          incomingDirectory: temporaryDirectory,
          promptId: "capernaum-ai-01",
          round: 1,
          variant: 1,
          imageBuffer,
          provider: "openai",
          model: "gpt-image-2.5-flare",
          seed: 42,
          promptText: "Prompt text."
        }),
      /candidate already exists; use another --round/u
    );
    assert.equal(await pathExists(imagePath), false);
  });
});

test("writeAiCandidateAndSidecar writes image first and keeps it when side-car writing fails", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await sharp({
      create: {
        width: 16,
        height: 16,
        channels: 3,
        background: { r: 80, g: 130, b: 180 }
      }
    })
      .png()
      .toBuffer();

    const imagePath = path.join(temporaryDirectory, "capernaum-ai-01-r2-v1.png");
    const sidecarPath = `${imagePath}.json`;
    const writeTargets = [];

    await assert.rejects(
      () =>
        writeAiCandidateAndSidecar({
          incomingDirectory: temporaryDirectory,
          promptId: "capernaum-ai-01",
          round: 2,
          variant: 1,
          imageBuffer,
          provider: "openai",
          model: "gpt-image-2.5-flare",
          seed: 99,
          promptText: "Prompt text.",
          writeFileImpl: async (targetPath, content, options) => {
            writeTargets.push(path.basename(targetPath));
            if (targetPath === sidecarPath) {
              throw new Error("simulated side-car write failure");
            }
            return fs.writeFile(targetPath, content, options);
          }
        }),
      /simulated side-car write failure/u
    );

    assert.deepEqual(writeTargets, ["capernaum-ai-01-r2-v1.png", "capernaum-ai-01-r2-v1.png.json"]);
    assert.equal(await pathExists(imagePath), true);
    assert.equal(await pathExists(sidecarPath), false);
  });
});

test("parsePublishAiArguments supports --no-trim", () => {
  const parsed = parsePublishAiArguments([
    "--no-trim",
    "--id",
    "athens-ai-01",
    "media/ai-incoming/athens-ai-01-r1-v1.jpg"
  ]);
  assert.equal(parsed.trimBars, false);
  assert.equal(parsed.promptId, "athens-ai-01");
});

test("parseGenerateAiArguments rejects --round together with --edit-from", () => {
  assert.throws(
    () =>
      parseGenerateAiArguments([
        "jerusalem-ai-01",
        "--edit-from",
        "media/ai-incoming/jerusalem-ai-01-r2-v1.png",
        "--instruction",
        "Reduce crowd density and keep the same architecture.",
        "--round",
        "9"
      ]),
    /--round cannot be used with --edit-from/u
  );
});

test("publishAiCandidate trims near-uniform black letterbox bars with a hard edge", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await createPngBuffer(120, 80, (x, y) => {
      if (x >= 0 && (y < 10 || y >= 68)) {
        const barValue = (x + y) % 4;
        return [barValue, barValue, barValue];
      }
      return [120, 150, 190];
    });
    const { candidatePath } = await writeCandidateWithSidecar({
      temporaryDirectory,
      promptId: "athens-ai-01",
      fileName: "athens-ai-01-r1-v1.png",
      imageBuffer
    });

    const outputDirectory = path.join(temporaryDirectory, "media", "ai");
    const result = await publishAiCandidate({ candidatePath, outputDirectory });
    assert.deepEqual(result.trim, {
      top: 10,
      bottom: 12,
      left: 0,
      right: 0,
      enabled: true,
      applied: true
    });
    assert.equal(result.output.width, 120);
    assert.equal(result.output.height, 58);
  });
});

test("publishAiCandidate keeps a dark night sky with noise and gradual brightening", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await createPngBuffer(100, 60, (x, y) => {
      if (x >= 0 && y < 12) {
        const noise = ((x * 37) + (y * 17)) % 7;
        const value = Math.min(16, 7 + noise + Math.floor(y / 4));
        return [value, Math.max(0, value - 1), Math.max(0, value - 2)];
      }
      return [140, 110, 90];
    });
    const { candidatePath } = await writeCandidateWithSidecar({
      temporaryDirectory,
      promptId: "bethlehem-ai-01",
      fileName: "bethlehem-ai-01-r1-v1.png",
      imageBuffer
    });

    const outputDirectory = path.join(temporaryDirectory, "media", "ai");
    const result = await publishAiCandidate({ candidatePath, outputDirectory });
    assert.deepEqual(result.trim, {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      enabled: true,
      applied: false
    });
    assert.equal(result.output.width, 100);
    assert.equal(result.output.height, 60);
  });
});

test("publishAiCandidate keeps deep textured shadow that touches an edge", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await createPngBuffer(120, 80, (x, y) => {
      if (x < 12) {
        const value = ((x * 29) + (y * 31)) % 17;
        return [value, Math.max(0, value - 1), Math.max(0, value - 2)];
      }
      return [150, 165, 180];
    });
    const { candidatePath } = await writeCandidateWithSidecar({
      temporaryDirectory,
      promptId: "nazareth-ai-01",
      fileName: "nazareth-ai-01-r1-v1.png",
      imageBuffer
    });

    const outputDirectory = path.join(temporaryDirectory, "media", "ai");
    const result = await publishAiCandidate({ candidatePath, outputDirectory });
    assert.deepEqual(result.trim, {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      enabled: true,
      applied: false
    });
    assert.equal(result.output.width, 120);
    assert.equal(result.output.height, 80);
  });
});

test("publishAiCandidate removes left and right pillarbox bars", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await createPngBuffer(130, 70, (x, y) => {
      if ((x < 9 || x >= 123) && y >= 0) {
        return [0, 0, 0];
      }
      return [150, 165, 180];
    });
    const { candidatePath } = await writeCandidateWithSidecar({
      temporaryDirectory,
      promptId: "capernaum-ai-01",
      fileName: "capernaum-ai-01-r1-v1.png",
      imageBuffer
    });

    const outputDirectory = path.join(temporaryDirectory, "media", "ai");
    const result = await publishAiCandidate({ candidatePath, outputDirectory });
    assert.deepEqual(result.trim, {
      top: 0,
      bottom: 0,
      left: 9,
      right: 7,
      enabled: true,
      applied: true
    });
    assert.equal(result.output.width, 114);
    assert.equal(result.output.height, 70);
  });
});

test("publishAiCandidate keeps black objects that are not touching edges", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await createPngBuffer(120, 80, (x, y) => {
      if (x >= 45 && x < 75 && y >= 25 && y < 55) {
        return [0, 0, 0];
      }
      return [160, 180, 200];
    });
    const { candidatePath } = await writeCandidateWithSidecar({
      temporaryDirectory,
      promptId: "jerusalem-ai-01",
      fileName: "jerusalem-ai-01-r1-v1.png",
      imageBuffer
    });

    const outputDirectory = path.join(temporaryDirectory, "media", "ai");
    const result = await publishAiCandidate({ candidatePath, outputDirectory });
    assert.deepEqual(result.trim, {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      enabled: true,
      applied: false
    });
    assert.equal(result.output.width, 120);
    assert.equal(result.output.height, 80);
  });
});

test("publishAiCandidate --no-trim keeps bars", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const imageBuffer = await createPngBuffer(120, 80, (x, y) => {
      if (x >= 0 && (y < 10 || y >= 68)) {
        return [0, 0, 0];
      }
      return [120, 150, 190];
    });
    const { candidatePath } = await writeCandidateWithSidecar({
      temporaryDirectory,
      promptId: "athens-ai-01",
      fileName: "athens-ai-01-r1-v1.png",
      imageBuffer
    });

    const outputDirectory = path.join(temporaryDirectory, "media", "ai");
    const result = await publishAiCandidate({
      candidatePath,
      outputDirectory,
      trimBars: false
    });
    assert.deepEqual(result.trim, {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      enabled: false,
      applied: false
    });
    assert.equal(result.output.width, 120);
    assert.equal(result.output.height, 80);
  });
});

test("cloudflare-flux request shape and response parsing", async () => {
  const expectedBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00]);
  const calls = [];

  const result = await generateImageWithProvider({
    provider: "cloudflare-flux",
    model: DEFAULT_AI_MODELS["cloudflare-flux"],
    prompt: "Capernaum at sunrise",
    seed: 101,
    credentials: {
      cloudflareAccountId: "acct-123",
      cloudflareToken: "cf-token"
    },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({
        result: {
          image: expectedBuffer.toString("base64")
        }
      });
    }
  });

  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.equal(
    call.url,
    "https://api.cloudflare.com/client/v4/accounts/acct-123/ai/run/@cf/black-forest-labs/flux-2-klein-4b"
  );
  assert.equal(call.init.method, "POST");
  assert.equal(call.init.headers.Authorization, "Bearer cf-token");
  assert.equal(call.init.body instanceof FormData, true);
  assert.equal(call.init.body.get("prompt"), "Capernaum at sunrise");
  assert.equal(call.init.body.get("width"), "1536");
  assert.equal(call.init.body.get("height"), "864");
  assert.equal(call.init.body.get("seed"), "101");
  assert.deepEqual(result.imageBuffer, expectedBuffer);
});

test("cloudflare-lucid request shape and response parsing", async () => {
  const expectedBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const calls = [];

  const result = await generateImageWithProvider({
    provider: "cloudflare-lucid",
    model: DEFAULT_AI_MODELS["cloudflare-lucid"],
    prompt: "Jerusalem panorama",
    seed: 202,
    credentials: {
      cloudflareAccountId: "acct-xyz",
      cloudflareToken: "cf-token-2"
    },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({
        result: {
          image: expectedBuffer.toString("base64")
        }
      });
    }
  });

  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.equal(
    call.url,
    "https://api.cloudflare.com/client/v4/accounts/acct-xyz/ai/run/@cf/leonardo/lucid-origin"
  );
  assert.equal(call.init.method, "POST");
  assert.equal(call.init.headers.Authorization, "Bearer cf-token-2");
  assert.equal(call.init.headers["Content-Type"], "application/json");
  const requestPayload = JSON.parse(call.init.body);
  assert.deepEqual(requestPayload, {
    prompt: "Jerusalem panorama",
    width: 1536,
    height: 864,
    num_steps: 30,
    seed: 202
  });
  assert.deepEqual(result.imageBuffer, expectedBuffer);
});

test("openai request shape and response parsing", async () => {
  const expectedBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d]);
  const calls = [];

  const result = await generateImageWithProvider({
    provider: "openai",
    model: DEFAULT_AI_MODELS.openai,
    prompt: "Ancient harbor city",
    seed: 303,
    credentials: {
      openaiApiKey: "openai-secret"
    },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({
        data: [{ b64_json: expectedBuffer.toString("base64") }]
      });
    }
  });

  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.equal(call.url, "https://api.openai.com/v1/images/generations");
  assert.equal(call.init.method, "POST");
  assert.equal(call.init.headers.Authorization, "Bearer openai-secret");
  assert.equal(call.init.headers["Content-Type"], "application/json");
  const requestPayload = JSON.parse(call.init.body);
  assert.deepEqual(requestPayload, {
    model: "gpt-image-2.5-flare",
    prompt: "Ancient harbor city",
    n: 1,
    size: "1536x1024",
    quality: "high"
  });
  assert.deepEqual(result.imageBuffer, expectedBuffer);
});

test("gemini request shape and response parsing", async () => {
  const expectedBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0a]);
  const calls = [];
  const usageMetadata = {
    promptTokenCount: 1_000,
    candidatesTokenCount: 600,
    thoughtsTokenCount: 400
  };
  const customDispatcher = { name: "custom-dispatcher" };

  const result = await generateImageWithProvider({
    provider: "gemini",
    model: DEFAULT_AI_MODELS.gemini,
    prompt: "Ancient road entering a city gate",
    seed: 404,
    geminiDispatcher: customDispatcher,
    credentials: {
      geminiApiKey: "gemini-secret"
    },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({
        usageMetadata,
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: expectedBuffer.toString("base64")
                  }
                }
              ]
            }
          }
        ]
      }, 200, {
        "x-gemini-service-tier": "flex"
      });
    }
  });

  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.equal(
    call.url,
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent"
  );
  assert.equal(call.init.method, "POST");
  assert.equal(call.init.headers["x-goog-api-key"], "gemini-secret");
  assert.equal(call.init.headers["Content-Type"], "application/json");
  assert.equal(call.init.headers["X-Server-Timeout"], "900");
  assert.equal(call.init.dispatcher, customDispatcher);

  const requestPayload = JSON.parse(call.init.body);
  assert.equal(requestPayload.contents[0].parts[0].text, "Ancient road entering a city gate");
  assert.equal(requestPayload.service_tier, "flex");
  assert.deepEqual(requestPayload.generationConfig.responseModalities, ["IMAGE"]);
  assert.deepEqual(requestPayload.generationConfig.imageConfig, {
    aspectRatio: "16:9",
    imageSize: "2K"
  });
  assert.equal(requestPayload.generationConfig.seed, 404);
  assert.deepEqual(result.imageBuffer, expectedBuffer);
  assert.equal(result.serviceTier, "flex");
  assert.deepEqual(result.usageMetadata, usageMetadata);
  assert.equal(result.estimatedCostUsd, 0.074);
});

test("gemini success without usageMetadata still writes candidate and side-car", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const calls = [];
    const generatedPng = await sharp({
      create: {
        width: 16,
        height: 10,
        channels: 3,
        background: { r: 20, g: 30, b: 40 }
      }
    })
      .png()
      .toBuffer();

    const providerResult = await generateImageWithProvider({
      provider: "gemini",
      model: DEFAULT_AI_MODELS.gemini,
      prompt: "Damascus at dusk, market street view.",
      seed: 410,
      credentials: {
        geminiApiKey: "gemini-secret"
      },
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return jsonResponse(
          {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: "image/png",
                        data: generatedPng.toString("base64")
                      }
                    }
                  ]
                }
              }
            ]
          },
          200,
          {
            "x-gemini-service-tier": "flex"
          }
        );
      }
    });

    assert.equal(calls.length, 1);
    assert.equal(providerResult.usageMetadata, undefined);
    assert.equal(providerResult.estimatedCostUsd, 0.067);

    const written = await writeAiCandidateAndSidecar({
      incomingDirectory: temporaryDirectory,
      promptId: "damascus-ai-01",
      round: 1,
      variant: 1,
      imageBuffer: providerResult.imageBuffer,
      provider: "gemini",
      model: DEFAULT_AI_MODELS.gemini,
      seed: 410,
      promptText: "Damascus at dusk, market street view.",
      serviceTier: providerResult.serviceTier,
      usageMetadata: providerResult.usageMetadata,
      estimatedCostUsd: providerResult.estimatedCostUsd
    });

    assert.equal(await pathExists(written.imagePath), true);
    const sidecar = JSON.parse(await fs.readFile(written.sidecarPath, "utf8"));
    assert.equal("usageMetadata" in sidecar, false);
    assert.equal(sidecar.estimatedCostUsd, 0.067);
  });
});

test("gemini cost estimate does not charge image tokens twice", () => {
  // An edit: 300 text + 560 image tokens in; 200 text + 1,120 image tokens out, plus 400 thinking.
  const usageMetadata = {
    promptTokenCount: 860,
    promptTokensDetails: [
      { modality: "TEXT", tokenCount: 300 },
      { modality: "IMAGE", tokenCount: 560 }
    ],
    candidatesTokenCount: 1_320,
    candidatesTokensDetails: [
      { modality: "TEXT", tokenCount: 200 },
      { modality: "IMAGE", tokenCount: 1_120 }
    ],
    thoughtsTokenCount: 400
  };

  // 300 × $1/M + (200 + 400) × $6/M + 1 input image × $0.00056 + 1 output image × $0.067
  assert.equal(
    estimateGeminiCostUsd({ serviceTier: "flex", usageMetadata, inputImageCount: 1 }),
    0.07146
  );
  assert.equal(
    estimateGeminiCostUsd({ serviceTier: "standard", usageMetadata, inputImageCount: 1 }),
    0.14292
  );
});

test("gemini standard tier opt-out sets service_tier to standard", async () => {
  const calls = [];

  await generateImageWithProvider({
    provider: "gemini",
    model: DEFAULT_AI_MODELS.gemini,
    prompt: "City at dawn",
    seed: 405,
    tier: GEMINI_SERVICE_TIERS.STANDARD,
    credentials: {
      geminiApiKey: "gemini-secret"
    },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64")
                  }
                }
              ]
            }
          }
        ]
      }, 200, {
        "x-gemini-service-tier": "standard"
      });
    }
  });

  const requestPayload = JSON.parse(calls[0].init.body);
  assert.equal(requestPayload.service_tier, "standard");
});

test("gemini 503 retries and succeeds", async () => {
  let callCount = 0;
  const sleepCalls = [];
  const retryEvents = [];

  const result = await generateImageWithProvider({
    provider: "gemini",
    model: DEFAULT_AI_MODELS.gemini,
    prompt: "Retry test",
    seed: 406,
    credentials: {
      geminiApiKey: "gemini-secret"
    },
    fetchImpl: async () => {
      callCount += 1;
      if (callCount === 1) {
        return jsonResponse(
          {
            error: { message: "Service temporarily unavailable" }
          },
          503
        );
      }
      return jsonResponse({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64")
                  }
                }
              ]
            }
          }
        ]
      });
    },
    sleepImpl: async (milliseconds) => {
      sleepCalls.push(milliseconds);
    },
    randomImpl: () => 0,
    onGeminiRetry: (event) => {
      retryEvents.push(event);
    }
  });

  assert.equal(callCount, 2);
  assert.deepEqual(sleepCalls, [30_000]);
  assert.equal(retryEvents.length, 1);
  assert.equal(retryEvents[0].status, 503);
  assert.equal(result.imageBuffer.length > 0, true);
});

test("gemini 429 retries are bounded", async () => {
  let callCount = 0;
  const sleepCalls = [];

  await assert.rejects(
    () =>
      generateImageWithProvider({
        provider: "gemini",
        model: DEFAULT_AI_MODELS.gemini,
        prompt: "Busy tier test",
        seed: 407,
        credentials: {
          geminiApiKey: "gemini-secret"
        },
        fetchImpl: async () => {
          callCount += 1;
          return jsonResponse(
            {
              error: { message: "Resource exhausted" }
            },
            429
          );
        },
        sleepImpl: async (milliseconds) => {
          sleepCalls.push(milliseconds);
        },
        randomImpl: () => 0
      }),
    /after 5 attempts/u
  );

  assert.equal(callCount, 5);
  assert.deepEqual(sleepCalls, [30_000, 60_000, 120_000, 240_000]);
});

test("gemini 400 is not retried", async () => {
  let callCount = 0;

  await assert.rejects(
    () =>
      generateImageWithProvider({
        provider: "gemini",
        model: DEFAULT_AI_MODELS.gemini,
        prompt: "Bad request test",
        seed: 408,
        credentials: {
          geminiApiKey: "gemini-secret"
        },
        fetchImpl: async () => {
          callCount += 1;
          return jsonResponse(
            {
              error: { message: "Bad request" }
            },
            400
          );
        }
      }),
    /400/u
  );

  assert.equal(callCount, 1);
});

test("gemini transport errors warn about possible billing and redact secrets", async () => {
  const secret = "gemini-transport-secret";

  await assert.rejects(
    () =>
      generateImageWithProvider({
        provider: "gemini",
        model: DEFAULT_AI_MODELS.gemini,
        prompt: "Transport error warning test",
        seed: 409,
        credentials: {
          geminiApiKey: secret
        },
        fetchImpl: async () => {
          throw new Error(`socket closed while sending with key ${secret}`);
        }
      }),
    (error) => {
      assert.match(
        error.message,
        /The connection to Gemini closed before a response arrived\./u
      );
      assert.match(
        error.message,
        /Google may still have billed this image; check usage in Google AI Studio before running it again\./u
      );
      assert.equal(error.message.includes(secret), false);
      return true;
    }
  );
});

test("gemini edit-mode request sends inlineData and instruction text", async () => {
  const calls = [];
  const editImage = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);

  await generateImageWithProvider({
    provider: "gemini",
    model: DEFAULT_AI_MODELS.gemini,
    seed: 409,
    credentials: {
      geminiApiKey: "gemini-secret"
    },
    editInput: {
      imageBuffer: editImage,
      mimeType: "image/jpeg",
      instruction: "Remove modern scaffolding and make the market quieter."
    },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64")
                  }
                }
              ]
            }
          }
        ]
      });
    }
  });

  const requestPayload = JSON.parse(calls[0].init.body);
  const userParts = requestPayload.contents[0].parts;
  assert.equal(userParts[0].inlineData.mimeType, "image/jpeg");
  assert.equal(userParts[0].inlineData.data, editImage.toString("base64"));
  assert.equal(
    userParts[1].text,
    "Remove modern scaffolding and make the market quieter."
  );
});

test("cloudflare 429 with code 4006 stops immediately without retry", async () => {
  let callCount = 0;
  await assert.rejects(
    () =>
      generateImageWithProvider({
        provider: "cloudflare-flux",
        model: DEFAULT_AI_MODELS["cloudflare-flux"],
        prompt: "Capernaum scene",
        seed: 505,
        credentials: {
          cloudflareAccountId: "acct-limit",
          cloudflareToken: "cf-token-limit"
        },
        fetchImpl: async () => {
          callCount += 1;
          return jsonResponse(
            {
              success: false,
              errors: [{ code: 4006, message: "Daily allocation exhausted" }]
            },
            429
          );
        }
      }),
    /4006/u
  );
  assert.equal(callCount, 1);
});

test("cloudflare 408 retries up to success", async () => {
  const expectedBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);
  let callCount = 0;
  const sleepCalls = [];

  const result = await generateImageWithProvider({
    provider: "cloudflare-flux",
    model: DEFAULT_AI_MODELS["cloudflare-flux"],
    prompt: "Retry scenario prompt",
    seed: 606,
    credentials: {
      cloudflareAccountId: "acct-retry",
      cloudflareToken: "cf-token-retry"
    },
    fetchImpl: async () => {
      callCount += 1;
      if (callCount === 1) {
        return jsonResponse(
          {
            success: false,
            errors: [{ code: 1001, message: "Request timeout" }]
          },
          408
        );
      }
      return jsonResponse({
        result: {
          image: expectedBuffer.toString("base64")
        }
      });
    },
    sleepImpl: async (milliseconds) => {
      sleepCalls.push(milliseconds);
    }
  });

  assert.equal(callCount, 2);
  assert.deepEqual(sleepCalls, [2_000]);
  assert.deepEqual(result.imageBuffer, expectedBuffer);
});

test("provider errors redact secrets from thrown messages", async () => {
  const secret = "openai-sensitive-token";

  await assert.rejects(
    () =>
      generateImageWithProvider({
        provider: "openai",
        model: DEFAULT_AI_MODELS.openai,
        prompt: "Secret redaction test",
        seed: 707,
        credentials: {
          openaiApiKey: secret
        },
        fetchImpl: async () => {
          throw new Error(`request failed with token=${secret}`);
        }
      }),
    (error) => {
      assert.equal(error.message.includes(secret), false);
      assert.equal(error.message.includes("***"), true);
      return true;
    }
  );
});

test("provider errors redact secrets from nested cause chains", async () => {
  const secret = "nested-openai-secret-token";
  const inner = new Error(`inner cause leaked ${secret}`);
  const middle = new Error("middle cause");
  middle.cause = inner;
  const outer = new Error("outer network failure");
  outer.cause = middle;

  await assert.rejects(
    () =>
      generateImageWithProvider({
        provider: "openai",
        model: DEFAULT_AI_MODELS.openai,
        prompt: "Nested secret redaction test",
        seed: 708,
        credentials: {
          openaiApiKey: secret
        },
        fetchImpl: async () => {
          throw outer;
        }
      }),
    (error) => {
      assert.equal(error.message.includes(secret), false);
      assert.equal(error.cause instanceof Error, true);
      assert.equal(error.cause.cause instanceof Error, true);
      assert.equal(error.cause.cause.cause instanceof Error, true);
      assert.equal(error.cause.cause.cause.message.includes(secret), false);
      return true;
    }
  );
});

test("summarizeAiIncomingCosts prints per-place totals from side-cars", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const incomingDirectory = path.join(temporaryDirectory, "media", "ai-incoming");
    await fs.mkdir(incomingDirectory, { recursive: true });

    const sidecars = [
      {
        fileName: "capernaum-ai-01-r1-v1.png.json",
        payload: {
          promptId: "capernaum-ai-01",
          estimatedCostUsd: 0.067
        }
      },
      {
        fileName: "capernaum-ai-01-r2-v1.png.json",
        payload: {
          promptId: "capernaum-ai-01",
          estimatedCostUsd: 0.082
        }
      },
      {
        fileName: "jerusalem-ai-01-r1-v1.jpg.json",
        payload: {
          promptId: "jerusalem-ai-01",
          estimatedCostUsd: 0.134
        }
      }
    ];

    for (const sidecar of sidecars) {
      await fs.writeFile(
        path.join(incomingDirectory, sidecar.fileName),
        `${JSON.stringify(sidecar.payload, null, 2)}\n`,
        "utf8"
      );
    }

    const summary = await summarizeAiIncomingCosts({ incomingDirectory });
    assert.deepEqual(summary.rows, [
      {
        locationId: "capernaum",
        candidates: 2,
        totalCostUsd: 0.149
      },
      {
        locationId: "jerusalem",
        candidates: 1,
        totalCostUsd: 0.134
      }
    ]);
    assert.equal(summary.totalCandidates, 3);
    assert.equal(summary.totalCostUsd, 0.283);
  });
});

test("estimateGeminiCostUsd computes flex and standard costs from usage metadata", () => {
  const usageMetadata = {
    promptTokenCount: 1_000,
    candidatesTokenCount: 1_000,
    thoughtsTokenCount: 1_000,
    promptTokensDetails: [{ modality: "IMAGE", tokenCount: 256 }]
  };

  // 744 text input tokens (1,000 minus the 256 image tokens, which the per-image price covers),
  // 2,000 output and thinking tokens, one input image and one output image.
  assert.equal(
    estimateGeminiCostUsd({
      serviceTier: GEMINI_SERVICE_TIERS.FLEX,
      usageMetadata,
      inputImageCount: 1,
      outputImageCount: 1
    }),
    0.080304
  );
  assert.equal(
    estimateGeminiCostUsd({
      serviceTier: GEMINI_SERVICE_TIERS.STANDARD,
      usageMetadata,
      inputImageCount: 1,
      outputImageCount: 1
    }),
    0.160608
  );
});

test("publishAiCandidate writes valid WebP under 400 KB and validateData accepts it", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const incomingDirectory = path.join(temporaryDirectory, "media", "ai-incoming");
    const aiOutputDirectory = path.join(temporaryDirectory, "media", "ai");
    await fs.mkdir(incomingDirectory, { recursive: true });
    await fs.mkdir(aiOutputDirectory, { recursive: true });

    const candidatePath = path.join(incomingDirectory, "capernaum-ai-01-r1-v1.png");
    const sidecarPath = `${candidatePath}.json`;
    const promptText = "AI prompt text for Capernaum.";
    const sidecar = {
      provider: "openai",
      model: "gpt-image-2.5-flare",
      date: "2026-10-01T18:00:00.000Z",
      seed: 808,
      round: 1,
      promptId: "capernaum-ai-01",
      prompt: promptText,
      promptSha256: sha256Hex(promptText)
    };

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="2200" height="1300">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#8dc4ff"/>
            <stop offset="100%" stop-color="#f7d18a"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="2200" height="1300" fill="url(#sky)"/>
        <rect x="0" y="860" width="2200" height="440" fill="#a97f4f"/>
        <rect x="220" y="660" width="360" height="240" fill="#5a5a5a"/>
        <rect x="660" y="620" width="340" height="280" fill="#4d4d4d"/>
        <rect x="1060" y="640" width="410" height="260" fill="#676767"/>
        <rect x="0" y="0" width="2200" height="100" fill="#000000"/>
        <rect x="0" y="1200" width="2200" height="100" fill="#000000"/>
      </svg>
    `;
    const candidateBuffer = await sharp(Buffer.from(svg), {
      density: 300
    })
      .png()
      .toBuffer();

    await fs.writeFile(candidatePath, candidateBuffer);
    await fs.writeFile(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");

    const publishResult = await publishAiCandidate({
      candidatePath,
      outputDirectory: aiOutputDirectory
    });

    assert.equal(publishResult.promptId, "capernaum-ai-01");
    assert.equal(derivePromptIdFromCandidateFileName(candidatePath), "capernaum-ai-01");
    assert.equal(publishResult.output.bytes <= MAX_AI_IMAGE_BYTES, true);
    assert.equal(publishResult.output.width <= 1600, true);
    assert.equal(publishResult.mediaUrl, "media/ai/capernaum-ai-01.webp");
    assert.equal(publishResult.trim.enabled, true);
    assert.equal(publishResult.trim.left, 0);
    assert.equal(publishResult.trim.right, 0);
    assert.deepEqual(publishResult.mediaEntryGenerator, {
      tool: "openai",
      model: "gpt-image-2.5-flare",
      date: "2026-10-01"
    });

    const publishedBuffer = await fs.readFile(publishResult.outputPath);
    const outputMetadata = await sharp(publishedBuffer).metadata();
    assert.equal(outputMetadata.format, "webp");
    assert.equal(outputMetadata.width, publishResult.output.width);
    assert.equal(outputMetadata.height, publishResult.output.height);

    const locationsDirectory = path.join(temporaryDirectory, "data", "locations");
    const mediaDirectory = path.join(temporaryDirectory, "data", "media");
    await fs.mkdir(locationsDirectory, { recursive: true });
    await fs.mkdir(mediaDirectory, { recursive: true });

    await fs.copyFile(
      path.join(validCaseLocationDirectory, "capernaum.json"),
      path.join(locationsDirectory, "capernaum.json")
    );
    await fs.copyFile(
      path.join(validCaseLocationDirectory, "galilee.json"),
      path.join(locationsDirectory, "galilee.json")
    );

    const mediaRecord = {
      locationId: "capernaum",
      images: [
        {
          id: "capernaum-ai-01",
          url: "media/ai/capernaum-ai-01.webp",
          width: publishResult.output.width,
          height: publishResult.output.height,
          caption: "AI reconstruction fixture image.",
          kind: "ai-reconstruction",
          aiGenerated: true,
          generator: publishResult.mediaEntryGenerator,
          promptRef: "### AI-generated reconstruction — prompt capernaum-ai-01",
          basedOn: ["openbible:capernaum", "bib:existing-bib-source"]
        }
      ]
    };

    await fs.writeFile(
      path.join(mediaDirectory, "capernaum.json"),
      `${JSON.stringify(mediaRecord, null, 2)}\n`,
      "utf8"
    );

    const validationResult = await validateData({
      locationsDirectory,
      mediaDirectory,
      aiMediaDirectory: aiOutputDirectory,
      imagePromptsDirectory: path.join(temporaryDirectory, "content", "image-prompts"),
      webVplPath: webFixturePath,
      bibliographyPath: bibliographyFixturePath,
      skipSnapshotChecksumCheck: true,
      requireEmpireRoot: false
    });

    assert.equal(
      validationResult.errors.length,
      0,
      JSON.stringify(validationResult.errors, null, 2)
    );
  });
});
