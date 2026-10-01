import { Agent } from "undici";

const CLOUDFLARE_IMAGE_WIDTH = 1536;
const CLOUDFLARE_IMAGE_HEIGHT = 864;
const OPENAI_IMAGE_SIZE = "1536x1024";
const GEMINI_IMAGE_ASPECT_RATIO = "16:9";
const GEMINI_IMAGE_SIZE = "2K";
const GEMINI_SERVER_TIMEOUT_SECONDS = 900;
const GEMINI_FETCH_TIMEOUT_MS = 16 * 60 * 1_000;
const GEMINI_RETRY_DELAYS_MS = [30_000, 60_000, 120_000, 240_000];
const GEMINI_RETRY_JITTER_MAX_MS = 2_000;

const CLOUDFLARE_TIMEOUT_STATUS = 408;
const CLOUDFLARE_DAILY_QUOTA_STATUS = 429;
const CLOUDFLARE_DAILY_QUOTA_CODE = 4006;
const CLOUDFLARE_TIMEOUT_RETRY_DELAYS_MS = [2_000, 5_000];
const GEMINI_RETRYABLE_STATUSES = new Set([429, 503]);

export const SUPPORTED_AI_PROVIDERS = Object.freeze([
  "cloudflare-flux",
  "cloudflare-lucid",
  "openai",
  "gemini"
]);

export const GEMINI_SERVICE_TIERS = Object.freeze({
  FLEX: "flex",
  STANDARD: "standard"
});

export const DEFAULT_GEMINI_SERVICE_TIER = GEMINI_SERVICE_TIERS.FLEX;

const GEMINI_IMAGE_PRICING = Object.freeze({
  [GEMINI_SERVICE_TIERS.FLEX]: Object.freeze({
    outputImageUsd: 0.067,
    outputTextAndThinkingPerMillionUsd: 6,
    inputTextPerMillionUsd: 1,
    inputImageUsd: 0.0006
  }),
  [GEMINI_SERVICE_TIERS.STANDARD]: Object.freeze({
    outputImageUsd: 0.134,
    outputTextAndThinkingPerMillionUsd: 12,
    inputTextPerMillionUsd: 2,
    inputImageUsd: 0.0012
  })
});

export const DEFAULT_AI_MODELS = Object.freeze({
  "cloudflare-flux": "@cf/black-forest-labs/flux-2-klein-4b",
  "cloudflare-lucid": "@cf/leonardo/lucid-origin",
  openai: "gpt-image-2.5-flare",
  gemini: "gemini-3-pro-image"
});

export const REQUIRED_ENV_VARS_BY_PROVIDER = Object.freeze({
  "cloudflare-flux": ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_AI_TOKEN"],
  "cloudflare-lucid": ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_AI_TOKEN"],
  openai: ["OPENAI_API_KEY"],
  gemini: ["GEMINI_API_KEY"]
});

let defaultGeminiDispatcher = null;

function getDefaultGeminiDispatcher() {
  if (!defaultGeminiDispatcher) {
    defaultGeminiDispatcher = new Agent({
      headersTimeout: GEMINI_FETCH_TIMEOUT_MS,
      bodyTimeout: GEMINI_FETCH_TIMEOUT_MS
    });
  }

  return defaultGeminiDispatcher;
}

export class AiProviderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "AiProviderError";
    this.provider = options.provider;
    this.status = options.status;
    this.code = options.code;
    this.cause = options.cause;
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function toErrorMessage(error) {
  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }

  return String(error);
}

