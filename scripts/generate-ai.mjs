import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_AI_MODELS,
  DEFAULT_GEMINI_SERVICE_TIER,
  GEMINI_SERVICE_TIERS,
  REQUIRED_ENV_VARS_BY_PROVIDER,
  SUPPORTED_AI_PROVIDERS,
  generateImageWithProvider,
  redactErrorCauseChain,
  redactSecrets
} from "./lib/ai-providers.mjs";
import {
  DEFAULT_AI_INCOMING_DIRECTORY,
  findExistingCandidateFiles,
  getEnvironmentVariable,
  loadPromptTextForPromptId,
  parseAiCandidateFileName,
  parseGenerateAiArguments,
  writeAiCandidateAndSidecar
} from "./lib/ai-reconstructions.mjs";

const KEEP_OUT_LINE_PATTERN = /^Keep out \/ keep vague:/imu;

function randomSeed() {
  return crypto.randomInt(0, 2_147_483_647);
}

function ensureProvider(provider) {
  if (!SUPPORTED_AI_PROVIDERS.includes(provider)) {
    throw new Error(
      `Unsupported provider '${provider}'. Supported providers: ${SUPPORTED_AI_PROVIDERS.join(", ")}`
    );
  }
}

function environmentVariableToCredentialKey(variableName) {
  switch (variableName) {
    case "CLOUDFLARE_ACCOUNT_ID":
      return "cloudflareAccountId";
    case "CLOUDFLARE_AI_TOKEN":
      return "cloudflareToken";
    case "OPENAI_API_KEY":
      return "openaiApiKey";
    case "GEMINI_API_KEY":
      return "geminiApiKey";
    default:
      return variableName;
  }
}

async function resolveProviderCredentials(provider) {
  const variableNames = REQUIRED_ENV_VARS_BY_PROVIDER[provider] ?? [];
  const credentials = {};
  const secrets = [];

  for (const variableName of variableNames) {
    const value = await getEnvironmentVariable(variableName);
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(
        `Missing required environment variable '${variableName}' for provider '${provider}'.`
      );
    }

    credentials[environmentVariableToCredentialKey(variableName)] = value;
    secrets.push(value);
  }

  return { credentials, secrets };
}

function relativeToRepository(filePath) {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = path.resolve(scriptDirectory, "..");
  return path.relative(repositoryRoot, filePath).replace(/\\/gu, "/");
}

function formatUsd(value) {
  return `$${value.toFixed(6)}`;
}

function extensionToMimeType(extension) {
  const normalized = String(extension).toLowerCase();
  if (normalized === "png") {
    return "image/png";
  }
  if (normalized === "jpg" || normalized === "jpeg") {
    return "image/jpeg";
  }
  if (normalized === "webp") {
    return "image/webp";
  }

  return "application/octet-stream";
}

function assertInstructionDoesNotContainKeepOutLine(instruction) {
  if (KEEP_OUT_LINE_PATTERN.test(instruction)) {
    throw new Error(
      "Edit instruction must not include a 'Keep out / keep vague:' line from the brief."
    );
  }
}

