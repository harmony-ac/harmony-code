import { parse } from '../parser/parser'
import { makeTests, Test } from './model'
import { expect } from 'vitest'

export default class MakeTestsPhrases {
  async When_(s: string) {
    const root = parse(s)
    return makeTests(root)
  }
  async Then_(s: string, tests: Test[]) {
    expect(tests.join('\n')).toEqual(s)
  }
}