function trimAndTruncate(value, maxLength = 400) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}...`;
}

export function redactSecrets(value, secrets = []) {
  let result = String(value ?? "");
  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length > 0) {
      result = result.split(secret).join("***");
    }
  }
  return result;
}

export function redactErrorCauseChain(error, secrets, seen = new Set()) {
  if (!error || (typeof error !== "object" && typeof error !== "function")) {
    return typeof error === "string" ? redactSecrets(error, secrets) : error;
  }

  if (seen.has(error)) {
    return error;
  }
  seen.add(error);

  if (typeof error.message === "string") {
    error.message = redactSecrets(error.message, secrets);
  }
  if (typeof error.stack === "string") {
    error.stack = redactSecrets(error.stack, secrets);
  }

  if ("cause" in error) {
    const redactedCause = redactErrorCauseChain(error.cause, secrets, seen);
    try {
      error.cause = redactedCause;
    } catch {
      // Keep the original cause when it is not writable.
    }
  }

  return error;
}

function parseJsonIfPossible(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function decodeBase64Image(base64Value, provider) {
  if (typeof base64Value !== "string" || base64Value.length === 0) {
    throw new AiProviderError(
      `Provider '${provider}' response did not include a base64 image payload.`,
      { provider }
    );
  }

  try {
    return Buffer.from(base64Value, "base64");
  } catch (error) {
    throw new AiProviderError(
      `Provider '${provider}' returned an invalid base64 image payload: ${toErrorMessage(error)}`,
      { provider, cause: error }
    );
  }
}

async function readResponseBody(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function cloudflareErrorCodeFromPayload(payload) {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];

  for (const errorEntry of errors) {
    const codeValue = errorEntry?.code;
    if (typeof codeValue === "number" && Number.isFinite(codeValue)) {
      return codeValue;
    }

    if (typeof codeValue === "string" && /^-?[0-9]+$/u.test(codeValue.trim())) {
      return Number.parseInt(codeValue.trim(), 10);
    }
  }

  return null;
}

function httpErrorMessage({ provider, status, statusText, payload, responseText }) {
  if (provider.startsWith("cloudflare")) {
    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      const firstError = payload.errors[0];
      const codePrefix =
        firstError?.code !== undefined ? `code ${firstError.code}: ` : "";
      const message = trimAndTruncate(firstError?.message);
      if (message.length > 0) {
        return `Cloudflare request failed (${status} ${statusText}): ${codePrefix}${message}`;
      }
    }
  } else if (provider === "openai") {
    const message = trimAndTruncate(payload?.error?.message);
    if (message.length > 0) {
      return `OpenAI request failed (${status} ${statusText}): ${message}`;
    }
  } else if (provider === "gemini") {
    const message = trimAndTruncate(payload?.error?.message);
    if (message.length > 0) {
      return `Gemini request failed (${status} ${statusText}): ${message}`;
    }
  }

  const fallback = trimAndTruncate(responseText);
  if (fallback.length > 0) {
    return `Provider '${provider}' request failed (${status} ${statusText}): ${fallback}`;
  }

  return `Provider '${provider}' request failed (${status} ${statusText}).`;
}

function ensureFunction(value, name) {
  if (typeof value !== "function") {
    throw new Error(`${name} must be a function.`);
  }
}

function ensureNonNegativeNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  return fallback;
}

function normalizeGeminiServiceTierValue(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === GEMINI_SERVICE_TIERS.FLEX || normalized === GEMINI_SERVICE_TIERS.STANDARD) {
    return normalized;
  }

  return null;
}

function resolveGeminiServiceTier(value) {
  const normalized = normalizeGeminiServiceTierValue(value);
  if (normalized) {
    return normalized;
  }

  if (value === undefined || value === null) {
    return DEFAULT_GEMINI_SERVICE_TIER;
  }

  throw new AiProviderError(
    `Unsupported Gemini service tier '${value}'. Use '${GEMINI_SERVICE_TIERS.FLEX}' or '${GEMINI_SERVICE_TIERS.STANDARD}'.`,
    { provider: "gemini" }
  );
}

function normalizeModality(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toUpperCase();
}

function countModalityEntries(details, modalityName) {
  if (!Array.isArray(details)) {
    return 0;
  }

  let count = 0;
  for (const detail of details) {
    const modality = normalizeModality(detail?.modality);
    const tokenCount = ensureNonNegativeNumber(detail?.tokenCount, 0);
    if (modality === modalityName && tokenCount > 0) {
      count += 1;
    }
  }
  return count;
}

export function estimateGeminiCostUsd({
  serviceTier = DEFAULT_GEMINI_SERVICE_TIER,
  usageMetadata,
  inputImageCount = 0,
  outputImageCount = 1
} = {}) {
  const resolvedTier = resolveGeminiServiceTier(serviceTier);
  const pricing = GEMINI_IMAGE_PRICING[resolvedTier];
  const metadata = usageMetadata && typeof usageMetadata === "object" ? usageMetadata : {};

  const inputTextTokens = ensureNonNegativeNumber(metadata.promptTokenCount, 0);
  const outputTextAndThinkingTokens =
    ensureNonNegativeNumber(metadata.candidatesTokenCount, 0) +
    ensureNonNegativeNumber(metadata.thoughtsTokenCount, 0);

  const inputImageEntriesFromMetadata = countModalityEntries(
    metadata.promptTokensDetails,
    "IMAGE"
  );
  const outputImageEntriesFromMetadata = countModalityEntries(
    metadata.candidatesTokensDetails,
    "IMAGE"
  );

  const resolvedInputImageCount = Math.max(
    inputImageEntriesFromMetadata,
    ensureNonNegativeNumber(inputImageCount, 0)
  );
  const resolvedOutputImageCount = Math.max(
    outputImageEntriesFromMetadata,
    ensureNonNegativeNumber(outputImageCount, 1)
  );

  const totalUsd =
    (inputTextTokens / 1_000_000) * pricing.inputTextPerMillionUsd +
    (outputTextAndThinkingTokens / 1_000_000) * pricing.outputTextAndThinkingPerMillionUsd +
    resolvedInputImageCount * pricing.inputImageUsd +
    resolvedOutputImageCount * pricing.outputImageUsd;

  return Number(totalUsd.toFixed(6));
}

async function fetchCloudflareImage({
  provider,
  model,
  prompt,
  seed,
  cloudflareAccountId,
  cloudflareToken,
  fetchImpl,
  sleepImpl
}) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
    cloudflareAccountId
  )}/ai/run/${model}`;

  for (let attempt = 0; attempt <= CLOUDFLARE_TIMEOUT_RETRY_DELAYS_MS.length; attempt += 1) {
    let requestBody;
    let headers = {
      Authorization: `Bearer ${cloudflareToken}`
    };

    if (provider === "cloudflare-flux") {
      // Live call on 2026-10-01 confirmed multipart field names prompt/width/height/seed; Cloudflare's public schema documents only the multipart wrapper.
      requestBody = new FormData();
      requestBody.append("prompt", prompt);
      requestBody.append("width", String(CLOUDFLARE_IMAGE_WIDTH));
      requestBody.append("height", String(CLOUDFLARE_IMAGE_HEIGHT));
      requestBody.append("seed", String(seed));
    } else {
      headers = {
        ...headers,
        "Content-Type": "application/json"
      };
      requestBody = JSON.stringify({
        prompt,
        width: CLOUDFLARE_IMAGE_WIDTH,
        height: CLOUDFLARE_IMAGE_HEIGHT,
        num_steps: 30,
        seed
      });
    }

    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers,
        body: requestBody
      });
    } catch (error) {
      throw new AiProviderError(
        `Cloudflare request failed before receiving a response: ${toErrorMessage(error)}`,
        { provider, cause: error }
      );
    }

    const responseText = await readResponseBody(response);
    const payload = parseJsonIfPossible(responseText);

    if (
      response.status === CLOUDFLARE_DAILY_QUOTA_STATUS &&
      cloudflareErrorCodeFromPayload(payload) === CLOUDFLARE_DAILY_QUOTA_CODE
    ) {
      throw new AiProviderError(
        "Cloudflare Workers AI free daily allocation is exhausted (HTTP 429, code 4006). Stop and try another provider or wait for quota reset.",
        {
          provider,
          status: response.status,
          code: CLOUDFLARE_DAILY_QUOTA_CODE
        }
      );
    }

    if (
      response.status === CLOUDFLARE_TIMEOUT_STATUS &&
      attempt < CLOUDFLARE_TIMEOUT_RETRY_DELAYS_MS.length
    ) {
      await sleepImpl(CLOUDFLARE_TIMEOUT_RETRY_DELAYS_MS[attempt]);
      continue;
    }

    if (!response.ok) {
      throw new AiProviderError(
        httpErrorMessage({
          provider,
          status: response.status,
          statusText: response.statusText,
          payload,
          responseText
        }),
        {
          provider,
          status: response.status
        }
      );
    }

    const imageBase64 = payload?.result?.image;
    return {
      imageBuffer: decodeBase64Image(imageBase64, provider),
      mimeType: "image/jpeg"
    };
  }

  throw new AiProviderError(
    "Cloudflare request timed out after retries (HTTP 408).",
    {
      provider,
      status: CLOUDFLARE_TIMEOUT_STATUS
    }
  );
}

