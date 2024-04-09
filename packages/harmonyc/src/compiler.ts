import glob from 'fast-glob'
import { readFileSync, writeFileSync } from 'fs'
import { basename } from 'path'
import { compileFeature } from './compile'

export async function compileFiles(pattern: string | string[]) {
  const fns = await glob(pattern)
  if (!fns.length)
    throw new Error(`No files found for pattern: ${String(pattern)}`)
  await Promise.all(fns.map((fn) => compileFile(fn)))
  console.log(`Compiled ${fns.length} file${fns.length === 1 ? '' : 's'}.`)
  return fns
}

export async function compileFile(fn: string) {
  const src = readFileSync(fn, 'utf8').toString()
  const name = basename(fn).replace(/\.[a-z]+$/i, '')
  const outFn = `${fn.replace(/\.[a-z]+$/i, '')}.mjs`
  writeFileSync(outFn, compileFeature(name, src))
}
