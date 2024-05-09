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
      this.tf.print(`import ${str(stepsModule)};`)
    }
    for (const test of feature.tests) {
      test.toCode(this)
    }
    this.sf.print(`import { Feature } from 'harmonyc/test';`)
    this.sf.print('')
    this.sf.print(`Feature(${str(feature.name)}, ({ Action, Response }) => {`)
    this.sf.indent(() => {
      for (const phrase of this.phrases) {
        this.sf.print(`${capitalize(phrase.kind)}(${str(phrase.text)}, () => {`)
        this.sf.indent(() => {
          this.sf.print(`throw new Error(${str(`Pending: ${phrase.text}`)})`)
        })
        this.sf.print('})')
      }
    })
    this.sf.print('})')
  }

  featureVars!: Map<string, string>
  test(t: Test) {
    this.featureVars = new Map()
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
    let f = this.featureVars.get(feature)
    if (!f) {
      f = toId(feature, this.featureVars)
      this.tf.print(`const ${f} = Feature(${str(feature)})`)
    }
    const docstring = p.docstring ? ', \n' + templateStr(p.docstring) : ''
    this.tf.print(
      `await ${f}.${capitalize(p.kind)}(${str(p.text)}${docstring})`
    )
  }
}

function str(s: string) {
  let r = JSON.stringify(s)
  return r
}

function templateStr(s: string) {
  return '`' + s.replace(/([`$])/g, '\\$1') + '`'
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function toId(s: string, previous: Map<string, string>) {
  if (previous.has(s)) return previous.get(s)!
  let base = pascalCase(s)
  let id = base
  if ([...previous.values()].includes(id)) {
    let i = 1
    while ([...previous.values()].includes(id + i)) i++
    id = base + i
  }
  previous.set(s, id)
  return id
}

function pascalCase(s: string) {
  return s
    .split(/[^a-zA-Z0-9]/)
    .map(capitalize)
    .join('')
}
