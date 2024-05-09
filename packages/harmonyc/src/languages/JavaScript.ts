import { basename } from 'path'
import { CodeGenerator, Feature, Phrase, Test } from '../model.js'
import { OutFile } from '../outFile.js'

export class NodeTest implements CodeGenerator {
  framework = 'vitest'
  phrases: Phrase[] = []
  constructor(private tf: OutFile, private sf: OutFile) {}

  feature(feature: Feature) {
    const stepsModule = './' + basename(this.sf.name.replace(/.(js|ts)$/, ''))
    this.phrases = []
    if (this.framework === 'vitest') {
      this.tf.print(`import { test, expect } from 'vitest';`)
      this.tf.print(`import { Feature } from 'harmonyc/test';`)
      this.tf.print(`import ${JSON.stringify(stepsModule)};`)
    }
    for (const test of feature.tests) {
      test.toCode(this)
    }
    this.sf.print(`import { Feature } from 'harmonyc/test';`)
    this.sf.print('')
    this.sf.print(
      `Feature(${JSON.stringify(feature.name)}, ({ Action, Response }) => {`
    )
    this.sf.indent(() => {
      for (const phrase of this.phrases) {
        this.sf.print(
          `${capitalize(phrase.kind)}(${JSON.stringify(phrase.text)}, () => {`
        )
        this.sf.indent(() => {
          this.sf.print(
            `throw new Error(${JSON.stringify(`Pending: ${phrase.text}`)})`
          )
        })
        this.sf.print('})')
      }
    })
    this.sf.print('})')
  }

  test(t: Test) {
    this.tf.print(`test('${t.name}', async (context) => {`)
    this.tf.indent(() => {
      for (const step of t.steps) {
        step.toCode(this)
      }
    })
    this.tf.print('})')
    this.tf.print('')
  }

  phrase(p: Phrase) {
    if (!this.phrases.some((x) => x.text === p.text)) this.phrases.push(p)
    const feature = p.feature.name
    this.tf.print(
      `await Feature(${JSON.stringify(feature)}).${capitalize(
        p.kind
      )}(${JSON.stringify(p.text)})`
    )
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
