import { buildAppData } from "./lib/app-data-builder.mjs";

try {
  const result = await buildAppData();

  for (const warning of result.validationResult.warnings) {
    console.warn(`WARNING ${warning.file} ${warning.path}: ${warning.message}`);
  }

  console.log(
    `Built app data for ${result.locationCount} place(s) into app/public/generated (${result.indexBytes} bytes for places.index.json).`
  );
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
