import { basename } from 'node:path'
import { VitestGenerator } from '../code_generator/VitestGenerator.ts'
import { OutFile } from '../code_generator/outFile.ts'
import { base, phrasesFileName, testFileName } from '../filenames/filenames.ts'
import { Feature, Section } from '../model/model.ts'
import { autoLabel } from '../optimizations/autoLabel/autoLabel.ts'
import { parse } from '../parser/parser.ts'

export interface CompilerOptions {
  argumentPlaceholder: string | ((index: number) => string)
}

export interface CompiledFeature {
  name: string
  code: Record<string, string>
}

const X = 'X'.codePointAt(0)!
const A = 'A'.codePointAt(0)!

export const DEFAIULT_COMPILER_OPTIONS: CompilerOptions = {
  argumentPlaceholder: (index: number) =>
    String.fromCodePoint(A + ((X - A + index) % 26)),
}

export function compileFeature(
  fileName: string,
  src: string,
  opts: Partial<CompilerOptions> = {}
) {
  opts = { ...DEFAIULT_COMPILER_OPTIONS, ...opts }
  const feature = new Feature(basename(base(fileName)))
  try {
    feature.root = parse(src) as Section
  } catch (e: any) {
    if (e.pos && e.errorMessage) {
      e.message =
        e.stack = `Error in ${fileName}:${e.pos.rowBegin}:${e.pos.columnBegin}: ${e.errorMessage}`
    } else {
      e.stack = `Error in ${fileName}: ${e.stack}`
    }
    throw e
  }
  feature.root.setFeature(feature)
  autoLabel(feature.root)
  const testFn = testFileName(fileName)
  const testFile = new OutFile(testFn, fileName)
  const phrasesFn = phrasesFileName(fileName)
  const phrasesFile = new OutFile(phrasesFn, fileName)
  const cg = new VitestGenerator(testFile, phrasesFile, fileName, opts)
  feature.toCode(cg)
  return { outFile: testFile, phrasesFile }
}
