import { SourceMapConsumer } from 'source-map-js'
import { expect } from 'vitest'
import * as vlq from 'vlq'
import { DEFAULT_COMPILER_OPTIONS } from '../compiler/compile'
import { CodeGenerator, Feature, Test } from '../model/model'
import { parse, STEP, TEST_DESIGN } from '../parser/parser'
import { OutFile } from './outFile'
import { TestPhrases } from './test_phrases'
import { VitestGenerator } from './VitestGenerator'

export default class CodeGeneratorPhrases {
  tf = new OutFile('tf', 'test.harmony')
  generator: CodeGenerator
  feature = new Feature('test')
  what_was_parsed: unknown
  constructor(private context: any) {}
  async When_Vitest() {
    this.generator = new VitestGenerator(
      this.tf,
      'test.harmony',
      DEFAULT_COMPILER_OPTIONS
    )
    this.generator.feature(this.feature)
    this.generator.test(new Test([]))
    this.tf.clear()
  }
  async When_step_X(x: string) {
    parse(x, STEP).setFeature(this.feature).toCode(this.generator)
    this.what_was_parsed = STEP
  }
  async When_tree_X(x: string) {
    const feature = new Feature('myFeature')
    feature.root = parse(x, TEST_DESIGN).setFeature(this.feature)
    feature.toCode(this.generator)
    this.what_was_parsed = TEST_DESIGN
  }
  async Then_X(x: string) {
    expect(this.tf.valueWithoutSourceMap.replace(/\n$/, '')).toBe(x)
    const AsyncFunction: any = async function () {}.constructor
    if (this.what_was_parsed === STEP) {
      await new AsyncFunction(
        'TestPhrases',
        'context',
        'expect',
        this.tf.valueWithoutSourceMap
      )(TestPhrases, this.context, expect)
    } else if (this.what_was_parsed === TEST_DESIGN) {
      // TODO something like:
      // await import(`data:text/javascript,${encodeURIComponent(this.tf.value)}`)
    }
  }
  async Then_greeting_is_X(x: string) {
    expect(this.context.task.meta.greeting).toBe(x)
  }
  async Then_X_is_Y(x: string, y: string) {
    expect(x).toBe(y)
  }
  async Then_original_line_X_column_Y_generated_line_Z_column_A(
    originalLine: number,
    originalColumn: number,
    generatedLine: number,
    generatedColumn: number
  ) {
    const smc = new SourceMapConsumer(
      this.tf.sm.toStringWithSourceMap().map.toJSON()
    )
    const generated = smc.generatedPositionFor({
      source: 'test.harmony',
      line: originalLine,
      column: originalColumn,
    })
    expect(`${generated.line}:${generated.column}`).toBe(
      `${generatedLine}:${generatedColumn}`
    )
  }
  async Then_mappings_X(m: number[][][]) {
    expect(
      this.tf.sm
        .toStringWithSourceMap()
        .map.toJSON()
        .mappings.split(';')
        .map((line: string) => line.split(',').map(vlq.decode))
    ).toEqual(m)
  }
}
