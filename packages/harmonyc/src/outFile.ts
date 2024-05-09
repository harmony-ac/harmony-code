import { Location } from './model.js'
import { SourceMapGenerator } from 'source-map-js'

export class OutFile {
  lines: string[] = []
  level = 0
  sm = new SourceMapGenerator()
  indentSpaces: number = 2
  private currentLoc: Location | undefined
  constructor(public name: string) {}

  indent(fn: () => void) {
    this.level++
    try {
      fn()
    } finally {
      this.level--
    }
  }

  print(...lines: string[]) {
    const l = this.lines.length
    this.lines.push(
      ...lines.map((line) => ' '.repeat(this.level * this.indentSpaces) + line)
    )
    if (this.currentLoc)
      for (const i of lines.keys()) {
        this.sm.addMapping({
          source: this.currentLoc.fileName,
          original: {
            line: this.currentLoc.line,
            column: this.currentLoc.column,
          },
          generated: {
            line: l + i,
            column: this.level * this.indentSpaces,
          },
        })
      }
    return this
  }

  loc({ location }: { location?: Location }) {
    this.currentLoc = location
    return this
  }

  get value() {
    let res = this.lines.join('\n')
    if (this.currentLoc) {
      res += `\n\n//# sourceMappingURL=data:application/json,${encodeURIComponent(
        this.sm.toString()
      )}`
    }
    return res
  }
}
