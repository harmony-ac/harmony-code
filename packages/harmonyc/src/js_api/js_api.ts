import {
  CucumberExpression,
  ParameterTypeRegistry,
} from '@cucumber/cucumber-expressions'

class Definition {
  constructor(public expr: CucumberExpression, public fn: Function) {}
}

const features: Map<string, FeatureContext> = new Map()

class FeatureContext {
  #defs: Definition[] = []
  #parameterTypeRegistry = new ParameterTypeRegistry()

  Action: ((s: string) => Promise<void>) & ((s: string, fn: Function) => void) =
    ((s: string, fn?: Function) => {
      if (fn) {
        const expr = new CucumberExpression(s, this.#parameterTypeRegistry)
        const def = new Definition(expr, fn)
        this.#defs.push(def)
        return
      }
      // call the action
      const matches = this.#defs.map((def) => def.expr.match(s))
      const matching = [...matches.keys()].filter((i) => matches[i])
      if (matching.length === 0) {
        throw new Error(`Not defined: ${s}`)
      }
      if (matching.length > 1) {
        throw new Error(
          `Ambiguous: ${s}\n${matching
            .map((i) => this.#defs[i].expr.source)
            .join('\n')}`
        )
      }
      const match = matches[matching[0]]!
      const def = this.#defs[matching[0]]
      return Promise.resolve(def.fn(...match.map((m) => m.getValue(undefined))))
    }) as any
  Response = this.Action
}

export function Feature(s: string, fn?: (ctx: FeatureContext) => void) {
  let ctx: FeatureContext | undefined
  if (!fn) {
    ctx = features.get(s)
    if (!ctx) throw new Error(`Feature not found: ${s}`)
  } else {
    // redefine the feature
    ctx = new FeatureContext()
    features.set(s, ctx)
  }
  fn?.(ctx)
  return ctx
}
