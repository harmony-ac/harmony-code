import { expect } from 'vitest'
import { makeGroups, makeTests } from '../../model/model'
import { parse } from '../../parser/parser'

export default class GroupingsPhrases {
  async When__(x: string) {
    const root = parse(x)
    return makeGroups(makeTests(root)).join('\n')
  }
  async Then__(x: string, result: string) {
    expect(result).toEqual(x)
  }
}
