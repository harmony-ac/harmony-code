import { Routers } from './Router.ts'

export interface CodeGenerator {
  feature(feature: Feature): void
  testGroup(group: TestGroup): void
  test(test: Test): void
  phrase(phrase: Phrase): void
  step(action: Action, responses: Response[]): void
  errorStep(action: Action, errorResponse: ErrorResponse): void
  setVariable(action: SetVariable): void
  saveToVariable(response: SaveToVariable): void
  stringLiteral(text: string, opts: { withVariables: boolean }): string
  codeLiteral(src: string): string
  stringParamDeclaration(index: number): string
  variantParamDeclaration(index: number): string
}

export interface Location {
  line: number
  column: number
  fileName: string
}

export class Feature {
  root = new Section()
  prelude = ''
  constructor(public name: string) {}
  get tests() {
    return makeTests(this.root)
  }
  get testGroups() {
    return makeGroups(this.tests)
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
  abstract get isEmpty(): boolean

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
  toString(): string {
    return this.children
      .map((c) => (c.isFork ? '+ ' : '- ') + c.toString())
      .join('\n')
  }
  replaceWith(newBranch: Branch) {
    if (!this.parent) throw new Error('cannot replace root')
    this.parent.children.splice(this.siblingIndex, 1, newBranch)
    newBranch.parent = this.parent
    this.parent = undefined
    return this
  }
}

export class Step extends Branch {
  action: Action
  responses: Response[]
  state?: State

  constructor(
    action: Action,
    responses: Response[] = [],
    children?: Branch[],
    isFork = false
  ) {
    super(children)
    this.action = action
    this.responses = responses
    this.isFork = isFork
  }
  get phrases(): Phrase[] {
    return [this.action, ...this.responses]
  }
  toCode(cg: CodeGenerator) {
    if (this.responses[0] instanceof ErrorResponse) {
      cg.errorStep(this.action, this.responses[0])
    } else {
      cg.step(this.action, this.responses)
    }
  }
  setFeature(feature: Feature) {
    this.action.setFeature(feature)
    for (const response of this.responses) response.setFeature(feature)
    return super.setFeature(feature)
  }
  headToString() {
    return this.phrases.join(' ')
  }
  toString() {
    return this.headToString() + indent(super.toString())
  }

  get isEmpty(): boolean {
    return this.phrases.every((phrase) => phrase.isEmpty)
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
  get isEmpty() {
    return this.text === ''
  }
}

export class Section extends Branch {
  label: Label
  constructor(label?: Label, children?: Branch[], isFork = false) {
    super(children)
    this.label = label ?? new Label()
    this.isFork = isFork
  }
  toString() {
    if (this.label.text === '') return super.toString()
    return this.label.text + ':' + indent(super.toString())
  }
  get isEmpty(): boolean {
    return this.label.isEmpty
  }
}

export abstract class Part {
  toSingleLineString() {
    return this.toString()
  }
}

export class DummyKeyword extends Part {
  text: string
  constructor(text = '') {
    super()
    this.text = text
  }
  toString() {
    return this.text
  }
}
export class Word extends Part {
  text: string
  constructor(text = '') {
    super()
    this.text = text
  }
  toString() {
    return this.text
  }
}
export abstract class Arg extends Part {
  abstract toCode(cg: CodeGenerator): string
  abstract toDeclaration(cg: CodeGenerator, index: number): string
}
export class StringLiteral extends Arg {
  text: string
  constructor(text = '') {
    super()
    this.text = text
  }
  toString() {
    return JSON.stringify(this.text)
  }
  toSingleLineString() {
    return this.toString()
  }
  toCode(cg: CodeGenerator) {
    return cg.stringLiteral(this.text, { withVariables: true })
  }
  toDeclaration(cg: CodeGenerator, index: number) {
    return cg.stringParamDeclaration(index)
  }
}

export class Docstring extends StringLiteral {
  toCode(cg: CodeGenerator) {
    return cg.stringLiteral(this.text, { withVariables: false })
  }
  toString() {
    return this.text
      .split('\n')
      .map((l) => '| ' + l)
      .join('\n')
  }
  toSingleLineString() {
    return super.toString()
  }
}
export class CodeLiteral extends Arg {
  src: string
  constructor(src = '') {
    super()
    this.src = src
  }
  toString() {
    return '`' + this.src + '`'
  }
  toCode(cg: CodeGenerator) {
    return cg.codeLiteral(this.src)
  }
  toDeclaration(cg: CodeGenerator, index: number) {
    return cg.variantParamDeclaration(index)
  }
}

export abstract class Phrase {
  feature!: Feature
  location?: Location
  abstract get kind(): string
  constructor(public parts: Part[]) {}
  setFeature(feature: Feature) {
    this.feature = feature
    return this
  }
  get keyword() {
    return this.kind === 'action' ? 'When' : 'Then'
  }
  get args() {
    return this.parts.filter((c) => c instanceof Arg)
  }
  get isEmpty() {
    return this.parts.length === 0
  }
  abstract toCode(cg: CodeGenerator): void
  toString() {
    const parts = this.parts.map((p) => p.toString())
    const isMultiline = parts.map((p) => p.includes('\n'))
    return parts
      .map((p, i) =>
        i === 0 ? p : isMultiline[i - 1] || isMultiline[i] ? '\n' + p : ' ' + p
      )
      .join('')
  }
  toSingleLineString() {
    return this.parts.map((p) => p.toSingleLineString()).join(' ')
  }
}

export class Action extends Phrase {
  kind = 'action'

