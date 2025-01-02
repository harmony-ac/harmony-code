import { ExpectStatic } from 'vitest'
import { functionName } from './JavaScript'
import { parse, ACTION } from '../parser/parser'

export default class FunctionNamePhrases {
  expect: ExpectStatic
  constructor({ expect }: { expect: ExpectStatic }) {
    this.expect = expect
  }
  async When_(x: string) {
    return functionName(parse(x, ACTION))
  }
  async Then_(x: string, res: any) {
    this.expect(res).toBe(x)
  }
}