async function fetchOpenAiImage({
  model,
  prompt,
  openaiApiKey,
  fetchImpl
}) {
  let response;
  try {
    response = await fetchImpl("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: OPENAI_IMAGE_SIZE,
        quality: "high"
      })
    });
  } catch (error) {
    throw new AiProviderError(
      `OpenAI request failed before receiving a response: ${toErrorMessage(error)}`,
      { provider: "openai", cause: error }
    );
  }

  const responseText = await readResponseBody(response);
  const payload = parseJsonIfPossible(responseText);

  if (!response.ok) {
    throw new AiProviderError(
      httpErrorMessage({
        provider: "openai",
        status: response.status,
        statusText: response.statusText,
        payload,
        responseText
      }),
      {
        provider: "openai",
        status: response.status
      }
    );
  }

  const imageBase64 = payload?.data?.[0]?.b64_json;
  return {
    imageBuffer: decodeBase64Image(imageBase64, "openai"),
    mimeType: "image/png"
  };
}

function encodePathSegments(pathValue) {
  return pathValue
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function normalizeGeminiEditInput(editInput) {
  if (!editInput) {
    return null;
  }
  if (!Buffer.isBuffer(editInput.imageBuffer) || editInput.imageBuffer.length === 0) {
    throw new AiProviderError("Gemini edit input must include a non-empty image buffer.", {
      provider: "gemini"
    });
  }
  if (typeof editInput.instruction !== "string" || editInput.instruction.trim().length === 0) {
    throw new AiProviderError("Gemini edit input must include a non-empty instruction.", {
      provider: "gemini"
    });
  }
  if (typeof editInput.mimeType === "string" && editInput.mimeType.trim().length > 0) {
    return {
      ...editInput,
      mimeType: editInput.mimeType
    };
  }
  return {
    ...editInput,
    mimeType: "image/png"
  };
}

function buildGeminiUserParts({ prompt, editInput }) {
  if (editInput) {
    return [
      {
        inlineData: {
          mimeType: editInput.mimeType,
          data: editInput.imageBuffer.toString("base64")
        }
      },
      {
        text: editInput.instruction
      }
    ];
  }

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new AiProviderError("Gemini prompt text is required for non-edit generation.", {
      provider: "gemini"
    });
  }

  return [{ text: prompt }];
}

