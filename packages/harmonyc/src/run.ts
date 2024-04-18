import { exec } from 'child_process'

function runCommand(patterns: string[]) {
  return `npx vitest run ${args(patterns)}`
}
function runWatchCommand(patterns: string[]) {
  return `npx vitest ${args(patterns)}`
}

function args(patterns: string[]) {
  return patterns.map((s) => JSON.stringify(s)).join(' ')
}

export function run(patterns: string[]) {
  const cmd = runCommand(patterns)
  const p = exec(cmd, { cwd: process.cwd() })
  p.stdout?.pipe(process.stdout)
  p.stderr?.pipe(process.stderr)
}

export function runWatch(patterns: string[]) {
  const cmd = runWatchCommand(patterns)
  const p = exec(cmd, { cwd: process.cwd() })
  p.stdout?.pipe(process.stdout)
  p.stderr?.pipe(process.stderr)
}
