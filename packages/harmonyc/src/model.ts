import { Routers } from './Router'
import { Argument, CucumberExpression } from '@cucumber/cucumber-expressions'

export interface CodeGenerator {
  feature(feature: Feature): void
  test(test: Test): void
  phrase(phrase: Phrase): void
}

export interface Location {
  line: number
  column: number
  fileName: string
}

export class Feature {
  root = new Section()
  definitions = new Map<CucumberExpression, string>()
  prelude = ''
  constructor(public name: string) {}
  get tests() {
    return makeTests(this.root)
  }
  toCode(cg: CodeGenerator) {
    cg.feature(this)
  }
}

export abstract class Branch {
  parent?: Branch
  children: Branch[]
  isFork = false
  isEnd = false
  location?: Location

  constructor(children: Branch[] = []) {
    this.children = children
    children.forEach((child) => (child.parent = this))
  }
  setFork(isFork: boolean) {
    this.isFork = isFork
    return this
  }
  setFeature(feature: Feature) {
    for (const child of this.children) child.setFeature(feature)
    return this
  }
  addChild<C extends Branch>(child: C, index = this.children.length) {
    this.children.splice(index, 0, child)
    child.parent = this
    return child
  }
  get isLeaf() {
    return this.children.length === 0
  }
  get successors(): Branch[] {
    if (!this.isLeaf) return this.children.filter((c, i) => i === 0 || c.isFork)
    else {
      if (this.isEnd) return []
      const next = this.nextNonForkAncestorSibling
      if (next) return [next]
      return []
    }
  }
  get nextNonForkAncestorSibling(): Branch | undefined {
    if (!this.parent) return undefined
    const { nextSibling } = this
    if (nextSibling && !nextSibling.isFork) return nextSibling
    return this.parent.nextNonForkAncestorSibling
  }
  get nextSibling(): Branch | undefined {
    if (!this.parent) return undefined
    return this.parent.children[this.siblingIndex + 1]
  }
  get siblingIndex() {
    return this.parent?.children.indexOf(this) ?? -1
  }
}

export class Step extends Branch {
  action: Action
  responses: Response[]
  state?: State

  constructor(
    action = '',
    responses: string[] = [],
    children?: Branch[],
    isFork = false
  ) {
    super(children)
    this.action = new Action(action)
    this.responses = responses.map((response) => new Response(response))
    this.isFork = isFork
  }
  get phrases(): Phrase[] {
    return [this.action, ...this.responses]
  }
  toCode(cg: CodeGenerator) {
    for (const phrase of this.phrases) {
      phrase.toCode(cg)
    }
  }
  setFeature(feature: Feature) {
    this.action.setFeature(feature)
    for (const response of this.responses) response.setFeature(feature)
    return super.setFeature(feature)
  }
}
export class State {
  text: string

  constructor(text = '') {
    this.text = text
  }
}

export class Label {
  text: string
  constructor(text = '') {
    this.text = text
  }
}

export class Section extends Branch {
  label: Label
  constructor(label = '', children?: Branch[], isFork = false) {
    super(children)
    this.label = new Label(label)
    this.isFork = isFork
  }
}

export abstract class Phrase {
  text: string
  feature!: Feature
  docstring?: string
  location?: Location
  abstract get kind(): string
  constructor(text = '') {
    this.text = text
  }
  setFeature(feature: Feature) {
    this.feature = feature
  }
  get keyword() {
    return this.kind === 'action' ? 'When' : 'Then'
  }
  toCode(cg: CodeGenerator) {
    return cg.phrase(this)
  }
  definition() {
    const key = this.kind === 'action' ? this.text : `=> ${this.text}`
    let args: readonly Argument[] | undefined
    let code: string | undefined
    for (const [ce, c] of this.feature.definitions.entries()) {
      const m = ce.match(key)
      if (!m) continue
      if (args !== undefined) throw new Error(`Ambiguous definition: ${key}`)
      args = m
      code = c
    }
    if (args === undefined) return undefined
    return code!.replace(/\$([$_1-9])/g, (s, varName) => {
      if (varName.match(/[1-9]/))
        return JSON.stringify(args![parseInt(varName) - 1].getValue(undefined))
      else if (varName === '_') return JSON.stringify(this.docstring ?? '')
      else if (varName === '$') return '$'
      else return s
    })
  }
}

export class Action extends Phrase {
  kind = 'action'
}

export class Response extends Phrase {
  kind = 'response'
}

export class Precondition extends Branch {
  state: State = new State()
  constructor(state: string = '') {
    super()
    this.state.text = state
  }
}

export function makeTests(root: Branch) {
  const routers = new Routers(root)
  const tests = []
  let ic = routers.getIncompleteCount()
  let newIc: number
  do {
    const newTest = new Test(root, routers.nextWalk())
    newIc = routers.getIncompleteCount()
    if (newIc < ic) tests.push(newTest)
    ic = newIc
  } while (ic > 0)
  // sort by order of appearance of the last branch
  const branchIndex = new Map<Branch, number>()
  let i = 0
  function walk(branch: Branch) {
    branchIndex.set(branch, i++)
    for (const child of branch.children) walk(child)
  }
  walk(root)
  tests.sort((a, b) => branchIndex.get(a.last)! - branchIndex.get(b.last)!)

  tests.forEach((test, i) => (test.testNumber = `T${i + 1}`))
  return tests
}

export class Test {
  testNumber?: string
  constructor(public root: Branch, public branches: Branch[]) {}

  get steps(): Step[] {
    return this.branches.filter((b): b is Step => b instanceof Step)
  }

  get last() {
    return this.steps[this.steps.length - 1]
  }

  get labels(): string[] {
    return this.branches
      .filter((b): b is Section => b instanceof Section)
      .map((s) => s.label.text)
  }

  get name() {
    return `${this.testNumber!}${
      this.labels.length > 0 ? ' - ' : ''
    }${this.labels.join(' - ')}`
  }

  toCode(cg: CodeGenerator) {
    cg.test(this)
  }
}
