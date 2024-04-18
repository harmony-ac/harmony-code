import { watch } from 'node:fs'
import { compileFile, compileFiles } from './compiler.js'

export async function watchFiles(patterns: string[]) {
  const { fns, outFns } = await compileFiles(patterns)
  for (const file of fns) {
    watch(file, () => {
      compileFile(file)
    })
  }
  return outFns
}
