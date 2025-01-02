import { expect } from 'vitest'
import { Section } from '../model/model'
import * as P from './parser'
import { parse } from './parser'
import { inspect } from 'util'

export default class ParserPhrases {
  production: any
  async When_production__(value: string) {
    this.production = P[value]
  }
  async When__(value: string): Promise<Section> {
    return parse(value, this.production)
  }
  async Then__(value: string, tree: Section) {
    expect(tree.toString()).toBe(value)
  }
}
