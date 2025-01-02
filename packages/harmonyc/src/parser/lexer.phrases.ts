import { expect } from 'vitest'
import { T, lexer } from './lexer'
import { Token } from 'typescript-parsec'

export default class LexerPhrases {
  async When__(input: string) {
    let list: Token<T> | undefined = lexer.parse(input)
    const arr: string[] = []
    while (list) {
      arr.push(list.kind)
      list = list.next
    }
    return arr.join(' ')
  }
  async Then__(expected: string, result: string) {
    expect(result).toEqual(expected)
  }
}