  toCode(cg: CodeGenerator) {
    if (this.isEmpty) return
    cg.phrase(this)
  }
}

export class Response extends Phrase {
  kind = 'response'
  constructor(parts: Part[], public saveToVariable?: SaveToVariable) {
    super([...parts, ...(saveToVariable ? [saveToVariable] : [])])
  }
  get isEmpty() {
    return this.parts.length === 0 && !this.saveToVariable
  }

  toString(): string {
    return `=> ${super.toString()}`
  }
  toSingleLineString(): string {
    return `=> ${super.toSingleLineString()}`
  }
  toCode(cg: CodeGenerator) {
    if (this.isEmpty) return
    cg.phrase(this)
  }
}

export class ErrorResponse extends Response {
  constructor(public message: StringLiteral | undefined) {
    super(
      message ? [new DummyKeyword('!!'), message] : [new DummyKeyword('!!')]
    )
  }
  toCode(cg: CodeGenerator) {
    cg.errorStep
  }
}

export class SetVariable extends Action {
  constructor(public variableName: string, public value: Arg) {
    super([new DummyKeyword(`\${${variableName}}`), value])
  }
  toCode(cg: CodeGenerator): void {
    cg.setVariable(this)
  }
}

export class SaveToVariable extends Part {
  constructor(public variableName: string) {
    super()
  }
  toCode(cg: CodeGenerator): void {
    cg.saveToVariable(this)
  }
  toString() {
    return `\${${this.variableName}}`
  }
}

export class Precondition extends Branch {
  state: State = new State()
  constructor(state: string = '') {
    super()
    this.state.text = state
  }
  get isEmpty(): boolean {
    return this.state.text === ''
  }
}

export function makeTests(root: Branch): Test[] {
  const routers = new Routers(root)
  let tests = []
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
  tests = tests.filter((t) => t.steps.length > 0)
  tests.sort((a, b) => branchIndex.get(a.last)! - branchIndex.get(b.last)!)

  tests.forEach((test, i) => (test.testNumber = `T${i + 1}`))
  return tests
}

export class Test {
  testNumber?: string
  labels
  constructor(public root: Branch, public branches: Branch[]) {
    this.branches = this.branches.filter((b) => !b.isEmpty)
    this.labels = this.branches
      .filter((b) => b instanceof Section)
      .filter((s) => !s.isEmpty)
      .map((s) => s.label.text)
  }

  get steps(): Step[] {
    return this.branches.filter((b) => b instanceof Step)
  }

  get last(): Step {
    return this.steps[this.steps.length - 1]
  }

  get name() {
    return `${[this.testNumber!, ...this.labels].join(' - ')}`
  }

  toCode(cg: CodeGenerator) {
    cg.test(this)
  }

  toString() {
    return `+ ${this.name}:\n${this.steps
      .map((s) => `  - ${s.headToString()}`)
      .join('\n')}`
  }
}

export function makeGroups(tests: Test[]): (Test | TestGroup)[] {
  if (tests.length === 0) return []
  if (tests[0].labels.length === 0)
    return [tests[0], ...makeGroups(tests.slice(1))]
  const name = tests[0].labels[0]
  let count = tests.findIndex((t) => t.labels[0] !== name)
  if (count === -1) count = tests.length
  if (count === 1) return [tests[0], ...makeGroups(tests.slice(1))]
  tests.slice(0, count).forEach((test) => test.labels.shift())
  return [
    new TestGroup(name, makeGroups(tests.slice(0, count))),
    ...makeGroups(tests.slice(count)),
  ]
}

export class TestGroup {
  constructor(public name: string, public items: (Test | TestGroup)[]) {}
  toString() {
    return `+ ${this.name}:` + indent(this.items.join('\n'))
  }
  toCode(cg: CodeGenerator) {
    cg.testGroup(this)
  }
}

function indent(s: string) {
  if (!s) return ''
  return (
    '\n' +
    s
      .split('\n')
      .map((l) => '  ' + l)
      .join('\n')
  )
}
