import { buildAppData } from "./lib/app-data-builder.mjs";

function parseArguments(argv) {
  const argumentsObject = {
    ancientSourceDirectory: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--ancient-source") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("--ancient-source requires a directory path value");
      }
      argumentsObject.ancientSourceDirectory = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("--ancient-source=")) {
      const value = argument.slice("--ancient-source=".length).trim();
      if (!value) {
        throw new Error("--ancient-source requires a directory path value");
      }
      argumentsObject.ancientSourceDirectory = value;
      continue;
    }

    throw new Error(`Unknown argument '${argument}'`);
  }

  return argumentsObject;
}

try {
  const options = parseArguments(process.argv.slice(2));
  const result = await buildAppData({
    ancientSourceDirectory: options.ancientSourceDirectory
  });

  for (const warning of result.validationResult.warnings) {
    console.warn(`WARNING ${warning.file} ${warning.path}: ${warning.message}`);
  }

  console.log(`Built app data for ${result.locationCount} place(s) into app/public/generated.`);
  for (const outputFile of result.outputFiles) {
    console.log(
      `  ${outputFile.file}: ${outputFile.bytes} bytes (${outputFile.gzipBytes} bytes gzip)`
    );
  }
  const totalBytes = result.outputFiles.reduce((sum, file) => sum + file.bytes, 0);
  const totalGzipBytes = result.outputFiles.reduce(
    (sum, file) => sum + file.gzipBytes,
    0
  );
  console.log(
    `Total generated size: ${totalBytes} bytes (${totalGzipBytes} bytes gzip)`
  );

  if (!result.ancientBuild.generated && result.ancientBuild.skippedReason) {
    console.log(result.ancientBuild.skippedReason);
  }
} catch (error) {
  if (error.validationResult) {
    for (const warning of error.validationResult.warnings) {
      console.warn(`WARNING ${warning.file} ${warning.path}: ${warning.message}`);
    }

    for (const validationError of error.validationResult.errors) {
      console.error(
        `ERROR ${validationError.file} ${validationError.path}: ${validationError.message}`
      );
    }
  }

  console.error(error.message);
  process.exitCode = 1;
}
