import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { MAX_AI_IMAGE_BYTES, MAX_AI_IMAGE_WIDTH_PX } from "./validator.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..", "..");
const execFileAsync = promisify(execFile);

const PROMPT_ID_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*)-ai-[0-9]{2}$/u;
const HEADING_KEEP_OUT_PATTERN = /^Keep out \/ keep vague:/iu;
const MARKDOWN_HEADING_PATTERN = /^#{1,6}\s+/u;
const AI_CANDIDATE_FILE_PATTERN =
  /^([a-z0-9]+(?:-[a-z0-9]+)*-ai-[0-9]{2})-r[1-9][0-9]*-v[1-9][0-9]*\.[a-z0-9]+$/u;

export const DEFAULT_IMAGE_PROMPTS_DIRECTORY = path.join(
  repositoryRoot,
  "content",
  "image-prompts"
);
export const DEFAULT_AI_INCOMING_DIRECTORY = path.join(
  repositoryRoot,
  "media",
  "ai-incoming"
);
export const DEFAULT_AI_MEDIA_DIRECTORY = path.join(repositoryRoot, "media", "ai");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function toIsoDateString(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value '${dateValue}'.`);
  }
  return date.toISOString();
}

function formatDateOnly(dateValue) {
  const iso = toIsoDateString(dateValue);
  return iso.slice(0, 10);
}

function parseIntegerFlag(flagName, value, { min }) {
  const parsedValue = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsedValue) || parsedValue < min) {
    throw new Error(`${flagName} must be an integer >= ${min}.`);
  }
  return parsedValue;
}

function ensurePromptId(promptId) {
  if (typeof promptId !== "string" || !PROMPT_ID_PATTERN.test(promptId)) {
    throw new Error(
      `Prompt id must match <location-id>-ai-NN (received '${promptId ?? ""}').`
    );
  }
}

function parseLongOptionValue(argument, nextArgument, flagName) {
  if (argument === flagName) {
    if (!nextArgument || nextArgument.startsWith("--")) {
      throw new Error(`${flagName} requires a value.`);
    }
    return { value: nextArgument, consumedNext: true };
  }

  if (argument.startsWith(`${flagName}=`)) {
    return {
      value: argument.slice(`${flagName}=`.length),
      consumedNext: false
    };
  }

  return null;
}

export function promptIdToLocationId(promptId) {
  ensurePromptId(promptId);
  const match = PROMPT_ID_PATTERN.exec(promptId);
  return match[1];
}

export function extractPromptTextFromMarkdown(markdown, promptId) {
  ensurePromptId(promptId);
  if (typeof markdown !== "string") {
    throw new Error("Prompt brief content must be a string.");
  }

  const headingPattern = new RegExp(
    `^###\\s+AI-generated reconstruction\\s+[—-]\\s+prompt\\s+${escapeRegExp(promptId)}\\s*$`,
    "u"
  );

  const lines = markdown.split(/\r?\n/gu);
  let headingLineIndex = -1;

  for (const [lineIndex, line] of lines.entries()) {
    if (headingPattern.test(line.trim())) {
      headingLineIndex = lineIndex;
      break;
    }
  }

  if (headingLineIndex === -1) {
    throw new Error(
      `Missing heading '### AI-generated reconstruction — prompt ${promptId}' in prompt brief.`
    );
  }

  const promptLines = [];
  for (let lineIndex = headingLineIndex + 1; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const trimmed = line.trim();
    if (HEADING_KEEP_OUT_PATTERN.test(trimmed)) {
      break;
    }
    if (MARKDOWN_HEADING_PATTERN.test(trimmed)) {
      break;
    }
    promptLines.push(line);
  }

  const promptText = promptLines.join("\n").trim();
  if (promptText.length === 0) {
    throw new Error(
      `Prompt heading for '${promptId}' was found, but it has no prompt text before 'Keep out / keep vague:' or the next heading.`
    );
  }

  return promptText;
}

