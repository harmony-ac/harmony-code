import { CodeGenerator, Feature, Phrase, Test } from '../model.js'
import { OutFile } from '../outFile.js'

export class Gherkin implements CodeGenerator {
  constructor(private outFile: OutFile) {}

  feature(feature: Feature) {
    this.outFile.print(`Feature: ${feature.name}`)
    this.outFile.print('')
    this.outFile.indent(() => {
      for (const test of feature.tests) {
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
