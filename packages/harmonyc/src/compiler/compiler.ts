import glob from 'fast-glob'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { basename, resolve } from 'path'
import { compileFeature } from './compile.ts'
import { testFileName } from '../filenames/filenames.ts'
import { VitestGenerator } from '../code_generator/VitestGenerator.ts'

export async function compileFiles(pattern: string | string[]) {
  const fns = await glob(pattern)
  if (!fns.length)
    throw new Error(`No files found for pattern: ${String(pattern)}`)
  const results = await Promise.allSettled(fns.map((fn) => compileFile(fn)))
  const compiled = results.flatMap((r) =>
    r.status === 'fulfilled' ? [r.value] : []
  )
  const errored = results.flatMap((r) =>
    r.status === 'rejected' && r.reason ? [r.reason] : []
  )
  for (const error of errored) {
    console.error(error.message ?? error)
  }
  console.log(
    `Compiled ${compiled.length} file${compiled.length === 1 ? '' : 's'}.`
  )
  const features = compiled.filter((f) => f !== undefined)
  const generated = features.filter((f) => f.phrasesFileAction === 'generated')
  if (generated.length) {
    console.log(
      `Generated ${generated.length} phrases file${
        generated.length === 1 ? '' : 's'
      }.`
    )
  }
  return { fns, outFns: features.map((f) => f.outFile.name) }
}

export async function compileFile(fn: string) {
  fn = resolve(fn)
  const src = readFileSync(fn, 'utf8')
    .toString()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
  try {
    const { outFile, phrasesFile } = compileFeature(fn, src)
    writeFileSync(outFile.name, outFile.value)
    let phrasesFileAction = 'ignored'
    if (!existsSync(phrasesFile.name)) {
      phrasesFileAction = 'generated'
      writeFileSync(phrasesFile.name, phrasesFile.value)
    }
    return { phrasesFileAction, outFile, phrasesFile }
  } catch (e: any) {
    const outFileName = testFileName(fn)
    writeFileSync(outFileName, VitestGenerator.error(e.message ?? `${e}`))
    return undefined
  }
}
