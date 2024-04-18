#!/usr/bin/env node
import { compileFiles } from './compiler.js'
import { parseArgs } from 'node:util'
import { watchFiles } from './watch.js'

const args = parseArgs({
  options: {
    help: { type: 'boolean' },
    watch: { type: 'boolean' },
  },
  allowPositionals: true,
})

if (args.positionals.length === 0 || args.values.help) {
  console.error('Usage: harmonyc <input files glob pattern>')
  process.exit(1)
}

if (args.values.watch) {
  void watchFiles(args.positionals)
} else {
  void compileFiles(args.positionals)
}
