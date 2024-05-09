import {
  CucumberExpression,
  ParameterTypeRegistry,
} from '@cucumber/cucumber-expressions'

type FeatureFn = (ctx: FeatureContext) => void

class Definition {
  constructor(public expr: CucumberExpression, public fn: Function) {}
}

const featureDefs: Map<string, FeatureFn> = new Map()

class FeatureContext {
  #actions: Definition[] = []
  #responses: Definition[] = []
  #parameterTypeRegistry = new ParameterTypeRegistry()

  Action: ((s: string, ds?: string) => Promise<void>) &
    ((s: string, fn: Function) => void) = ((
    s: string,
    fn?: string | Function
  ) => {
    if (typeof fn === 'function') {
      const expr = new CucumberExpression(s, this.#parameterTypeRegistry)
      const def = new Definition(expr, fn)
      this.#actions.push(def)
      return
    }
    // call the action
    const matches = this.#actions.map((def) => def.expr.match(s))
    const matching = [...matches.keys()].filter((i) => matches[i])
    if (matching.length === 0) {
      throw new Error(`Action not defined: ${s}`)
    }
    if (matching.length > 1) {
      throw new Error(
        `Ambiguous: ${s}\n${matching
          .map((i) => this.#actions[i].expr.source)
          .join('\n')}`
      )
    }
    const match = matches[matching[0]]!
    const def = this.#actions[matching[0]]
    const docstring = fn
    return Promise.resolve(
      def.fn(...match.map((m) => m.getValue(undefined)), docstring)
    )
  }) as any

  Response: ((s: string, ds?: string) => Promise<void>) &
    ((s: string, fn: Function) => void) = ((
    s: string,
    fn?: Function | string
  ) => {
    if (typeof fn === 'function') {
      const expr = new CucumberExpression(s, this.#parameterTypeRegistry)
      const def = new Definition(expr, fn)
      this.#responses.push(def)
      return
    }
    // call the action
    const matches = this.#responses.map((def) => def.expr.match(s))
    const matching = [...matches.keys()].filter((i) => matches[i])
    if (matching.length === 0) {
      throw new Error(`Response not defined: ${s}`)
    }
    if (matching.length > 1) {
      throw new Error(
        `Ambiguous: ${s}\n${matching
          .map((i) => this.#responses[i].expr.source)
          .join('\n')}`
      )
    }
    const match = matches[matching[0]]!
    const def = this.#responses[matching[0]]
    const docstring = fn
    return Promise.resolve(
      def.fn(...match.map((m) => m.getValue(undefined)), docstring)
    )
  }) as any
}

export function Feature(s: string): FeatureContext
export function Feature(s: string, fn: FeatureFn): void
export function Feature(s: string, fn?: FeatureFn) {
  if (!fn) {
    // instantiate the feature
    const fn = featureDefs.get(s)
    if (!fn) throw new Error(`Feature not found: ${s}`)
    const ctx = new FeatureContext()
    fn(ctx)
    return ctx
  } else {
    // (re)define the feature
    featureDefs.set(s, fn)
  }
}
