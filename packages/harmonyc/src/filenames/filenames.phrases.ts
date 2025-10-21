import { mkdirSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { dirname, join } from 'path'
import { expect } from 'vitest'
import { base, phrasesFileName } from './filenames'

export default class FilenamesPhrases {
  inputFile: string
  tmp = mkdtempSync(join(tmpdir(), 'harmonyc-test-')).replace(/\\/g, '/')

  async When_a_file_X_exists(fn: string) {
    mkdirSync(dirname(`${this.tmp}/${fn}`), { recursive: true })
    writeFileSync(`${this.tmp}/${fn}`, '')
  }

  async When_for_filename_X(string: string) {
    this.inputFile = `${this.tmp}/${string}`
  }

  async Then_base_is_X(expected: string) {
    expect(base(this.inputFile)).toBe(`${this.tmp}/${expected}`)
  }
  async Then_phrases_file_is_X(expected: string) {
    expect(phrasesFileName(this.inputFile)).toBe(`${this.tmp}/${expected}`)
  }
}
