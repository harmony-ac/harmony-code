import { basename } from 'path'
import { CodeGenerator, Feature, Phrase, Test } from '../model.js'
import { OutFile } from '../outFile.js'

export class NodeTest implements CodeGenerator {
  framework = 'vitest'
  phraseFns: string[] = []
  currentFeatureName = ''
  constructor(private tf: OutFile, private sf: OutFile) {}

  feature(feature: Feature) {
    const stepsModule = './' + basename(this.sf.name.replace(/.(js|ts)$/, ''))
    const fn = (this.currentFeatureName = pascalCase(feature.name))
    this.phraseFns = []
    if (this.framework === 'vitest') {
      this.tf.print(`import { test } from 'vitest';`)
    }
    this.tf.print(`import ${fn} from ${str(stepsModule)};`)
    this.tf.print(``)
    for (const test of feature.tests) {
      test.toCode(this)
    }
    this.sf.print(`export class ${pascalCase(feature.name)} {`)
    this.sf.indent(() => {
      for (const fn of this.phraseFns) {
        this.sf.print(`async ${fn}() {`)
        this.sf.indent(() => {
          this.sf.print(`throw new Error(${str(`Pending: ${fn}`)});`)
        })
        this.sf.print(`}`)
      }
    })
    this.sf.print(`};`)
  }

  featureVars!: Map<string, string>
  test(t: Test) {
    this.featureVars = new Map()
    // avoid shadowing this import name
    this.featureVars.set(new Object() as any, this.currentFeatureName)
    this.tf.print(`test('${t.name}', async (context) => {`)
    this.tf.indent(() => {
      for (const step of t.steps) {
        step.toCode(this)
      }
    })
    this.tf.print('});')
    this.tf.print('')
  }

  phrase(p: Phrase) {
    const phrasefn = toFunctionName(p.text, p.kind)
    if (!this.phraseFns.includes(phrasefn)) this.phraseFns.push(phrasefn)
    const feature = p.feature.name
    let f = this.featureVars.get(feature)
    if (!f) {
      f = toId(feature, this.featureVars)
      this.tf.print(`const ${f} = new ${pascalCase(feature)}();`)
    }
    const args: any[] = []
    p.text.replace(/"([^"]*)"/g, (_, s) => (args.push(s), ''))
    if (p.docstring) args.push(p.docstring)
    const formattedArgs = args.map((x) => str(x)).join(', ')
    this.tf.print(
      `await ${f}.${toFunctionName(p.text, p.kind)}(${formattedArgs});`
    )
  }
}

function str(s: string) {
  if (s.includes('\n')) return '\n' + templateStr(s)
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
  let base = abbrev(s)
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

function abbrev(s: string) {
  return s
    .split(/[^a-zA-Z0-9]/)
    .map((x) => x.charAt(0).toLowerCase())
    .join('')
}

function toFunctionName(phrase: string, type: string) {
  return (
    (type === 'response' ? '__' : '') +
    phrase
      .replace(/"([^"]*)"/g, '_')
      .replace(/[^\w]+/g, '_')
      .replace(/__$/, '___')
  )
}
