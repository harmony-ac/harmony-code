import { existsSync } from 'node:fs'
import { NodeTest } from './code_generator/JavaScript.js'
import { OutFile } from './outFile.js'
import { parse } from './syntax.js'
import { stepsFileName, testFileName } from './filenames/filenames.js'

export interface CompiledFeature {
  name: string
  code: Record<string, string>
}

export function compileFeature(fileName: string, src: string) {
  const feature = parse({ fileName, src })
  const testFn = testFileName(fileName)
  const testFile = new OutFile(testFn)
  const stepsFn = stepsFileName(fileName)
  const stepsFile = new OutFile(stepsFn)
  const cg = new NodeTest(testFile, stepsFile)
  feature.toCode(cg)
  return { outFile: testFile, stepsFile }
}
