import { readFileSync, writeFileSync } from 'fs'
import { expect } from 'vitest'

export class TmpFilePhrases {
  async When_common_file_X(x: string) {
    writeFileSync('tmp/common.phrases.ts', x, 'utf-8')
  }

  async When_harmony_file_X(x: string) {
    writeFileSync('tmp/test.harmony', x, 'utf-8')
  }

  async When_phrases_file_X(x: any) {
    writeFileSync('tmp/test.phrases.ts', x, 'utf-8')
  }

  async Then_common_file_X(x: string, res: any) {
    expect(readFileSync('tmp/common.phrases.ts', 'utf-8')).toBe(x)
  }
}
