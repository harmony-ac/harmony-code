import { writeFileSync } from 'fs'

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
}
