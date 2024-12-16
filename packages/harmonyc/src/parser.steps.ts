import { expect } from 'vitest'
import { Section } from './model'
import { parse } from './parser'

export default class ParserSteps {
  tree: Section
  async When__(value: string) {
    this.tree = parse(value)
  }
  async Then__(value: string) {
    expect(this.tree.toString()).toBe(value)
  }
}
