import { expect } from 'vitest'
import { CodeGenerator, Feature, Section, Test } from '../model/model'
import { ACTION, parse, STEP } from '../parser/parser'
import { OutFile } from './outFile'
import { VitestGenerator } from './VitestGenerator'

export default class CodeGeneratorPhrases {
  tf = new OutFile('tf')
  sf = new OutFile('sf')
  generator: CodeGenerator
  feature = new Feature('test')
  async When_Vitest() {
    this.generator = new VitestGenerator(this.tf, this.sf)
    this.generator.feature(this.feature)
    this.generator.test(new Test(new Section(), []))
    this.tf.lines = []
  }
  async When_step(x: string) {
    parse(x, STEP).setFeature(this.feature).toCode(this.generator)
  }
  async Then_(x: string) {
    expect(this.tf.value).toBe(x)
  }
}
