import { parse } from '../parser/parser'
import { expect } from 'vitest'

export default class FindNodeAtPositionPhrases {
  async When_X(x: string) {
    const pos = x.indexOf('$')
    if (pos === -1) {
      throw new Error('No $ found in input string')
    }
    const source = x.replace('$', '')
    const ast = parse(source)
    const line = source.substring(0, pos).split('\n').length - 1
    const char = pos - source.lastIndexOf('\n', pos - 1) - 1
    return ast.findNodeAtPosition(line, char)
  }

  async Then_X(x: string | null, res: any) {
    expect(String(res)).toBe(String(x))
  }
}
