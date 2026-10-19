import { defineConfig } from "@playwright/test";

const isCi = process.env.CI === "true";
const isFullSuite = process.env.FULL_SUITE === "1";

export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: true,
  timeout: 60_000,
  globalTimeout: isCi ? 10 * 60_000 : undefined,
  retries: isCi ? 2 : 0,
  maxFailures: isCi ? 5 : 0,
  workers: isCi ? 2 : 1,
  grepInvert: isFullSuite ? undefined : /@network|@gpu|@quarantine/,
  reporter: isCi ? [["blob"], ["github"], ["list"]] : [["list"]],
  expect: {
    timeout: 10_000
  },
  use: {
    trace: "on-first-retry"
  }
});
