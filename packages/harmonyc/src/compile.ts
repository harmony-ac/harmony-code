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
  const outFile = new OutFile(outFn)
  const stepsFn = outFn.replace(/(\.(spec|test)s?)?\.[a-z]+$/i, '.steps.ts')
  const stepsFile = new OutFile(stepsFn)
  const cg = new NodeTest(outFile, stepsFile)
  feature.toCode(cg)
  return { outFile, stepsFile }
}
