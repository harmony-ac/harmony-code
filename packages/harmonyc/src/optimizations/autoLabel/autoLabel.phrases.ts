import { expect } from 'vitest'
import { parse } from '../../parser/parser.ts'
import { autoLabel } from './autoLabel.ts'

export default class AutoLabelPhrases {
  async When__(x: string) {
    const root = parse(x)
    autoLabel(root)
    return root.toString()
  }
  async Then__(x: string, value: string) {
    expect(value).toEqual(x)
  }
}
