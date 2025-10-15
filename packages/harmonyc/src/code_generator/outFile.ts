import { SourceNode } from 'source-map-js'
import { Location } from '../model/model.ts'

export class OutFile {
  lines: string[] = []
  level = 0
  sm
  indentSpaces: number = 2
  constructor(public name: string, public sourceFile: string) {
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

  clear() {
    this.sm = new SourceNode(0, 0, this.sourceFile)
  }

  append(s: string) {
    if (this.lines.length === 0) this.lines.push('')
    this.lines[this.lines.length - 1] += s
  }

  print(line: string, start?: Location, name?: string, end?: Location) {
    const chunk = ' '.repeat(this.level * this.indentSpaces) + line + '\n'
    this.lines.push(chunk)
    if (start) {
      this.sm.add(
        new SourceNode(
          start.line,
          start.column,
          this.sourceFile,
          chunk,
          name
        ) as any
      )
    } else {
      this.sm.add(
        new SourceNode(null as any, null as any, null as any, chunk) as any
      )
    }
    if (end) {
      this.sm.add(new SourceNode(end.line, end.column, this.sourceFile) as any)
    }
    return this
  }

  loc(location: Location | undefined, name?: string) {
    if (!location) return this
    return this
    this.sm.addMapping({
      source: this.sourceFile,
      original: location,
      generated: {
        line: this.lines.length || 1,
        column: this.lines.at(-1)?.length ?? 0,
      },
      name,
    })
    return this
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

  get currentLineEnd() {
    return {
      line: this.lines.length,
      column: this.lines.at(-1)?.length ?? 0,
    }
  }
  get currentLineStart() {
    return {
      line: this.lines.length + 1,
      column: this.lines.at(-1)?.match(/^\s*/)?.[0].length ?? 0,
    }
  }
}