async function buildEditModePlan(options) {
  if (options.provider !== "gemini") {
    throw new Error("--edit-from is only supported with --provider gemini.");
  }
  if (options.variants !== 1) {
    throw new Error("--edit-from mode only supports --variants 1.");
  }

  const parsedParentCandidate = parseAiCandidateFileName(options.editFrom);
  if (!parsedParentCandidate) {
    throw new Error(
      "--edit-from must reference a candidate file named <prompt-id>-rN-vK.<png|jpg|webp>."
    );
  }
  if (parsedParentCandidate.promptId !== options.promptId) {
    throw new Error(
      `--edit-from prompt id '${parsedParentCandidate.promptId}' does not match positional prompt id '${options.promptId}'.`
    );
  }

  assertInstructionDoesNotContainKeepOutLine(options.instruction);

  let parentImageBuffer;
  try {
    parentImageBuffer = await fs.readFile(options.editFrom);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Edit source candidate not found: ${options.editFrom}`);
    }
    throw error;
  }

  return {
    promptText: options.instruction,
    promptFilePath: null,
    round: parsedParentCandidate.round + 1,
    variants: 1,
    parentCandidate: path.basename(options.editFrom),
    instructionText: options.instruction,
    editInput: {
      imageBuffer: parentImageBuffer,
      mimeType: extensionToMimeType(parsedParentCandidate.extension),
      instruction: options.instruction
    }
  };
}

async function buildNormalGenerationPlan(options) {
  const { promptText, promptFilePath } = await loadPromptTextForPromptId(options.promptId);
  return {
    promptText,
    promptFilePath,
    round: options.round,
    variants: options.variants,
    parentCandidate: undefined,
    instructionText: undefined,
    editInput: null
  };
}

function resolveGeminiTierOption(options) {
  if (!options.tier) {
    return DEFAULT_GEMINI_SERVICE_TIER;
  }
  if (options.tier !== GEMINI_SERVICE_TIERS.FLEX && options.tier !== GEMINI_SERVICE_TIERS.STANDARD) {
    throw new Error("--tier must be 'flex' or 'standard'.");
  }
  return options.tier;
}

export async function runGenerateAi(argv = process.argv.slice(2)) {
  const options = parseGenerateAiArguments(argv);
  ensureProvider(options.provider);
  const model = options.model ?? DEFAULT_AI_MODELS[options.provider];
  if (typeof model !== "string" || model.length === 0) {
    throw new Error(`No default model configured for provider '${options.provider}'.`);
  }

  if (options.tier && options.provider !== "gemini") {
    throw new Error("--tier is only supported with --provider gemini.");
  }

  const generationPlan = options.editFrom
    ? await buildEditModePlan(options)
    : await buildNormalGenerationPlan(options);

  const existingCandidates = await findExistingCandidateFiles({
    incomingDirectory: DEFAULT_AI_INCOMING_DIRECTORY,
    promptId: options.promptId,
    round: generationPlan.round,
    variants: generationPlan.variants
  });
  if (existingCandidates.length > 0) {
    throw new Error(
      `Round ${generationPlan.round} of ${options.promptId} already has candidates (${existingCandidates.join(", ")}); use another --round.`
    );
  }

  const { credentials, secrets } = await resolveProviderCredentials(options.provider);
  const writtenCandidates = [];
  const geminiTier = options.provider === "gemini" ? resolveGeminiTierOption(options) : undefined;
  let runningEstimatedCostUsd = 0;

  if (generationPlan.promptFilePath) {
    console.log(`Prompt file: ${relativeToRepository(generationPlan.promptFilePath)}`);
  } else {
    console.log(`Edit source: ${relativeToRepository(options.editFrom)}`);
  }
  console.log(`Provider: ${options.provider}`);
  console.log(`Model: ${model}`);
  console.log(`Variants: ${generationPlan.variants}`);
  console.log(`Round: ${generationPlan.round}`);
  if (geminiTier) {
    console.log(`Gemini tier: ${geminiTier}`);
  }

  try {
    for (let variant = 1; variant <= generationPlan.variants; variant += 1) {
      const seed =
        typeof options.seed === "number" ? options.seed + (variant - 1) : randomSeed();
      const response = await generateImageWithProvider({
        provider: options.provider,
        model,
        prompt: generationPlan.promptText,
        seed,
        tier: geminiTier,
        editInput: generationPlan.editInput,
        credentials,
        onGeminiRetry: ({ delayMs, serviceTier }) => {
          const seconds = Math.max(1, Math.round(delayMs / 1_000));
          if (serviceTier === GEMINI_SERVICE_TIERS.FLEX) {
            console.log(`Flex busy, retrying in ${seconds} s`);
          } else {
            console.log(`Gemini busy, retrying in ${seconds} s`);
          }
        }
      });

      const written = await writeAiCandidateAndSidecar({
        incomingDirectory: DEFAULT_AI_INCOMING_DIRECTORY,
        promptId: options.promptId,
        round: generationPlan.round,
        variant,
        imageBuffer: response.imageBuffer,
        provider: options.provider,
        model,
        seed,
        promptText: generationPlan.promptText,
        serviceTier: response.serviceTier,
        usageMetadata: response.usageMetadata,
        estimatedCostUsd: response.estimatedCostUsd,
        parentCandidate: generationPlan.parentCandidate,
        instructionText: generationPlan.instructionText
      });
      writtenCandidates.push(written);

      if (typeof response.estimatedCostUsd === "number") {
        runningEstimatedCostUsd += response.estimatedCostUsd;
        console.log(
          `Estimated cost: ${formatUsd(response.estimatedCostUsd)} (running total: ${formatUsd(
            runningEstimatedCostUsd
          )})`
        );
      }

      console.log(
        `Saved ${relativeToRepository(written.imagePath)} and ${relativeToRepository(
          written.sidecarPath
        )}`
      );
    }
  } catch (error) {
    // Keys may come from the Windows registry fallback rather than process.env, so redact
    // with the resolved values before the error reaches the top-level handler.
    throw redactErrorCauseChain(error, secrets);
  }

  return {
    promptId: options.promptId,
    provider: options.provider,
    model,
    promptFilePath: generationPlan.promptFilePath,
    writtenCandidates,
    estimatedCostUsd: Number(runningEstimatedCostUsd.toFixed(6))
  };
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  try {
    const result = await runGenerateAi(process.argv.slice(2));
    console.log(`Generated ${result.writtenCandidates.length} candidate image(s).`);
    if (result.estimatedCostUsd > 0) {
      console.log(`Estimated run total: ${formatUsd(result.estimatedCostUsd)}`);
    }
  } catch (error) {
    const message = redactSecrets(error instanceof Error ? error.message : String(error), [
      process.env.CLOUDFLARE_AI_TOKEN,
      process.env.OPENAI_API_KEY,
      process.env.GEMINI_API_KEY
    ]);
    console.error(`ERROR: ${message}`);
    process.exitCode = 1;
  }
}
