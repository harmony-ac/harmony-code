export class OutFile {
  lines: string[] = []
  level = 0
  constructor(private indentSpaces: number = 2) {}

  indent(fn: () => void) {
    this.level++
    try {
      fn()
    } finally {
      this.level--
    }
  }

  print(...lines: string[]) {
    this.lines.push(
      ...lines.map((line) => ' '.repeat(this.level * this.indentSpaces) + line)
    )
  }

  get value() {
    return this.lines.join('\n')
  }
}
