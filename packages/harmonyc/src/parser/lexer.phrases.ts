import { Token } from 'typescript-parsec'
import { expect } from 'vitest'
import { T, lexer } from './lexer'

export default class LexerPhrases {
  async When_X(input: string) {
    let list: Token<T> | undefined = lexer.parse(input)
    const arr: string[] = []
    while (list) {
      arr.push(list.kind)
      list = list.next
    }
    return arr.join(' ')
  }
  async Then_X(expected: string, result: string) {
    expect(result).toEqual(expected)
  }
}
