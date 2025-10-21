import { expect } from 'vitest'
import { parse } from '../parser/parser'
import { makeTests, Test } from './model'

export default class MakeTestsPhrases {
  async When_X(s: string) {
    const root = parse(s)
    return makeTests(root)
  }
  async Then_X(s: string, tests: Test[]) {
    expect(tests.join('\n')).toEqual(s)
  }
}
