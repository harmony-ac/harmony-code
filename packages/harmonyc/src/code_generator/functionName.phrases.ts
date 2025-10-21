import { ExpectStatic } from 'vitest'
import { ACTION, parse } from '../parser/parser'
import { OutFile } from './outFile'
import { VitestGenerator } from './VitestGenerator'

export default class FunctionNamePhrases {
  expect: ExpectStatic
  cg = new VitestGenerator(
    new OutFile('tf', ''),
    new OutFile('sf', ''),
    'test.harmony',
    { argumentPlaceholder: '' }
  )
  constructor({ expect }: { expect: ExpectStatic }) {
    this.expect = expect
  }
  async When_(x: string) {
    return this.cg.functionName(parse(x, ACTION))
  }
  async Then_(x: string, res: any) {
    this.expect(res).toBe(x)
  }
}
