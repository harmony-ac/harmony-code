import { Token } from 'typescript-parsec'
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
  phraseMethods: PhraseMethod[]
}

export interface PhraseMethod {
  name: string
  parameters: { name: string; type: string }[]
}

export interface Location {
  line: number
  column: number
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
export abstract class Node {
  start?: { line: number; column: number }
  end?: { line: number; column: number }

  at([startToken, endToken]: [Token<any> | undefined, Token<any> | undefined]) {
    while (startToken && startToken.kind === 'newline') {
      startToken = startToken.next
    }
    if (startToken) {
      this.start = {
        line: startToken.pos.rowBegin,
        column: startToken.pos.columnBegin - 1,
      }
    }
    if (startToken && endToken) {
      let t = startToken
      while (t.next && t.next !== endToken) {
        t = t.next
      }
      this.end = {
        line: t.pos.rowEnd,
        column: t.pos.columnEnd - 1,
      }
    }
    return this
  }

  atSameAs(other: Node) {
    this.start = other.start
    this.end = other.end
    return this
  }
}

export abstract class Branch extends Node {
  parent?: Branch
  children: Branch[]
  isFork = false
  isEnd = false
  location?: Location
  abstract get isEmpty(): boolean

  constructor(children: Branch[] = []) {
    super()
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
  switch(_i: number) {
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
  switch(i: number): this {
    return new Step(
      this.action.switch(i),
      this.responses.map((r) => r.switch(i))
    ) as this
  }
}
export class State {
  text: string

  constructor(text = '') {
    this.text = text
  }
}

export class Label extends Node {
  text: string
  constructor(text = '') {
    super()
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

export class Repeater extends Part {
  constructor(public choices: Part[][]) {
    super()
  }
  toString() {
    return `{${this.choices.map((ps) => ps.join(' ')).join(' && ')}}`
  }
  toSingleLineString(): string {
    return `{${this.choices
      .map((ps) => ps.map((p) => p.toSingleLineString()).join(' '))
      .join(' && ')}}`
  }
}

export class Switch extends Part {
  constructor(public choices: Part[]) {
    super()
  }
  toString() {
    return `{ ${this.choices.join('; ')} }`
  }
  toSingleLineString(): string {
    return `{ ${this.choices.map((c) => c.toSingleLineString()).join('; ')} }`
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

export abstract class Phrase extends Node {
  feature!: Feature
  abstract get kind(): string

  constructor(public parts: Part[]) {
    super()
  }

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
  switch(i: number): Phrase {
    return new (this.constructor as new (parts: Part[]) => Phrase)(
      this.parts.map((p) => (p instanceof Switch ? p.choices[i] : p))
    ).setFeature(this.feature)
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
  get words(): string[] {
    return []
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
    const newTest = new Test(routers.nextWalk())
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
  tests.sort((a, b) => branchIndex.get(a.last!)! - branchIndex.get(b.last!)!)
  resolveSwitches(tests)
  tests.forEach((test, i) => (test.testNumber = `T${i + 1}`))
  return tests
}

function resolveSwitches(tests: Test[]) {
  for (let i = 0; i < tests.length; ++i) {
    const test = tests[i]
    const phrases = test.steps.flatMap((s) => s.phrases)
    const switches = phrases.flatMap((p) =>
      p.parts.filter((p) => p instanceof Switch)
    )
    if (switches.length === 0) continue
    const count = switches[0].choices.length
    if (switches.some((s) => s.choices.length !== count)) {
      throw new Error(
        `all switches in a test case must have the same number of choices: ${
          test.name
        } has ${switches.map((s) => s.choices.length)} choices`
      )
    }
    const newTests = switches[0].choices.map((_, j) => test.switch(j))
    tests.splice(i, 1, ...newTests)
    i += count - 1
  }
}

export class Test {
  testNumber?: string
  labels
  constructor(public branches: Branch[]) {
    this.branches = this.branches.filter((b) => !b.isEmpty)
    this.labels = this.branches
      .filter((b) => b instanceof Section)
      .filter((s) => !s.isEmpty)
      .map((s) => s.label)
  }

  get steps(): Step[] {
    return this.branches.filter((b) => b instanceof Step)
  }

  get last(): Step | undefined {
    return this.steps.at(-1)
  }

  get lastStrain(): Branch | undefined {
    // Find the last branch that has no forks after it
    const lastForking =
      this.branches.length -
      1 -
      this.branches
        .slice()
        .reverse()
        .findIndex((b) => b.successors.length > 1)
    if (lastForking === this.branches.length) return this.branches.at(0)
    return this.branches.at(lastForking + 1)
  }

  get name() {
    return `${[this.testNumber!, ...this.labels.map((x) => x.text)].join(
      ' - '
    )}`
  }

  toCode(cg: CodeGenerator) {
    cg.test(this)
  }

  toString() {
    return `+ ${this.name}:\n${this.steps
      .map((s) => `  - ${s.headToString()}`)
      .join('\n')}`
  }
  switch(j: number) {
    return new Test(this.branches.map((b) => b.switch(j)))
  }
}

export function makeGroups(tests: Test[]): (Test | TestGroup)[] {
  if (tests.length === 0) return []
  if (tests[0].labels.length === 0)
    return [tests[0], ...makeGroups(tests.slice(1))]
  const label = tests[0].labels[0]
  let count = tests.findIndex(
    (t) =>
      // using identity instead of text equality, which means identically named labels will not be grouped together
      t.labels[0] !== label
  )
  if (count === -1) count = tests.length
  if (count === 1) return [tests[0], ...makeGroups(tests.slice(1))]
  tests.slice(0, count).forEach((test) => test.labels.shift())
  return [
    new TestGroup(label, makeGroups(tests.slice(0, count))),
    ...makeGroups(tests.slice(count)),
  ]
}

export class TestGroup {
  constructor(public label: Label, public items: (Test | TestGroup)[]) {}
  toString() {
    return `+ ${this.label.text}:` + indent(this.items.join('\n'))
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
