import { Routers } from './Router'
import { indent } from './util/indent'

export abstract class Branch {
  parent?: Branch
  children: Branch[]
  isFork = false
  isEnd = false

  constructor(children: Branch[] = []) {
    this.children = children
    children.forEach((child) => (child.parent = this))
  }
  setFork(isFork: boolean) {
    this.isFork = isFork
    return this
  }
  setFeatureName(featureName: string) {
    for (const child of this.children) child.setFeatureName(featureName)
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
    isFork = false,
    featureName = ''
  ) {
    super(children)
    this.action = new Action(action, featureName)
    this.responses = responses.map(
      (response) => new Response(response, featureName)
    )
    this.isFork = isFork
  }
  get phrases(): Phrase[] {
    return [this.action, ...this.responses]
  }
  toGherkin() {
    return this.phrases.flatMap((phrase) => phrase.toGherkin())
  }
  setFeatureName(featureName: string) {
    this.action.setFeatureName(featureName)
    for (const response of this.responses) response.setFeatureName(featureName)
    return super.setFeatureName(featureName)
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
  featureName: string
  abstract get kind(): string
  constructor(text = '', featureName = '') {
    this.text = text
    this.featureName = featureName
  }
  setFeatureName(featureName: string) {
    this.featureName = featureName
  }
  toGherkin() {
    return [
      `${this.kind === 'action' ? 'When' : 'Then'} ${this.text} || ${
        this.featureName
      }`,
    ]
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

  toGherkin() {
    return [
      `Scenario: ${this.testNumber!}${
        this.labels.length > 0 ? ' - ' : ''
      }${this.labels.join(' - ')}`,
      ...indent(this.steps.flatMap((b) => b.toGherkin())),
      '',
    ]
  }
}
