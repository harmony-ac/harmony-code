import { SourceNode } from 'source-map-js'
import { Location } from '../model/model.ts'

export class OutFile {
  level = 0
  sm
  indentSpaces: number = 2
  constructor(
    public name: string,
    public sourceFile: string,
  ) {
    this.sm = new SourceNode(0, 0, sourceFile)
  }

  indent(fn: () => void) {
    this.level++
    try {
      fn()
    } finally {
      this.level--
    }
  }

  private get currentIndent() {
    return ' '.repeat(this.level * this.indentSpaces)
  }

  clear() {
    this.sm = new SourceNode(0, 0, this.sourceFile)
  }

  printn(line: string, start?: Location, name?: string, end?: Location) {
    this.write(this.currentIndent + line, start, name, end)
  }
  print(line: string, start?: Location, name?: string, end?: Location) {
    this.write(this.currentIndent + line + '\n', start, name, end)
  }

  write(line: string, start?: Location, name?: string, end?: Location) {
    const chunk = line
    if (start) {
      this.sm.add(
        new SourceNode(
          start.line + 1, // SourceNode lines are 1-based
          start.column, // SourceNode columns are 0-based
          this.sourceFile,
          chunk,
          name,
        ) as any,
      )
    } else {
      this.sm.add(
        new SourceNode(null as any, null as any, null as any, chunk) as any,
      )
    }
    if (end) {
      this.sm.add(
        new SourceNode(end.line + 1, end.column, this.sourceFile) as any,
      )
    }
  }

  nl() {
    this.write('\n')
  }

  get sourceMap() {
    return this.sm.toStringWithSourceMap({ file: this.name }).map.toJSON()
  }

  get valueWithoutSourceMap() {
    return this.sm.toString()
  }

  get value() {
    const { code, map } = this.sm.toStringWithSourceMap({ file: this.name })
    let res = code
    res +=
      `\n//# sour` + // not for this file ;)
      `ceMappingURL=data:application/json,${encodeURIComponent(map.toString())}`
    return res
  }
}
