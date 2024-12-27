import { expect } from 'vitest'
import { parse } from '../../parser/parser.ts'
import { autoLabel } from './autoLabel.ts'

export default class AutoLabelSteps {
  result = ''
  async When__(x: string) {
    const root = parse(x)
    autoLabel(root)
    this.result = root.toString()
  }
  async Then__(x: string) {
    expect(this.result).toEqual(x)
  }
}
