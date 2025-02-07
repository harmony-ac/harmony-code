import { expect } from 'vitest'
import { CodeGenerator, Feature, Section, Test } from '../model/model'
import { ACTION, parse, STEP } from '../parser/parser'
import { OutFile } from './outFile'
import { VitestGenerator } from './VitestGenerator'
import { TestPhrases } from './test_phrases'

export default class CodeGeneratorPhrases {
  tf = new OutFile('tf')
  sf = new OutFile('sf')
  generator: CodeGenerator
  feature = new Feature('test')
  constructor(private context: any) {}
  async When_Vitest() {
    this.generator = new VitestGenerator(this.tf, this.sf)
    this.generator.feature(this.feature)
    this.generator.test(new Test(new Section(), []))
    this.tf.lines = []
  }
  async When_step_(x: string) {
    parse(x, STEP).setFeature(this.feature).toCode(this.generator)
  }
  async Then_(x: string) {
    expect(this.tf.value).toBe(x)
    const AsyncFunction: any = async function () {}.constructor
    await new AsyncFunction('TestPhrases', 'context', 'expect', this.tf.value)(
      TestPhrases,
      this.context,
      expect
    )
  }
  async Then_greeting_is_(x: string) {
    expect(this.context.task.meta.greeting).toBe(x)
  }
  async Then__is_(x: string, y: string) {
    expect(x).toBe(y)
  }
}
