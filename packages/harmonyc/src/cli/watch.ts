import Watcher from 'watcher'
import { compileFile, compileFiles } from '../compiler/compiler.ts'

export async function watchFiles(patterns: string[]) {
  const { fns, outFns } = await compileFiles(patterns)
  for (const file of fns) {
    const watcher = new Watcher(file, { debounce: 20, ignoreInitial: true })
    watcher.on('all', async () => {
      try {
        await compileFile(file)
      } catch (e: any) {
        process.stdout.write(`\n`)
        console.log(e.message ?? e)
        process.stdout.write(`\n`)
      }
      logger.log(`Compiled ${file}`)
    })
  }
  return outFns
}

const logger = {
  last: '',
  n: 0,
  log(msg: string) {
    if (msg === this.last) {
      process.stdout.write(`\r${msg} ${++this.n}x`)
    } else {
      process.stdout.write(`\r${msg}`)
      this.last = msg
      this.n = 1
    }
  },
}
