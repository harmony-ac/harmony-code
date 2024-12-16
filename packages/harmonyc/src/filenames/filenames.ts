import glob from 'fast-glob'
const { globSync, convertPathToPattern } = glob

export function base(fn: string) {
  return fn.replace(/\.harmony(\.\w+)?$/i, '')
}

export function testFileName(fn: string) {
  return base(fn) + '.test.mjs'
}

export function stepsFileName(fn: string) {
  const baseFn = base(fn)
  const pattern = convertPathToPattern(baseFn)
  const existing = globSync(`${pattern}.steps.{tsx,jsx,ts,js}`)
  if (existing.length) {
    return existing.sort().at(-1)
  }
  return `${baseFn}.steps.ts`
}
