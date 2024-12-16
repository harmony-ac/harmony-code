import { expect } from 'vitest'
import { base, stepsFileName, testFileName } from './filenames.ts'
import { mkdirSync, mkdtempSync, rmSync, rmdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, dirname } from 'path'

export default class Filenames {
  inputFile: string
  tmp = mkdtempSync(join(tmpdir(), 'harmonyc-test-')).replace(/\\/g, '/')

  async When_for_filename__(string: string) {
    this.inputFile = `${this.tmp}/${string}`
  }
  async When_a_file___exists(fn: string) {
    mkdirSync(dirname(`${this.tmp}/${fn}`), { recursive: true })
    writeFileSync(`${this.tmp}/${fn}`, '')
  }
  async Then_base_is__(expected: string) {
    expect(base(this.inputFile)).toBe(`${this.tmp}/${expected}`)
  }
  async Then_test_file_is__(expected: string) {
    expect(testFileName(this.inputFile)).toBe(`${this.tmp}/${expected}`)
  }
  async Then_steps_file_is__(expected: string) {
    expect(stepsFileName(this.inputFile)).toBe(`${this.tmp}/${expected}`)
  }
}
