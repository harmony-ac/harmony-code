import glob from 'fast-glob'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { compileFeature } from './compile.ts'

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
  return { fns, outFns: features.map((f) => f.outFile.name) }
}

export async function compileFile(fn: string) {
  fn = resolve(fn)
  const src = preprocess(readFileSync(fn, 'utf8').toString())

  try {
    const { outFile } = compileFeature(fn, src)
    writeFileSync(outFile.name, outFile.value)
    return { outFile }
  } catch (e: any) {
    return undefined
  }
}

export function preprocess(src: string) {
  // strip BOM
  if (src.charCodeAt(0) === 0xfeff) {
    src = src.slice(1)
  }
  src = src.replace(/\r\n?/g, '\n')
  return src
}
