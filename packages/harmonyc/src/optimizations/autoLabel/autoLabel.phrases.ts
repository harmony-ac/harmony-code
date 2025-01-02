import { expect } from 'vitest'
import { parse } from '../../parser/parser.ts'
import { autoLabel } from './autoLabel.ts'

export default class AutoLabelPhrases {
  async When_(x: string) {
    const root = parse(x)
    autoLabel(root)
    return root.toString()
  }
  async Then_(x: string, value: string) {
    expect(value).toEqual(x)
  }
}
