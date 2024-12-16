import { expect } from 'vitest'
import { T, lexer } from './lexer'
import { Token } from 'typescript-parsec'

export default class LexerSteps {
  result: string
  async When__(input: string) {
    let list: Token<T> | undefined = lexer.parse(input)
    const arr: string[] = []
    while (list) {
      arr.push(list.kind)
      list = list.next
    }
    this.result = arr.join(' ')
  }
  async Then__(expected: string) {
    expect(this.result).toEqual(expected)
  }
}
