import glob from 'fast-glob'
const { globSync, convertPathToPattern } = glob

export function base(fn: string) {
  return fn.replace(/\.harmony\.md$/i, '')
}

export function testFileName(fn: string) {
  return base(fn) + '.test.mjs'
}

export function stepsFileName(fn: string) {
  const pattern = convertPathToPattern(base(fn) + '.steps.*')
  const existing = globSync(pattern)
  if (existing.length) {
    return existing.sort()[0]
  }
  return base(fn) + '.steps.ts'
}
