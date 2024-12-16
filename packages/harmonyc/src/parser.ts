import type { Token } from 'typescript-parsec'
import {
  alt_sc,
  apply,
  expectEOF,
  expectSingleResult,
  kright,
  opt_sc,
  rep_sc,
  rule,
  seq,
  tok,
  list_sc,
  kleft,
  kmid,
} from 'typescript-parsec'
import { T, lexer } from './lexer'
import type { Branch } from './model'
import {
  Action,
  Response,
  CodeLiteral,
  StringLiteral,
  Section,
  Step,
  Word,
  Label,
} from './model'

export function parse(input: string) {
  const tokens = lexer.parse(input)
  return expectSingleResult(expectEOF(TEST_DESIGN.parse(tokens)))
}

const NEWLINE = tok(T.Newline)
const SPACE = tok(T.Space)
const WORD = apply(tok(T.Word), ({ text }) => new Word(text))
const DOUBLE_QUOTE_STRING = apply(
  tok(T.DoubleQuoteString),
  ({ text }) => new StringLiteral(JSON.parse(text))
)
const BACKTICK_STRING = apply(
  tok(T.BacktickString),
  ({ text }) => new CodeLiteral(text.slice(1, -1))
)
const PART = alt_sc(WORD, DOUBLE_QUOTE_STRING, BACKTICK_STRING)
const PHRASE = list_sc(PART, rep_sc(SPACE))
const ACTION = apply(PHRASE, (parts) => new Action(parts))
const RESPONSE = apply(PHRASE, (parts) => new Response(parts))
const ARROW = kmid(
  rep_sc(alt_sc(SPACE, NEWLINE)),
  tok(T.ResponseArrow),
  rep_sc(SPACE)
)

const STEP = apply(
  seq(ACTION, rep_sc(kright(ARROW, RESPONSE))),
  ([action, responses]) => new Step(action, responses).setFork(true)
)

const LABEL = apply(
  kleft(list_sc(PART, rep_sc(SPACE)), tok(T.Colon)),
  (words) => new Label(words.map((w) => w.toString()).join(' '))
)

const SECTION = apply(LABEL, (text) => new Section(text))
const BRANCH = alt_sc(SECTION, STEP) // section first, to make sure there is no colon after step

const DENTS = apply(
  opt_sc(seq(rep_sc(SPACE), alt_sc(tok(T.Plus), tok(T.Minus)), SPACE)),
  (lineHead) => {
    if (!lineHead) return { dent: 0, isFork: true }
    const [dents, seqOrFork] = lineHead
    return { dent: dents.length / 2, isFork: seqOrFork.kind === T.Plus }
  }
)

const LINE = apply(
  seq(DENTS, BRANCH),
  ([{ dent, isFork }, branch], [start, end]) => ({
    dent,
    branch: branch.setFork(isFork),
  })
)

const TEST_DESIGN = kmid(
  rep_sc(NEWLINE),
  apply(list_sc(LINE, rep_sc(NEWLINE)), (lines) => {
    const startDent = 0
    let dent = startDent
    const root = new Section(new Label(''))
    let parent: Branch = root

    let lineNo = 0
    for (const { dent: d, branch } of lines) {
      ++lineNo
      if (d > dent + 1) {
        throw new Error(`invalid indent ${d} at line ${lineNo}`)
      } else if (d === dent + 1) {
        parent = parent.children[parent.children.length - 1]
        ++dent
      } else if (d < startDent) {
        throw new Error(`invalid indent at line ${lineNo}`)
      } else
        while (d < dent) {
          parent = parent.parent!
          --dent
        }
      parent.addChild(branch)
    }

    return root
  }),
  rep_sc(NEWLINE)
)

function inputText(start: Token<T>, end: Token<T> | undefined) {
  let text = ''
  let t: Token<T> | undefined = start
  while (t && t !== end) {
    text += t.text
    t = t.next
  }
  return text
}
