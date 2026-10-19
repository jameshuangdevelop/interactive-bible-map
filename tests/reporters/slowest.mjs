import { Transform } from "node:stream";

const SLOWEST_LIMIT = 10;

export default class SlowestReporter extends Transform {
  constructor() {
    super({ writableObjectMode: true });
    this.results = [];
    this.passCount = 0;
    this.failures = [];
  }

  _transform(event, _encoding, callback) {
    if (event.type === "test:pass") {
      this.passCount += 1;
    }
    if (event.type === "test:pass" || event.type === "test:fail") {
      const durationMs = event.data?.details?.duration_ms;
      if (typeof durationMs === "number") {
        this.results.push({
          name: event.data.name,
          file: event.data.file,
          durationMs
        });
      }
    }
    if (event.type === "test:fail") {
      const failureMessage =
        event.data?.details?.error?.message ??
        event.data?.details?.error?.cause?.message ??
        "Unknown test failure";
      this.failures.push({
        name: event.data.name,
        file: event.data.file,
        message: failureMessage
      });
    }
    callback();
  }

  _flush(callback) {
    if (this.results.length === 0) {
      callback();
      return;
    }

    const slowest = [...this.results]
      .sort((left, right) => right.durationMs - left.durationMs)
      .slice(0, SLOWEST_LIMIT);

    const lines = [
      "",
      `Test summary: ${this.passCount} passed, ${this.failures.length} failed.`,
      "",
      `Slowest ${slowest.length} test(s):`
    ];
    slowest.forEach((entry, index) => {
      const filePrefix = typeof entry.file === "string" ? `${entry.file}: ` : "";
      lines.push(
        `${String(index + 1).padStart(2, "0")}. ${entry.durationMs.toFixed(1)} ms — ${filePrefix}${entry.name}`
      );
    });

    if (this.failures.length > 0) {
      lines.push("", "Failed test(s):");
      this.failures.forEach((entry, index) => {
        const filePrefix = typeof entry.file === "string" ? `${entry.file}: ` : "";
        lines.push(`${index + 1}. ${filePrefix}${entry.name}`);
        lines.push(`   ${entry.message}`);
      });
    }
    lines.push("");
    this.push(`${lines.join("\n")}\n`);
    callback();
  }
}
