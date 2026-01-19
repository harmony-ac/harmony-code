import { expect } from 'vitest'
import { Section } from '../model/model'
import * as P from './parser'
import { parse } from './parser'

export default class ParserPhrases {
  production: any

  async When_production_X(value: string) {
    this.production = P[value]
  }

  async When_X(value: string): Promise<Section> {
    return parse(value, this.production)
  }

  async Then_X(value: string, tree: any) {
    if (typeof value === 'string') {
      expect(tree.toString()).toBe(value)
    } else {
      expect(tree).toMatchObject(value)
    }
  }

  async Then_instance_of_X(clazz: string, tree: any) {
    expect(tree.constructor.name).toBe(clazz)
  }

  async Then_has_X(prop: string, result: any) {
    expect(result).toHaveProperty(prop)
    return result[prop]
  }

  async Then_X_is_Y(X: any, Y: any) {
    expect(X).toBe(Y)
  }
}
