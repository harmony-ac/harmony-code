import { expect } from 'vitest'
import { base, stepsFileName, testFileName } from './filenames.ts'
import { mkdirSync, mkdtempSync, rmSync, rmdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'

export default class Filenames {
  inputFile: string
  tmp = mkdtempSync(join(tmpdir(), 'harmonyc-test-')).replace(/\\/g, '/')

  async input_file_is___(string: string) {
    this.inputFile = `${this.tmp}/${string}`
  }
  async __base_is___(expected: string) {
    expect(base(this.inputFile)).toBe(`${this.tmp}/${expected}`)
  }
  async __test_file_is___(expected: string) {
    expect(testFileName(this.inputFile)).toBe(`${this.tmp}/${expected}`)
  }
  async __steps_file_is___(expected: string) {
    expect(stepsFileName(this.inputFile)).toBe(`${this.tmp}/${expected}`)
  }
  async a_file___exists(fn: string) {
    mkdirSync(dirname(`${this.tmp}/${fn}`), { recursive: true })
    writeFileSync(`${this.tmp}/${fn}`, '')
  }
}
