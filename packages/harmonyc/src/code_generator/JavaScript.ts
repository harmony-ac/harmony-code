import { basename } from 'path'
import { Arg, CodeGenerator, Feature, Phrase, Test, Word } from '../model.js'
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
    this.sf.print(`export default class ${pascalCase(feature.name)} {`)
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
  }

  phrase(p: Phrase) {
    const phrasefn = this.functionName(p)
    if (!this.phraseFns.includes(phrasefn)) this.phraseFns.push(phrasefn)
    const feature = p.feature.name
    let f = this.featureVars.get(feature)
    if (!f) {
      f = toId(feature, abbrev, this.featureVars)
      this.tf.print(`const ${f} = new ${pascalCase(feature)}();`)
    }
    const args = p.args.map((a) => a.toCode(this))
    if (p.docstring) args.push(str(p.docstring))
    this.tf.print(`await ${f}.${this.functionName(p)}(${args.join(', ')});`)
  }

  stringLiteral(text: string): string {
    return str(text)
  }

  codeLiteral(src: string): string {
    return src
  }

  private functionName(phrase: Phrase) {
    const { kind } = phrase
    return (
      (kind === 'response' ? '__' : '') +
      (phrase.content
        .map((c) =>
          c instanceof Word ? underscore(c.text) : c instanceof Arg ? '$' : ''
        )
        .filter((x) => x)
        .join('_') || '_')
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

function toId(
  s: string,
  transform: (s: string) => string,
  previous: Map<string, string>
) {
  if (previous.has(s)) return previous.get(s)!
  let base = transform(s)
  let id = base
  if ([...previous.values()].includes(id)) {
    let i = 1
    while ([...previous.values()].includes(id + i)) i++
    id = base + i
  }
  previous.set(s, id)
  return id
}

function words(s: string) {
  return s.split(/[^0-9\p{L}]+/gu)
}

function pascalCase(s: string) {
  return words(s).map(capitalize).join('')
}

function underscore(s: string) {
  return words(s).join('_')
}

function abbrev(s: string) {
  return words(s)
    .map((x) => x.charAt(0).toUpperCase())
    .join('')
}