function computeGeminiRetryDelay(baseDelayMs, randomImpl) {
  const randomValue = Number(randomImpl());
  const normalizedRandom =
    Number.isFinite(randomValue) && randomValue >= 0
      ? Math.min(randomValue, 1)
      : 0;
  const jitterMs = Math.floor(normalizedRandom * GEMINI_RETRY_JITTER_MAX_MS);
  return baseDelayMs + jitterMs;
}

async function fetchGeminiImage({
  model,
  prompt,
  seed,
  geminiApiKey,
  serviceTier,
  editInput,
  fetchImpl,
  sleepImpl,
  randomImpl,
  geminiDispatcher,
  onRetry
}) {
  const modelPath = model.startsWith("models/") ? model : `models/${model}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${encodePathSegments(
    modelPath
  )}:generateContent`;

  const normalizedEditInput = normalizeGeminiEditInput(editInput);
  const userParts = buildGeminiUserParts({
    prompt,
    editInput: normalizedEditInput
  });

  const requestPayload = {
    contents: [
      {
        role: "user",
        parts: userParts
      }
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: GEMINI_IMAGE_ASPECT_RATIO,
        imageSize: GEMINI_IMAGE_SIZE
      },
      seed
    },
    service_tier: serviceTier
  };

  const dispatcher = geminiDispatcher ?? getDefaultGeminiDispatcher();
  const maxAttempts = GEMINI_RETRY_DELAYS_MS.length + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "x-goog-api-key": geminiApiKey,
          "Content-Type": "application/json",
          "X-Server-Timeout": String(GEMINI_SERVER_TIMEOUT_SECONDS)
        },
        body: JSON.stringify(requestPayload),
        dispatcher
      });
    } catch (error) {
      throw new AiProviderError(
        `Gemini request failed before receiving a response: ${toErrorMessage(error)}`,
        { provider: "gemini", cause: error }
      );
    }

    const responseText = await readResponseBody(response);
    const payload = parseJsonIfPossible(responseText);

    if (response.ok) {
      const imagePart = payload?.candidates?.[0]?.content?.parts?.find(
        (part) => typeof part?.inlineData?.data === "string"
      );

      if (!imagePart) {
        throw new AiProviderError(
          "Gemini response did not include an inlineData image payload.",
          { provider: "gemini" }
        );
      }

      const serviceTierFromResponse = normalizeGeminiServiceTierValue(
        response.headers.get("x-gemini-service-tier")
      );
      const effectiveServiceTier = serviceTierFromResponse ?? serviceTier;
      const usageMetadata =
        payload?.usageMetadata && typeof payload.usageMetadata === "object"
          ? payload.usageMetadata
          : null;

      return {
        imageBuffer: decodeBase64Image(imagePart.inlineData.data, "gemini"),
        mimeType:
          typeof imagePart.inlineData.mimeType === "string"
            ? imagePart.inlineData.mimeType
            : "image/png",
        serviceTier: effectiveServiceTier,
        usageMetadata,
        estimatedCostUsd: estimateGeminiCostUsd({
          serviceTier: effectiveServiceTier,
          usageMetadata,
          inputImageCount: normalizedEditInput ? 1 : 0,
          outputImageCount: 1
        })
      };
    }

    const isRetryableStatus = GEMINI_RETRYABLE_STATUSES.has(response.status);
    if (isRetryableStatus && attempt < maxAttempts) {
      const baseDelayMs = GEMINI_RETRY_DELAYS_MS[attempt - 1];
      const retryDelayMs = computeGeminiRetryDelay(baseDelayMs, randomImpl);
      if (typeof onRetry === "function") {
        onRetry({
          attempt,
          maxAttempts,
          delayMs: retryDelayMs,
          status: response.status,
          serviceTier
        });
      }
      await sleepImpl(retryDelayMs);
      continue;
    }

    if (isRetryableStatus && attempt >= maxAttempts) {
      throw new AiProviderError(
        `Gemini ${serviceTier} tier remained busy after ${maxAttempts} attempts (last status ${response.status}).`,
        {
          provider: "gemini",
          status: response.status
        }
      );
    }

    throw new AiProviderError(
      httpErrorMessage({
        provider: "gemini",
        status: response.status,
        statusText: response.statusText,
        payload,
        responseText
      }),
      {
        provider: "gemini",
        status: response.status
      }
    );
  }

  throw new AiProviderError("Gemini request failed without producing a response.", {
    provider: "gemini"
  });
}

