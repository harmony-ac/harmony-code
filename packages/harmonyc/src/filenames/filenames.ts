import { globSync } from 'fast-glob'

export function base(fn: string) {
  return fn.replace(/\.harmony\.md$/i, '')
}

export function testFileName(fn: string) {
  return base(fn) + '.test.mjs'
}

export function stepsFileName(fn: string) {
  const existing = globSync(base(fn) + '.steps.*')
  if (existing.length) {
    return existing.sort()[0]
  }
  return base(fn) + '.steps.ts'
}
