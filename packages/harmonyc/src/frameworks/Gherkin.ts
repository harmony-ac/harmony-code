import { CodeGenerator, Phrase, Test } from '../model'
import { OutFile } from '../outFile'
import { Indent } from '../util/indent'

export class Gherkin implements CodeGenerator {
  constructor(private outFile: OutFile) {}

  feature(name: string, tests: Test[]) {
    this.outFile.print(`Feature: ${name}`)
    this.outFile.print('')
    this.outFile.indent(() => {
      for (const test of tests) {
        test.toCode(this)
      }
    })
  }

  test(t: Test) {
    this.outFile.print(`Scenario: ${t.name}`)
    this.outFile.indent(() => {
      for (const step of t.steps) {
        step.toCode(this)
      }
    })
    this.outFile.print('')
  }

  phrase(p: Phrase) {
    this.outFile.print(`${p.keyword} ${p.text} || ${p.feature}`)
    if (p.docstring !== undefined) {
      this.outFile.indent(() => {
        this.outFile.print(`"""`)
        this.outFile.print(...p.docstring!.split('\n'))
        this.outFile.print(`"""`)
      })
    }
  }
}
