import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_AI_MODELS,
  REQUIRED_ENV_VARS_BY_PROVIDER,
  SUPPORTED_AI_PROVIDERS,
  generateImageWithProvider,
  redactSecrets
} from "./lib/ai-providers.mjs";
import {
  DEFAULT_AI_INCOMING_DIRECTORY,
  getEnvironmentVariable,
  loadPromptTextForPromptId,
  parseGenerateAiArguments,
  writeAiCandidateAndSidecar
} from "./lib/ai-reconstructions.mjs";

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

export async function runGenerateAi(argv = process.argv.slice(2)) {
  const options = parseGenerateAiArguments(argv);
  ensureProvider(options.provider);
  const model = options.model ?? DEFAULT_AI_MODELS[options.provider];
  if (typeof model !== "string" || model.length === 0) {
    throw new Error(`No default model configured for provider '${options.provider}'.`);
  }

  const { promptText, promptFilePath } = await loadPromptTextForPromptId(options.promptId);
  const { credentials } = await resolveProviderCredentials(options.provider);
  const writtenCandidates = [];

  console.log(`Prompt file: ${relativeToRepository(promptFilePath)}`);
  console.log(`Provider: ${options.provider}`);
  console.log(`Model: ${model}`);
  console.log(`Variants: ${options.variants}`);
  console.log(`Round: ${options.round}`);

  for (let variant = 1; variant <= options.variants; variant += 1) {
    const seed =
      typeof options.seed === "number" ? options.seed + (variant - 1) : randomSeed();
    const response = await generateImageWithProvider({
      provider: options.provider,
      model,
      prompt: promptText,
      seed,
      credentials
    });

    const written = await writeAiCandidateAndSidecar({
      incomingDirectory: DEFAULT_AI_INCOMING_DIRECTORY,
      promptId: options.promptId,
      round: options.round,
      variant,
      imageBuffer: response.imageBuffer,
      provider: options.provider,
      model,
      seed,
      promptText
    });
    writtenCandidates.push(written);

    console.log(
      `Saved ${relativeToRepository(written.imagePath)} and ${relativeToRepository(
        written.sidecarPath
      )}`
    );
  }

  return {
    promptId: options.promptId,
    provider: options.provider,
    model,
    promptFilePath,
    writtenCandidates
  };
}

try {
  const result = await runGenerateAi(process.argv.slice(2));
  console.log(`Generated ${result.writtenCandidates.length} candidate image(s).`);
} catch (error) {
  const message = redactSecrets(error instanceof Error ? error.message : String(error), [
    process.env.CLOUDFLARE_AI_TOKEN,
    process.env.OPENAI_API_KEY,
    process.env.GEMINI_API_KEY
  ]);
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}
