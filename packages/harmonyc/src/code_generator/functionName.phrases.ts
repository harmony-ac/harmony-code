import { expect } from 'vitest'
import { functionName } from './JavaScript'
import { ACTION, parse, PHRASE } from '../parser/parser'

export default class FunctionNamePhrases {
  async When__(x: string) {
    return functionName(parse(x, ACTION))
  }
  async Then__(x: string, res: any) {
    expect(res).toBe(x)
  }
}
