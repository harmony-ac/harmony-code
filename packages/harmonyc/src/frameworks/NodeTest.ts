import { CodeGenerator, Phrase, Test } from '../model'
import { OutFile } from '../outFile'

export class NodeTest implements CodeGenerator {
  constructor(private outFile: OutFile) {}

  feature(name: string, tests: Test[]) {
    this.outFile.print(`import { test } from 'node:test'`)
    this.outFile.print('')
    for (const test of tests) {
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
    this.outFile.print(
      p.definition ??
        `throw new Error('Not defined: ' + ${JSON.stringify(p.text)})`
    )
  }
}
