import { NodeTest } from './languages/JavaScript.js'
import { OutFile } from './outFile.js'
import { parse } from './syntax.js'

export interface CompiledFeature {
  name: string
  code: Record<string, string>
}

export function compileFeature(fileName: string, src: string) {
  const feature = parse({ fileName, src })
  const outFn = `${fileName.replace(/\.[a-z]+$/i, '')}.mjs`
  const of = new OutFile(outFn)
  const cg = new NodeTest(of)
  feature.toCode(cg)
  return of
}
