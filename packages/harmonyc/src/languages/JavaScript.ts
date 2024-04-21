import { basename } from 'path'
import { CodeGenerator, Feature, Phrase, Test } from '../model.js'
import { OutFile } from '../outFile.js'

export class NodeTest implements CodeGenerator {
  framework = 'vitest'
  phrases: Phrase[] = []
  constructor(private of: OutFile) {}

  feature(feature: Feature) {
    const stepsModule =
      './' +
      basename(this.of.name.replace(/(\.(spec|test)s?)?\.[a-z]+$/i, '.steps'))
    this.phrases = []
    if (this.framework === 'vitest') {
      this.of.print(`import { test, expect } from 'vitest';`)
      this.of.print(`import { Feature } from 'harmonyc/test';`)
      this.of.print(`import ${JSON.stringify(stepsModule)};`)
    }
    this.of.print(feature.prelude)
    for (const test of feature.tests) {
      test.toCode(this)
    }
  }

  test(t: Test) {
    this.of.print(`test('${t.name}', async (context) => {`)
    this.of.indent(() => {
      for (const step of t.steps) {
        step.toCode(this)
      }
    })
    this.of.print('})')
    this.of.print('')
  }

  phrase(p: Phrase) {
    if (!this.phrases.some((x) => x.text === p.text)) this.phrases.push(p)
    const feature = p.feature.name
    this.of.print(
      `await Feature(${JSON.stringify(feature)}).${capitalize(
        p.kind
      )}(${JSON.stringify(p.text)})`
    )
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
