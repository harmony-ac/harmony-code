import { SourceNode } from 'source-map-js'
import { Location } from '../model/model.ts'

export class OutFile {
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

  print(line: string, start?: Location, name?: string, end?: Location) {
    const chunk = ' '.repeat(this.level * this.indentSpaces) + line + '\n'
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
