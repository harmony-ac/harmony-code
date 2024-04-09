import { watch } from 'node:fs'
import { compileFile, compileFiles } from './compiler'

export async function watchFiles(patterns: string[]) {
  const fns = await compileFiles(patterns)
  for (const file of fns) {
    watch(file, () => {
      compileFile(file)
    })
  }
}
