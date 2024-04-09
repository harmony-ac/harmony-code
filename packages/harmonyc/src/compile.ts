import { Gherkin } from './frameworks/Gherkin'
import { NodeTest } from './frameworks/NodeTest'
import { CodeGenerator, Feature, makeTests } from './model'
import { OutFile } from './outFile'
import { parseMarkdown } from './syntax'

export interface CompiledFeature {
  name: string
  code: Record<string, string>
}

export function compileFeature(fileName: string, src: string) {
  const { root, name } = parseMarkdown({ fileName, src })
  const feature = new Feature(name)
  root.setFeature(feature)
  const tests = makeTests(root)
  const of = new OutFile()
  const cg = new NodeTest(of)
  cg.feature(name, tests)
  return of.value
}
