function findCliArgument(argv, argumentName) {
  const optionName = `--${argumentName}`;
  const inlinePrefix = `${optionName}=`;

  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];
    if (entry === optionName) {
      return {
        optionName,
        value: argv[index + 1] ?? null,
        valueFromSeparateArgument: true
      };
    }

    if (entry.startsWith(inlinePrefix)) {
      return {
        optionName,
        value: entry.slice(inlinePrefix.length),
        valueFromSeparateArgument: false
      };
    }
  }

  return null;
}

export function readCliArgument(argv, argumentName) {
  const argument = findCliArgument(argv, argumentName);
  if (!argument) {
    return null;
  }

  return argument.value;
}

export function readChangedSinceRef(argv = process.argv.slice(2)) {
  const argument = findCliArgument(argv, "changed-since");
  if (!argument) {
    return null;
  }

  if (
    argument.value === null ||
    (argument.valueFromSeparateArgument &&
      typeof argument.value === "string" &&
      argument.value.startsWith("--"))
  ) {
    throw new Error("Option --changed-since requires a git ref value.");
  }

  const changedSinceRef = argument.value.trim();
  if (!changedSinceRef) {
    throw new Error("Option --changed-since requires a git ref value.");
  }

  return changedSinceRef;
}
