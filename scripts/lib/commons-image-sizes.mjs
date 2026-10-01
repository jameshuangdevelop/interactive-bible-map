const COMMONS_API_ENDPOINT = "https://commons.wikimedia.org/w/api.php";
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_MAX_CONCURRENCY = 2;
const DEFAULT_RETRY_DELAYS_MS = [0, 2000, 5000, 10000, 20000];
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

export const COMMONS_API_USER_AGENT =
  "InteractiveBibleMapCommonsImageSizes/1.0 (+https://github.com/jameshuangdevelop/interactive-bible-map; contact: repo issues)";

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function normalizeCommonsFileName(fileNameSegment) {
  try {
    return decodeURIComponent(fileNameSegment).replace(/ /gu, "_");
  } catch {
    return null;
  }
}

function normalizeCommonsTitleToFileName(title) {
  if (typeof title !== "string" || !title.startsWith("File:")) {
    return null;
  }

  return title.slice("File:".length).replace(/ /gu, "_");
}

function chunkArray(values, chunkSize) {
  const chunks = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

async function runWithConcurrency(items, maxConcurrency, worker) {
  const workerCount = Math.max(1, Math.min(maxConcurrency, items.length));
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

function isRetryableApiError(payload) {
  const code = String(payload?.error?.code ?? "").toLowerCase();
  if (!code) {
    return false;
  }

  return (
    code === "maxlag" ||
    code.includes("readonly") ||
    code.includes("timeout") ||
    code.includes("internal_api_error")
  );
}

function buildCommonsApiUrl(fileNames) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "imageinfo",
    iiprop: "size",
    titles: fileNames.map((fileName) => `File:${fileName}`).join("|")
  });
  return `${COMMONS_API_ENDPOINT}?${params.toString()}`;
}

async function fetchSizeBatchWithRetry(fileNames, { userAgent, retryDelaysMs }) {
  const requestUrl = buildCommonsApiUrl(fileNames);
  let lastError = null;

  for (let attemptIndex = 0; attemptIndex < retryDelaysMs.length; attemptIndex += 1) {
    if (attemptIndex > 0) {
      const waitMilliseconds = retryDelaysMs[attemptIndex];
      if (waitMilliseconds > 0) {
        await delay(waitMilliseconds);
      }
    }

    try {
      const response = await fetch(requestUrl, {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        lastError = new Error(
          `Commons API HTTP ${response.status} for batch: ${fileNames.join(", ")}`
        );
        if (RETRYABLE_STATUS_CODES.has(response.status)) {
          continue;
        }
        throw lastError;
      }

      const payload = await response.json();
      if (payload?.error) {
        lastError = new Error(
          `Commons API error '${payload.error.code}': ${payload.error.info ?? "no details"}`
        );
        if (isRetryableApiError(payload)) {
          continue;
        }
        throw lastError;
      }

      const pages = Array.isArray(payload?.query?.pages) ? payload.query.pages : [];
      const pageByFileName = new Map();

      for (const page of pages) {
        const fileName = normalizeCommonsTitleToFileName(page?.title);
        if (!fileName) {
          continue;
        }
        pageByFileName.set(fileName, page);
      }

      const sizeByFileName = new Map();
      for (const fileName of fileNames) {
        const page = pageByFileName.get(fileName);
        const imageInfo = Array.isArray(page?.imageinfo) ? page.imageinfo[0] : null;

        if (!page || page.missing || !imageInfo) {
          throw new Error(`Commons API returned no size metadata for File:${fileName}`);
        }

        const width = imageInfo.width;
        const height = imageInfo.height;
        if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
          throw new Error(`Commons API returned invalid size metadata for File:${fileName}`);
        }

        sizeByFileName.set(fileName, { width, height });
      }

      return sizeByFileName;
    } catch (error) {
      if (!(error instanceof Error)) {
        lastError = new Error(String(error));
      } else {
        lastError = error;
      }

      if (attemptIndex + 1 >= retryDelaysMs.length) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("Commons API request failed");
}

export function parseCommonsFileNameFromUploadUrl(url) {
  if (typeof url !== "string") {
    return null;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const match =
    /^\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/([^?#]+)$/iu.exec(parsedUrl.pathname);
  if (!match) {
    return null;
  }

  return normalizeCommonsFileName(match[1]);
}

export async function fetchCommonsImageSizes(fileNames, options = {}) {
  const uniqueFileNames = Array.from(
    new Set(
      fileNames.filter((fileName) => typeof fileName === "string" && fileName.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right));

  if (uniqueFileNames.length === 0) {
    return new Map();
  }

  const batchSize = Math.max(1, Math.min(DEFAULT_BATCH_SIZE, options.batchSize ?? DEFAULT_BATCH_SIZE));
  const maxConcurrency = Math.max(
    1,
    Math.min(DEFAULT_MAX_CONCURRENCY, options.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY)
  );
  const retryDelaysMs = Array.isArray(options.retryDelaysMs)
    ? options.retryDelaysMs.filter((value) => Number.isFinite(value) && value >= 0)
    : DEFAULT_RETRY_DELAYS_MS;
  const userAgent =
    typeof options.userAgent === "string" && options.userAgent.length > 0
      ? options.userAgent
      : COMMONS_API_USER_AGENT;

  const batches = chunkArray(uniqueFileNames, batchSize);
  const maps = await runWithConcurrency(batches, maxConcurrency, (batch) =>
    fetchSizeBatchWithRetry(batch, { userAgent, retryDelaysMs })
  );

  const sizeByFileName = new Map();
  for (const batchMap of maps) {
    for (const [fileName, size] of batchMap.entries()) {
      sizeByFileName.set(fileName, size);
    }
  }

  return sizeByFileName;
}
