import glob from 'fast-glob'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { basename } from 'path'
import { compileFeature } from './compile.js'

export async function compileFiles(pattern: string | string[]) {
  const fns = await glob(pattern)
  if (!fns.length)
    throw new Error(`No files found for pattern: ${String(pattern)}`)
  const features = await Promise.all(fns.map((fn) => compileFile(fn)))
  console.log(`Compiled ${fns.length} file${fns.length === 1 ? '' : 's'}.`)
  const generated = features.filter((f) => f.stepsFileAction === 'generated')
  if (generated.length) {
    console.log(
      `Generated ${generated.length} steps file${
        generated.length === 1 ? '' : 's'
      }.`
    )
  }
  return { fns, outFns: features.map((f) => f.outFile.name) }
}

export async function compileFile(fn: string) {
  const src = readFileSync(fn, 'utf8').toString().replace(/\r\n/g, '\n')
  const { outFile, stepsFile } = compileFeature(fn, src)
  writeFileSync(outFile.name, outFile.value)
  let stepsFileAction = 'ignored'
  if (!existsSync(stepsFile.name)) {
    stepsFileAction = 'generated'
    writeFileSync(stepsFile.name, stepsFile.value)
  }
  return { stepsFileAction, outFile, stepsFile }
}
