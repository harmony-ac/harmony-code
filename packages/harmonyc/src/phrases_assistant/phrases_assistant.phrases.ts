import { expect } from 'vitest'
import { compileFeature } from '../compiler/compile'
import { PhrasesAssistant } from './phrases_assistant'

export default class PhrasesAssistantPhrases {
  private p!: PhrasesAssistant

  async When_harmony_file_X(src: string) {
    const { phraseMethods } = compileFeature('test.harmony', src)
    this.p.ensureMethods(phraseMethods)
  }

  async When_parse_phrases_file_X(content: string) {
    this.p = new PhrasesAssistant(content, 'TestPhrases')
  }

  async Then_X(expected: string) {
    expect(this.p.toCode().trim()).toBe(expected)
  }
}
