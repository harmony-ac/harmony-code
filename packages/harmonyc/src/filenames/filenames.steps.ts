import { Feature } from 'harmonyc/test'
import { expect } from 'vitest'
import { base, stepsFileName, testFileName } from './filenames.ts'
import { mkdirSync, mkdtempSync, rmSync, rmdirSync, writeFileSync } from 'fs'
import { basename, dirname } from 'path'

Feature('Filenames', ({ Action, Response }) => {
  let inputFile: string
  const tmp = mkdtempSync('harmonyc-test-')

  Action('input file is {string}', (string: string) => {
    inputFile = `${tmp}/${string}`
  })
  Response('base is {string}', (expected: string) => {
    expect(base(inputFile)).toBe(`${tmp}/${expected}`)
  })
  Response('test file is {string}', (expected: string) => {
    expect(testFileName(inputFile)).toBe(`${tmp}/${expected}`)
  })
  Response('steps file is {string}', (expected: string) => {
    expect(stepsFileName(inputFile)).toBe(`${tmp}/${expected}`)
  })
  Action('a file {string} exists', (fn: string) => {
    rmSync(tmp, { recursive: true }) // TODO separate tmp dirs per test case
    mkdirSync(dirname(`${tmp}/${fn}`), { recursive: true })
    writeFileSync(`${tmp}/${fn}`, '')
  })
})

//# sourceMappingURL=data:application/json,%7B%22version%22%3A3%2C%22sources%22%3A%5B%5D%2C%22names%22%3A%5B%5D%2C%22mappings%22%3A%22%22%7D
