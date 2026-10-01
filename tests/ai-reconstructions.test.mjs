import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import {
  DEFAULT_AI_MODELS,
  generateImageWithProvider
} from "../scripts/lib/ai-providers.mjs";
import {
  derivePromptIdFromCandidateFileName,
  extractPromptTextFromMarkdown,
  publishAiCandidate,
  sha256Hex,
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

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
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

  const result = await generateImageWithProvider({
    provider: "gemini",
    model: DEFAULT_AI_MODELS.gemini,
    prompt: "Ancient road entering a city gate",
    seed: 404,
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
                    data: expectedBuffer.toString("base64")
                  }
                }
              ]
            }
          }
        ]
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

  const requestPayload = JSON.parse(call.init.body);
  assert.equal(requestPayload.contents[0].parts[0].text, "Ancient road entering a city gate");
  assert.deepEqual(requestPayload.generationConfig.responseModalities, ["IMAGE"]);
  assert.deepEqual(requestPayload.generationConfig.imageConfig, {
    aspectRatio: "16:9",
    imageSize: "2K"
  });
  assert.equal(requestPayload.generationConfig.seed, 404);
  assert.deepEqual(result.imageBuffer, expectedBuffer);
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