export async function loadPromptTextForPromptId(
  promptId,
  { promptsDirectory = DEFAULT_IMAGE_PROMPTS_DIRECTORY } = {}
) {
  const locationId = promptIdToLocationId(promptId);
  const promptFilePath = path.join(path.resolve(promptsDirectory), `${locationId}.md`);
  let markdown;

  try {
    markdown = await fs.readFile(promptFilePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Prompt brief not found: ${promptFilePath}`);
    }
    throw error;
  }

  return {
    promptText: extractPromptTextFromMarkdown(markdown, promptId),
    promptFilePath
  };
}

export function sha256Hex(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function detectImageExtensionFromBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    throw new Error("Image buffer is empty or too small to detect its format.");
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  throw new Error("Unsupported image format: expected PNG, JPEG, or WebP bytes.");
}

export async function writeAiCandidateAndSidecar({
  incomingDirectory = DEFAULT_AI_INCOMING_DIRECTORY,
  promptId,
  round,
  variant,
  imageBuffer,
  provider,
  model,
  seed,
  promptText,
  now = new Date()
}) {
  ensurePromptId(promptId);
  if (!Number.isInteger(round) || round < 1) {
    throw new Error("round must be an integer >= 1.");
  }
  if (!Number.isInteger(variant) || variant < 1) {
    throw new Error("variant must be an integer >= 1.");
  }
  if (typeof provider !== "string" || provider.length === 0) {
    throw new Error("provider is required.");
  }
  if (typeof model !== "string" || model.length === 0) {
    throw new Error("model is required.");
  }
  if (!Number.isInteger(seed) || seed < 0) {
    throw new Error("seed must be an integer >= 0.");
  }
  if (typeof promptText !== "string" || promptText.trim().length === 0) {
    throw new Error("promptText is required.");
  }

  const extension = detectImageExtensionFromBuffer(imageBuffer);
  const directoryPath = path.resolve(incomingDirectory);
  await fs.mkdir(directoryPath, { recursive: true });

  const baseName = `${promptId}-r${round}-v${variant}`;
  const imagePath = path.join(directoryPath, `${baseName}.${extension}`);
  const sidecarPath = `${imagePath}.json`;
  const promptSha256 = sha256Hex(promptText);
  const sidecar = {
    provider,
    model,
    date: toIsoDateString(now),
    seed,
    round,
    promptId,
    prompt: promptText,
    promptSha256
  };

  await fs.writeFile(imagePath, imageBuffer);
  await fs.writeFile(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");

  return {
    imagePath,
    sidecarPath,
    extension,
    sidecar
  };
}

export async function readWindowsUserEnvironmentVariable(variableName) {
  if (typeof variableName !== "string" || variableName.trim().length === 0) {
    return undefined;
  }

  try {
    const { stdout } = await execFileAsync(
      "reg",
      ["query", "HKCU\\Environment", "/v", variableName],
      { windowsHide: true }
    );

    const outputLines = stdout.split(/\r?\n/gu);
    const valuePattern = new RegExp(
      `^\\s*${escapeRegExp(variableName)}\\s+REG_[A-Z0-9_]+\\s+(.+)$`,
      "iu"
    );

    for (const outputLine of outputLines) {
      const match = valuePattern.exec(outputLine);
      if (!match) {
        continue;
      }

      const value = match[1].trim();
      return value.length > 0 ? value : undefined;
    }

    return undefined;
  } catch (error) {
    if (
      error?.code === 1 ||
      /unable to find/i.test(String(error?.stderr ?? "")) ||
      /unable to find/i.test(String(error?.stdout ?? ""))
    ) {
      return undefined;
    }

    return undefined;
  }
}

export async function getEnvironmentVariable(variableName, options = {}) {
  const {
    env = process.env,
    platform = process.platform,
    readWindowsVariable = readWindowsUserEnvironmentVariable
  } = options;

  const directValue = typeof env?.[variableName] === "string" ? env[variableName].trim() : "";
  if (directValue.length > 0) {
    return directValue;
  }

  if (platform === "win32") {
    return readWindowsVariable(variableName);
  }

  return undefined;
}

export function parseGenerateAiArguments(argv) {
  const options = {
    provider: "cloudflare-flux",
    variants: 1,
    round: 1
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    const providerOption = parseLongOptionValue(argument, argv[index + 1], "--provider");
    if (providerOption) {
      options.provider = providerOption.value;
      if (providerOption.consumedNext) {
        index += 1;
      }
      continue;
    }

    const modelOption = parseLongOptionValue(argument, argv[index + 1], "--model");
    if (modelOption) {
      options.model = modelOption.value;
      if (modelOption.consumedNext) {
        index += 1;
      }
      continue;
    }

    const variantsOption = parseLongOptionValue(argument, argv[index + 1], "--variants");
    if (variantsOption) {
      options.variants = parseIntegerFlag("--variants", variantsOption.value, { min: 1 });
      if (variantsOption.consumedNext) {
        index += 1;
      }
      continue;
    }

    const roundOption = parseLongOptionValue(argument, argv[index + 1], "--round");
    if (roundOption) {
      options.round = parseIntegerFlag("--round", roundOption.value, { min: 1 });
      if (roundOption.consumedNext) {
        index += 1;
      }
      continue;
    }

    const seedOption = parseLongOptionValue(argument, argv[index + 1], "--seed");
    if (seedOption) {
      options.seed = parseIntegerFlag("--seed", seedOption.value, { min: 0 });
      if (seedOption.consumedNext) {
        index += 1;
      }
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(`Unknown argument: ${argument}`);
    }

    if (typeof options.promptId === "string") {
      throw new Error(`Unexpected positional argument '${argument}'.`);
    }
    options.promptId = argument;
  }

  if (!options.promptId) {
    throw new Error(
      "Usage: npm run generate:ai -- <prompt-id> [--provider cloudflare-flux|cloudflare-lucid|openai|gemini] [--model <id>] [--variants N] [--round N] [--seed S]"
    );
  }

  ensurePromptId(options.promptId);
  return options;
}

export function parsePublishAiArguments(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    const idOption = parseLongOptionValue(argument, argv[index + 1], "--id");
    if (idOption) {
      options.promptId = idOption.value;
      if (idOption.consumedNext) {
        index += 1;
      }
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(`Unknown argument: ${argument}`);
    }

    if (typeof options.candidatePath === "string") {
      throw new Error(`Unexpected positional argument '${argument}'.`);
    }
    options.candidatePath = path.resolve(argument);
  }

  if (!options.candidatePath) {
    throw new Error("Usage: npm run publish:ai -- <candidate-file> [--id <prompt-id>]");
  }

  if (options.promptId) {
    ensurePromptId(options.promptId);
  }

  return options;
}

export function derivePromptIdFromCandidateFileName(candidatePath) {
  const baseName = path.basename(candidatePath);
  const match = AI_CANDIDATE_FILE_PATTERN.exec(baseName);
  return match ? match[1] : null;
}

export async function readCandidateSidecar(sidecarPath) {
  let sidecarRawText;
  try {
    sidecarRawText = await fs.readFile(sidecarPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Candidate side-car file was not found: ${sidecarPath}`);
    }
    throw error;
  }

  let sidecarData;
  try {
    sidecarData = JSON.parse(sidecarRawText);
  } catch (error) {
    throw new Error(`Candidate side-car is not valid JSON: ${error.message}`);
  }

  if (!sidecarData || typeof sidecarData !== "object") {
    throw new Error("Candidate side-car must be a JSON object.");
  }

  return sidecarData;
}

