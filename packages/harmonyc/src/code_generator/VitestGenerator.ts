import { basename } from 'path'
import { CompilerOptions } from '../compiler/compile.ts'
import {
  Action,
  Arg,
  CodeGenerator,
  ErrorResponse,
  Feature,
  Phrase,
  Response,
  SaveToVariable,
  SetVariable,
  Test,
  TestGroup,
  Word,
} from '../model/model.ts'
import { OutFile } from './outFile.ts'

export class VitestGenerator implements CodeGenerator {
  static error(message: string, stack: string) {
    return `const e = new SyntaxError(${str(message)});
    e.stack = undefined;
    throw e;
    ${stack ? `/* ${stack} */` : ''}`
  }

  framework = 'vitest'
  phraseFns = new Map<string, Phrase>()
  currentFeatureName = ''

  constructor(
    private tf: OutFile,
    private sf: OutFile,
    private _sourceFileName: string,
    private opts: CompilerOptions
  ) {}

  feature(feature: Feature) {
    const phrasesModule = './' + basename(this.sf.name.replace(/.(js|ts)$/, ''))
    const fn = (this.currentFeatureName = pascalCase(feature.name))
    this.phraseFns = new Map<string, Phrase>()

    // test file
    if (this.framework === 'vitest') {
      this.tf.print(`import { describe, test, expect } from "vitest";`)
    }
    if (feature.tests.length === 0) {
      this.tf.print('')
      this.tf.print(`describe.todo(${str(feature.name)});`)
      return
    }
    this.tf.print(`import ${fn}Phrases from ${str(phrasesModule)};`)
    this.tf.print(``)
    for (const item of feature.testGroups) {
      item.toCode(this)
    }
    this.tf.print(``)

    // phrases file
    this.sf.print(`export default class ${pascalCase(feature.name)}Phrases {`)
    this.sf.indent(() => {
      for (const ph of this.phraseFns.keys()) {
        const p = this.phraseFns.get(ph)!
        const params = p.args.map((a, i) => a.toDeclaration(this, i)).join(', ')
        this.sf.print(`async ${ph}(${params}) {`)
        this.sf.indent(() => {
          this.sf.print(`throw new Error(${str(`Pending: ${ph}`)});`)
        })
        this.sf.print(`}`)
      }
    })
    this.sf.print(`};`)
  }

  testGroup(g: TestGroup) {
    this.tf.print(
      `describe(${str(g.label.text)}, () => {`,
      g.label.start,
      g.label.text
    )
    this.tf.indent(() => {
      for (const item of g.items) {
        item.toCode(this)
      }
    })
    this.tf.print('});')
  }

  featureVars!: Map<string, string>
  resultCount = 0
  test(t: Test) {
    this.resultCount = 0
    this.featureVars = new Map()
    // avoid shadowing this import name
    this.featureVars.set(new Object() as any, this.currentFeatureName)
    this.tf.print(
      `test(${str(t.name)}, async (context) => {`,
      t.lastStrain?.start,
      t.testNumber
    )
    this.tf.indent(() => {
      this.tf.print(`context.task.meta.phrases ??= [];`)
      for (const step of t.steps) {
        step.toCode(this)
      }
    })
    this.tf.print('});')
  }

  errorStep(action: Action, errorResponse: ErrorResponse) {
    this.declareFeatureVariables([action])
    this.tf.print(`await expect(async () => {`)
    this.tf.indent(() => {
      action.toCode(this)
      this.tf.print(
        `context.task.meta.phrases.push(${str(
          errorResponse.toSingleLineString()
        )});`
      )
    })
    this.tf.print(
      `}).rejects.toThrow(${
        errorResponse?.message !== undefined
          ? str(errorResponse.message.text)
          : ''
      });`
    )
  }

  extraArgs: string[] = []
  step(action: Action, responses: Response[]): void {
    this.declareFeatureVariables([action, ...responses])
    if (responses.length === 0) {
      action.toCode(this)
      return
    }
    if (action.isEmpty) {
      for (const response of responses) {
        response.toCode(this)
      }
      return
    }
    const res = `r${this.resultCount++ || ''}`
    this.tf.print(`const ${res} =`)
    this.tf.indent(() => {
      action.toCode(this)
      try {
        this.extraArgs = [res]
        for (const response of responses) {
          response.toCode(this)
        }
      } finally {
        this.extraArgs = []
      }
    })
  }

  private declareFeatureVariables(phrases: (Response | Action)[]) {
    for (const p of phrases) {
      const feature = p.feature.name
      let f = this.featureVars.get(feature)
      if (!f) {
        f = toId(feature, abbrev, this.featureVars)
        this.tf.print(
          `const ${f} = new ${pascalCase(feature)}Phrases(context);`
        )
      }
    }
  }

  phrase(p: Phrase) {
    const phrasefn = this.functionName(p)
    if (!this.phraseFns.has(phrasefn)) this.phraseFns.set(phrasefn, p)
    const f = this.featureVars.get(p.feature.name)
    const args = p.args.map((a) => (a as Arg).toCode(this))
    args.push(...this.extraArgs)
    if (p instanceof Response && p.parts.length === 1 && p.saveToVariable) {
      return this.saveToVariable(p.saveToVariable)
    }
    const name = p.toSingleLineString()
    this.tf.print(`(context.task.meta.phrases.push(${str(p.toString())}),`)
    if (p instanceof Response && p.saveToVariable) {
      this.saveToVariable(p.saveToVariable, '')
    }
    this.tf.printn(`await ${f}.`)
    this.tf.write(`${phrasefn}(${args.join(', ')})`, p.start, name)
    this.tf.write(`);`)
    this.tf.nl()
  }

  setVariable(action: SetVariable): void {
    this.tf.print(
      `(context.task.meta.variables ??= {})[${str(
        action.variableName
      )}] = ${action.value.toCode(this)};`
    )
  }

  saveToVariable(s: SaveToVariable, what = this.extraArgs[0] + ';') {
    this.tf.print(
      `(context.task.meta.variables ??= {})[${str(
        s.variableName
      )}] = ${what}`.trimEnd()
    )
  }

  stringLiteral(
    text: string,
    { withVariables }: { withVariables: boolean }
  ): string {
    if (withVariables && text.match(/\$\{/)) {
      return templateStr(text).replace(
        /\\\$\{([^\s}]+)\}/g,
        (_, x) => `\${context.task.meta.variables?.[${str(x)}]}`
      )
    }
    return str(text)
  }

  codeLiteral(src: string): string {
    return src.replace(
      /\$\{([^\s}]+)\}/g,
      (_, x) => `context.task.meta.variables?.[${str(x)}]`
    )
  }

  private paramName(index: number) {
    return 'xyz'.charAt(index) || `a${index + 1}`
  }

  stringParamDeclaration(index: number): string {
    return `${this.paramName(index)}: string`
  }

  variantParamDeclaration(index: number): string {
    return `${this.paramName(index)}: any`
  }

  functionName(phrase: Phrase) {
    const { kind } = phrase
    return (
      (kind === 'response' ? 'Then_' : 'When_') +
      (phrase.parts
        .flatMap((c) =>
          c instanceof Word
            ? words(c.text).filter((x) => x)
            : c instanceof Arg
            ? [this.opts.argumentPlaceholder]
            : []
        )
        .join('_') || '')
    )
  }
}

function str(s: string) {
  if (s.includes('\n')) return '\n' + templateStr(s)
  let r = JSON.stringify(s)
  return r
}

function templateStr(s: string) {
  return '`' + s.replace(/([`$\\])/g, '\\$1') + '`'
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
