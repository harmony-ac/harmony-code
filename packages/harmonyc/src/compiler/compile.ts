import { VitestGenerator } from '../code_generator/VitestGenerator.ts'
import { OutFile } from '../code_generator/outFile.ts'
import { parse } from '../parser/parser.ts'
import { base, phrasesFileName, testFileName } from '../filenames/filenames.ts'
import { Feature, Section } from '../model/model.ts'
import { basename } from 'node:path'
import { autoLabel } from '../optimizations/autoLabel/autoLabel.ts'

export interface CompiledFeature {
  name: string
  code: Record<string, string>
}

export function compileFeature(fileName: string, src: string) {
  const feature = new Feature(basename(base(fileName)))
  try {
    feature.root = parse(src) as Section
  } catch (e: any) {
    if (e.pos && e.errorMessage) {
      e.message =
        e.stack = `Error in ${fileName}:${e.pos.rowBegin}:${e.pos.columnBegin}\n${e.errorMessage}`
    } else {
      e.stack = `Error in ${fileName}\n${e.stack}`
    }
    throw e
  }
  feature.root.setFeature(feature)
  autoLabel(feature.root)
  const testFn = testFileName(fileName)
  const testFile = new OutFile(testFn, fileName)
  const phrasesFn = phrasesFileName(fileName)
  const phrasesFile = new OutFile(phrasesFn, fileName)
  const cg = new VitestGenerator(testFile, phrasesFile, fileName)
  feature.toCode(cg)
  return { outFile: testFile, phrasesFile }
}