export function mediaEntryGeneratorFromSidecar(sidecarData) {
  if (typeof sidecarData?.provider !== "string" || sidecarData.provider.length === 0) {
    throw new Error("Candidate side-car is missing provider.");
  }
  if (typeof sidecarData?.model !== "string" || sidecarData.model.length === 0) {
    throw new Error("Candidate side-car is missing model.");
  }
  if (typeof sidecarData?.date !== "string" || sidecarData.date.length === 0) {
    throw new Error("Candidate side-car is missing date.");
  }

  return {
    tool: sidecarData.provider,
    model: sidecarData.model,
    date: formatDateOnly(sidecarData.date)
  };
}

export async function publishAiCandidate({
  candidatePath,
  promptId,
  outputDirectory = DEFAULT_AI_MEDIA_DIRECTORY,
  sidecarPath,
  maxWidthPx = MAX_AI_IMAGE_WIDTH_PX,
  maxBytes = MAX_AI_IMAGE_BYTES,
  minQuality = 60,
  maxQuality = 95,
  qualityStep = 5
}) {
  if (!candidatePath) {
    throw new Error("candidatePath is required.");
  }
  if (!Number.isInteger(maxWidthPx) || maxWidthPx < 1) {
    throw new Error("maxWidthPx must be a positive integer.");
  }
  if (!Number.isInteger(maxBytes) || maxBytes < 1) {
    throw new Error("maxBytes must be a positive integer.");
  }
  if (
    !Number.isInteger(minQuality) ||
    !Number.isInteger(maxQuality) ||
    !Number.isInteger(qualityStep) ||
    minQuality < 1 ||
    maxQuality > 100 ||
    qualityStep < 1 ||
    minQuality > maxQuality
  ) {
    throw new Error("Invalid quality range for WebP conversion.");
  }

  const resolvedCandidatePath = path.resolve(candidatePath);
  const resolvedSidecarPath =
    typeof sidecarPath === "string" && sidecarPath.length > 0
      ? path.resolve(sidecarPath)
      : `${resolvedCandidatePath}.json`;
  const sidecarData = await readCandidateSidecar(resolvedSidecarPath);

  const sidecarPromptId =
    typeof sidecarData.promptId === "string" && sidecarData.promptId.length > 0
      ? sidecarData.promptId
      : undefined;
  const fileNamePromptId = derivePromptIdFromCandidateFileName(resolvedCandidatePath);
  const resolvedPromptId = promptId ?? sidecarPromptId ?? fileNamePromptId;
  ensurePromptId(resolvedPromptId);

  if (sidecarPromptId && sidecarPromptId !== resolvedPromptId) {
    throw new Error(
      `Prompt id mismatch: --id '${resolvedPromptId}' does not match side-car promptId '${sidecarPromptId}'.`
    );
  }

  const inputBuffer = await fs.readFile(resolvedCandidatePath);
  let bestOutput = null;

  for (let quality = maxQuality; quality >= minQuality; quality -= qualityStep) {
    const webpBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: maxWidthPx,
        withoutEnlargement: true
      })
      .webp({
        quality,
        effort: 4
      })
      .toBuffer();

    if (webpBuffer.length <= maxBytes) {
      bestOutput = { buffer: webpBuffer, quality };
      break;
    }
  }

  if (!bestOutput) {
    throw new Error(
      `Could not fit '${path.basename(
        resolvedCandidatePath
      )}' into ${maxBytes} bytes at quality >= ${minQuality}.`
    );
  }

  const outputMetadata = await sharp(bestOutput.buffer).metadata();
  if (!Number.isInteger(outputMetadata.width) || !Number.isInteger(outputMetadata.height)) {
    throw new Error("Generated WebP has missing width/height metadata.");
  }

  const resolvedOutputDirectory = path.resolve(outputDirectory);
  await fs.mkdir(resolvedOutputDirectory, { recursive: true });
  const outputPath = path.join(resolvedOutputDirectory, `${resolvedPromptId}.webp`);
  await fs.writeFile(outputPath, bestOutput.buffer);

  return {
    promptId: resolvedPromptId,
    outputPath,
    output: {
      width: outputMetadata.width,
      height: outputMetadata.height,
      bytes: bestOutput.buffer.length,
      quality: bestOutput.quality
    },
    sidecarPath: resolvedSidecarPath,
    sidecarData,
    mediaEntryGenerator: mediaEntryGeneratorFromSidecar(sidecarData),
    mediaUrl: `media/ai/${resolvedPromptId}.webp`
  };
}
