#!/usr/bin/env node
import { compileFiles } from './compiler'

if (process.argv.length < 3 || process.argv.includes('--help')) {
  console.error('Usage: harmonyc <input files glob pattern>')
  process.exit(1)
}

const args = process.argv.slice(2)
void compileFiles(args)
