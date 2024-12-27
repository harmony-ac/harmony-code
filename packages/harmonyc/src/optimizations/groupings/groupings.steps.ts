import { expect } from 'vitest'
import { makeGroups, makeTests } from '../../model/model'
import { parse } from '../../parser/parser'

export default class GroupingsSteps {
  result = ''
  async When__(x: string) {
    const root = parse(x)
    this.result = makeGroups(makeTests(root)).join('\n')
  }
  async Then__(x: string) {
    expect(this.result).toEqual(x)
  }
}
