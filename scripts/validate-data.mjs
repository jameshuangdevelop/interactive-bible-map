import { validateData } from "./lib/validator.mjs";

const result = await validateData();

for (const warning of result.warnings) {
  console.warn(`WARNING ${warning.file} ${warning.path}: ${warning.message}`);
}

if (result.errors.length > 0) {
  for (const error of result.errors) {
    console.error(`ERROR ${error.file} ${error.path}: ${error.message}`);
  }

  console.error(
    `Validation failed with ${result.errors.length} error(s) and ${result.warnings.length} warning(s).`
  );
  process.exitCode = 1;
} else {
  console.log(
    `Validation passed with ${result.warnings.length} warning(s).`
  );
}
