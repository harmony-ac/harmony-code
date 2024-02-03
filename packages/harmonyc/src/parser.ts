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
} from 'typescript-parsec'
import { T, lexer } from './lexer'
import type { Branch } from './model'
import { Section, Step } from './model'

export function parse(input: string) {
  const tokens = lexer.parse(input)
  return expectSingleResult(expectEOF(TEST_DESIGN.parse(tokens)))
}

const PHRASE = rule<T, string>()
PHRASE.setPattern(apply(tok(T.Phrase), ({ text }) => text))

const STEP = rule<T, Branch>()
STEP.setPattern(
  apply(
    seq(PHRASE, rep_sc(kright(tok(T.ResponseMark), PHRASE))),
    ([action, responses]) => new Step(action, responses).setFork(true),
  ),
)
const SECTION = rule<T, Section>()
SECTION.setPattern(
  apply(tok(T.Label), ({ text }) => new Section(text.slice(0, -1))),
)
const BRANCH = rule<T, Branch>()
BRANCH.setPattern(alt_sc(STEP, SECTION))

const DENTS = rule<T, { dent: number; isFork: boolean }>()
DENTS.setPattern(
  apply(
    opt_sc(seq(rep_sc(tok(T.Dent)), alt_sc(tok(T.Seq), tok(T.Fork)))),
    (lineHead) => {
      if (!lineHead) return { dent: 0, isFork: true }
      const [dents, seqOrFork] = lineHead
      return { dent: dents.length + 1, isFork: seqOrFork.kind === T.Fork }
    },
  ),
)

const LINE = rule<T, { dent: number; branch: Branch }>()
LINE.setPattern(
  apply(seq(DENTS, BRANCH), ([{ dent, isFork }, branch], [start, end]) => ({
    dent,
    branch: branch.setFork(isFork),
  })),
)

const TEST_DESIGN = rule<T, Branch>()
TEST_DESIGN.setPattern(
  apply(rep_sc(LINE), (lines) => {
    const startDent = 0
    let dent = startDent
    const root = new Section()
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
