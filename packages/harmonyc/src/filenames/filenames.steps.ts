import { Feature } from 'harmonyc/test'
import { expect } from 'vitest'
import { base, stepsFileName, testFileName } from './filenames.ts'
import { mkdirSync, mkdtempSync, rmSync, rmdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'

Feature('Filenames', ({ Action, Response }) => {
  let inputFile: string
  const tmp = mkdtempSync(join(tmpdir(), 'harmonyc-test-')).replace(/\\/g, '/')

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
    mkdirSync(dirname(`${tmp}/${fn}`), { recursive: true })
    writeFileSync(`${tmp}/${fn}`, '')
  })
})
