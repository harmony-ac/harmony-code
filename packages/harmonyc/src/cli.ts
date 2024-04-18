#!/usr/bin/env node
import { compileFiles } from './compiler.js'
import { parseArgs } from 'node:util'
import { watchFiles } from './watch.js'
import { run, runWatch } from './run.js'

const args = parseArgs({
  options: {
    help: { type: 'boolean' },
    watch: { type: 'boolean' },
    run: { type: 'boolean' },
  },
  allowPositionals: true,
})

if (args.positionals.length === 0 || args.values.help) {
  console.error('Usage: harmonyc <input files glob pattern>')
  process.exit(1)
}

;(async () => {
  if (args.values.watch) {
    const outFns = await watchFiles(args.positionals)
    if (args.values.run) {
      runWatch(outFns)
    }
  } else {
    const { outFns } = await compileFiles(args.positionals)
    if (args.values.run) {
      run(outFns)
    }
  }
})()
