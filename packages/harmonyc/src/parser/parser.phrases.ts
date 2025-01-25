import { expect } from 'vitest'
import { Section } from '../model/model'
import * as P from './parser'
import { parse } from './parser'
import { inspect } from 'util'

export default class ParserPhrases {
  production: any
  async When_production_(value: string) {
    this.production = P[value]
  }
  async When_(value: string): Promise<Section> {
    return parse(value, this.production)
  }
  async Then_(value: string, tree: any) {
    expect(tree.toString()).toBe(value)
  }
  async Then_instance_of_(clazz: string, tree: any) {
    expect(tree.constructor.name).toBe(clazz)
  }
}
