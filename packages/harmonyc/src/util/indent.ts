export const Indent = (n: number) =>
  function* indent(lines: Iterable<string>) {
    for (const line of lines) {
      yield ' '.repeat(n) + line
    }
  }
