import { existsSync } from 'node:fs'
import { NodeTest } from './languages/JavaScript.js'
import { OutFile } from './outFile.js'
import { parse } from './syntax.js'
import { stepsFileName, testFileName } from './filenames/filenames.js'

export interface CompiledFeature {
  name: string
  code: Record<string, string>
}

export function compileFeature(fileName: string, src: string) {
  const feature = parse({ fileName, src })
  const outFn = testFileName(fileName)
  const outFile = new OutFile(outFn)
  const stepsFn = stepsFileName(fileName)
  const stepsFile = new OutFile(stepsFn)
  const cg = new NodeTest(outFile, stepsFile)
  feature.toCode(cg)
  return { outFile, stepsFile }
}
