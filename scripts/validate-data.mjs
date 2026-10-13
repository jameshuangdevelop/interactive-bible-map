import { validateData } from "./lib/validator.mjs";

// Timeline research landed in M4-02 (data/timeline.json plus politicalAreaId
// links on location records), so the project's own validate:data run enforces
// the derived/stored politicalHistory match. The library default stays off so
// callers (including tests) that don't set up matching timeline fixtures are
// unaffected.
const result = await validateData({ requireDerivedPoliticalHistory: true });

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
