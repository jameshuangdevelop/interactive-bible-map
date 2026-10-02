import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_AI_MEDIA_DIRECTORY,
  parsePublishAiArguments,
  publishAiCandidate
} from "./lib/ai-reconstructions.mjs";

function relativeToRepository(filePath) {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = path.resolve(scriptDirectory, "..");
  return path.relative(repositoryRoot, filePath).replace(/\\/gu, "/");
}

export async function runPublishAi(argv = process.argv.slice(2)) {
  const options = parsePublishAiArguments(argv);
  const result = await publishAiCandidate({
    candidatePath: options.candidatePath,
    promptId: options.promptId,
    outputDirectory: DEFAULT_AI_MEDIA_DIRECTORY,
    trimBars: options.trimBars
  });

  console.log(`Published ${relativeToRepository(result.outputPath)}`);
  console.log(
    `Final image: ${result.output.width}x${result.output.height}, ${result.output.bytes} bytes (quality ${result.output.quality})`
  );
  console.log(
    `Trimmed edges: top=${result.trim.top}px, bottom=${result.trim.bottom}px, left=${result.trim.left}px, right=${result.trim.right}px`
  );
  console.log(
    `Generator (for media entry): tool='${result.mediaEntryGenerator.tool}', model='${result.mediaEntryGenerator.model}', date='${result.mediaEntryGenerator.date}'`
  );
  console.log(
    `Source side-car: provider='${result.sidecarData.provider}', model='${result.sidecarData.model}', date='${result.sidecarData.date}', seed=${result.sidecarData.seed}, round=${result.sidecarData.round}, promptId='${result.sidecarData.promptId}'`
  );

  return result;
}

try {
  await runPublishAi(process.argv.slice(2));
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