function assertSupportedProvider(provider) {
  if (!SUPPORTED_AI_PROVIDERS.includes(provider)) {
    throw new AiProviderError(
      `Unsupported provider '${provider}'. Supported providers: ${SUPPORTED_AI_PROVIDERS.join(", ")}`,
      { provider }
    );
  }
}

function requireCredential(provider, value, variableName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AiProviderError(
      `Missing required environment variable '${variableName}' for provider '${provider}'.`,
      { provider }
    );
  }
}

export async function generateImageWithProvider(options) {
  const {
    provider,
    model,
    prompt,
    seed,
    tier,
    editInput,
    credentials = {},
    fetchImpl = globalThis.fetch,
    sleepImpl = delay,
    randomImpl = Math.random,
    geminiDispatcher,
    onGeminiRetry
  } = options ?? {};

  assertSupportedProvider(provider);
  ensureFunction(fetchImpl, "fetchImpl");
  ensureFunction(sleepImpl, "sleepImpl");
  ensureFunction(randomImpl, "randomImpl");

  const secrets = [
    credentials.cloudflareToken,
    credentials.openaiApiKey,
    credentials.geminiApiKey
  ].filter((value) => typeof value === "string" && value.length > 0);

  try {
    if (provider === "cloudflare-flux" || provider === "cloudflare-lucid") {
      requireCredential(provider, credentials.cloudflareAccountId, "CLOUDFLARE_ACCOUNT_ID");
      requireCredential(provider, credentials.cloudflareToken, "CLOUDFLARE_AI_TOKEN");
      return await fetchCloudflareImage({
        provider,
        model,
        prompt,
        seed,
        cloudflareAccountId: credentials.cloudflareAccountId,
        cloudflareToken: credentials.cloudflareToken,
        fetchImpl,
        sleepImpl
      });
    }

    if (provider === "openai") {
      requireCredential(provider, credentials.openaiApiKey, "OPENAI_API_KEY");
      return await fetchOpenAiImage({
        model,
        prompt,
        openaiApiKey: credentials.openaiApiKey,
        fetchImpl
      });
    }

    requireCredential(provider, credentials.geminiApiKey, "GEMINI_API_KEY");
    return await fetchGeminiImage({
      model,
      prompt,
      seed,
      geminiApiKey: credentials.geminiApiKey,
      serviceTier: resolveGeminiServiceTier(tier),
      editInput,
      fetchImpl,
      sleepImpl,
      randomImpl,
      geminiDispatcher,
      onRetry: onGeminiRetry
    });
  } catch (error) {
    if (error instanceof AiProviderError) {
      redactErrorCauseChain(error, secrets);
      throw error;
    }

    redactErrorCauseChain(error, secrets);
    const wrappedError = new AiProviderError(
      redactSecrets(toErrorMessage(error), secrets),
      { provider, cause: error }
    );
    redactErrorCauseChain(wrappedError, secrets);
    throw wrappedError;
  }
}
