import { expect } from 'vitest'
import { Section } from '../model/model'
import * as P from './parser'
import { parse } from './parser'
import { inspect } from 'util'

export default class ParserSteps {
  production: any
  tree: Section
  async When_production__(value: string) {
    this.production = P[value]
  }
  async When__(value: string) {
    this.tree = parse(value, this.production)
  }
  async Then__(value: string) {
    expect(this.tree.toString()).toBe(value)
  }
}
