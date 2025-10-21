import { basename } from 'node:path'
import { VitestGenerator } from '../code_generator/VitestGenerator.ts'
import { OutFile } from '../code_generator/outFile.ts'
import { base, testFileName } from '../filenames/filenames.ts'
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
const x = 'x'.codePointAt(0)!
const a = 'a'.codePointAt(0)!

export function XYZAB(index: number) {
  return String.fromCodePoint(A + ((X - A + index) % 26))
}

export function xyzab(index: number) {
  return String.fromCodePoint(a + ((x - a + index) % 26))
}

export const DEFAULT_COMPILER_OPTIONS: CompilerOptions = {
  argumentPlaceholder: XYZAB,
}

export function compileFeature(
  fileName: string,
  src: string,
  opts: Partial<CompilerOptions> = {}
) {
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
  const cg = new VitestGenerator(testFile, fileName, {
    ...DEFAULT_COMPILER_OPTIONS,
    ...opts,
  })
  feature.toCode(cg)
  return {
    outFile: testFile,
    phraseMethods: cg.phraseMethods,
    featureClassName: cg.featureClassName,
  }
}
