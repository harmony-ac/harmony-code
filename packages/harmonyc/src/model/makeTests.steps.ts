import { parse } from '../parser/parser'
import { makeTests, Test } from './model'
import { expect } from 'vitest'

export default class MakeTestsSteps {
  async When__(s: string) {
    const root = parse(s)
    return makeTests(root)
  }
  async Then__(s: string, tests: Test[]) {
    expect(tests.join('\n')).toEqual(s)
  }
}
