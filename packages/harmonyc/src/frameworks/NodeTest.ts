import { CodeGenerator, Feature, Phrase, Test } from '../model'
import { OutFile } from '../outFile'

export class NodeTest implements CodeGenerator {
  framework = 'vitest'
  constructor(private outFile: OutFile) {}

  feature(feature: Feature) {
    if (this.framework === 'vitest') {
      this.outFile.print(`import { test, expect } from 'vitest';`)
    }
    this.outFile.print(feature.prelude)
    for (const test of feature.tests) {
      test.toCode(this)
    }
  }

  test(t: Test) {
    this.outFile.print(`test('${t.name}', async () => {`)
    this.outFile.indent(() => {
      for (const step of t.steps) {
        step.toCode(this)
      }
    })
    this.outFile.print('})')
    this.outFile.print('')
  }

  phrase(p: Phrase) {
    this.outFile.loc(p).print('/// ' + p.text)
    const code =
      p.definition() ?? `throw 'Not defined: ' + ${JSON.stringify(p.text)};`
    this.outFile.print(...code.split('\n'))
  }
}
