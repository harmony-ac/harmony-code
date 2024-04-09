import { NodeTest } from './frameworks/NodeTest'
import { Feature, makeTests } from './model'
import { OutFile } from './outFile'
import { parse } from './syntax'

export interface CompiledFeature {
  name: string
  code: Record<string, string>
}

export function compileFeature(fileName: string, src: string) {
  const feature = parse({ fileName, src })
  const of = new OutFile()
  const cg = new NodeTest(of)
  feature.toCode(cg)
  return of.value
}
