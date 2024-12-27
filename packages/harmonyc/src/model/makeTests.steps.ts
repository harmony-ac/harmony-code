import { parse } from '../parser/parser'
import { makeTests, Test } from './model'
import { expect } from 'vitest'

export default class MakeTestsSteps {
  tests: Test[]

  async When__(s: string) {
    const root = parse(s)
    this.tests = makeTests(root)
  }
  async Then__(s: string) {
    expect(this.tests.join('\n')).toEqual(s)
  }
}
