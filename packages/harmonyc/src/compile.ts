import { NodeTest } from './code_generator/JavaScript.js'
import { OutFile } from './outFile.js'
import { parse } from './parser.js'
import { base, stepsFileName, testFileName } from './filenames/filenames.js'
import { Feature, Section } from './model.js'
import { basename } from 'node:path'

export interface CompiledFeature {
  name: string
  code: Record<string, string>
}

export function compileFeature(fileName: string, src: string) {
  const feature = new Feature(basename(base(fileName)))
  try {
    feature.root = parse(src) as Section
  } catch (e: any) {
    if (e.pos) {
      e.stack = `Error in ${fileName}:${e.pos.rowBegin}:${e.pos.columnBegin}\n${e.stack}`
    } else {
      e.stack = `Error in ${fileName}\n${e.stack}`
    }
    throw e
  }
  feature.root.setFeature(feature)
  const testFn = testFileName(fileName)
  const testFile = new OutFile(testFn)
  const stepsFn = stepsFileName(fileName)
  const stepsFile = new OutFile(stepsFn)
  const cg = new NodeTest(testFile, stepsFile)
  feature.toCode(cg)
  return { outFile: testFile, stepsFile }
}
