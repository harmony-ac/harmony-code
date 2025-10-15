import { expect } from 'vitest'
import { Section } from '../model/model'
import * as P from './parser'
import { parse } from './parser'

export default class ParserPhrases {
  production: any
  async When_production_(value: string) {
    this.production = P[value]
  }
  async When_(value: string): Promise<Section> {
    return parse(value, this.production)
  }
  async Then_(value: string, tree: any) {
    if (typeof value === 'string') {
      expect(tree.toString()).toBe(value)
    } else {
      expect(tree).toMatchObject(value)
    }
  }
  async Then_instance_of_(clazz: string, tree: any) {
    expect(tree.constructor.name).toBe(clazz)
  }
  async Then_has_(prop: string, result: any) {
    expect(result).toHaveProperty(prop)
    return result[prop]
  }
  async Then__is_(a: any, b: any) {
    expect(a).toBe(b)
  }
}
