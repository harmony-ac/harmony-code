import { readFileSync } from 'fs'
import * as t from 'ts-morph'
import { expect } from 'vitest'
import { compileFeature } from '../compiler/compile'
import { TmpFilePhrases } from '../util/tmpfiles.phrases'
import { PhrasesAssistant } from './phrases_assistant'

export default class PhrasesAssistantPhrases extends TmpFilePhrases {
  private p!: PhrasesAssistant
  private project = new t.Project()
  private legacyPlaceholder?: string | ((index: number) => string)

  async When_legacy_placeholder_X(x: string) {
    this.legacyPlaceholder = x
  }

  async Then_X(expected: string) {
    this.p = new PhrasesAssistant(
      this.project,
      'tmp/test.phrases.ts',
      'TestPhrases',
      { legacyArgumentPlaceholder: this.legacyPlaceholder },
    )
    const { phraseMethods } = compileFeature(
      'tmp/hello.harmony',
      readFileSync('tmp/test.harmony', 'utf-8'),
    )
    this.p.ensureMethods(phraseMethods)
    const code = this.p.toCode()
    expect(code.trimEnd()).toBe(expected.trimEnd())
  }
}
