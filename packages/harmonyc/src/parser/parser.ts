import type { Parser, Token } from 'typescript-parsec'
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
  err,
  fail,
  nil,
  rep,
  alt,
} from 'typescript-parsec'
import { T, lexer } from './lexer.ts'
import type { Branch } from '../model/model.ts'
import {
  Action,
  Response,
  CodeLiteral,
  StringLiteral,
  Section,
  Step,
  Word,
  Label,
  ErrorResponse,
} from '../model/model.ts'

export function parse(input: string): Section
export function parse<T>(input: string, production: Parser<any, T>): T
export function parse<T>(
  input: string,
  production: Parser<any, T> = TEST_DESIGN as any
) {
  const tokens = lexer.parse(input)
  return expectSingleResult(expectEOF(production.parse(tokens)))
}

export const SPACES = rep_sc(tok(T.Space))
export const NEWLINES = list_sc(tok(T.Newline), SPACES) // empty lines can have spaces
export const WORDS = apply(
  tok(T.Words),
  ({ text }) => new Word(text.trimEnd().split(/\s+/).join(' '))
)
export const ERROR_MARK = apply(tok(T.ErrorMark), ({ text }) => new Word(text))
export const BULLET_POINT_LIKE_WORD = apply(
  alt_sc(tok(T.Plus), tok(T.Minus)),
  ({ text }) => new Word(text)
)
export const DOUBLE_QUOTE_STRING = alt_sc(
  apply(
    tok(T.DoubleQuoteString),
    ({ text }) => new StringLiteral(JSON.parse(text))
  ),
  seq(tok(T.UnclosedDoubleQuoteString), fail('unclosed double-quote string'))
) as Parser<T, StringLiteral>
export const BACKTICK_STRING = apply(
  tok(T.BacktickString),
  ({ text }) => new CodeLiteral(text.slice(1, -1))
)
export const DOCSTRING = apply(
  list_sc(tok(T.MultilineString), seq(tok(T.Newline), SPACES)),
  (lines) => lines.map(({ text }) => text.slice(2)).join('\n')
)

export const PART = alt_sc(
  WORDS,
  ERROR_MARK,
  BULLET_POINT_LIKE_WORD,
  DOUBLE_QUOTE_STRING,
  BACKTICK_STRING
)
export const PHRASE = seq(
  opt_sc(list_sc(PART, SPACES)),
  opt_sc(kright(opt_sc(NEWLINES), kright(SPACES, DOCSTRING)))
)
export const ACTION = apply(
  PHRASE,
  ([parts, docstring]) => new Action(parts, docstring)
)
export const RESPONSE = apply(PHRASE, ([parts, docstring]) => {
  if (parts?.[0] instanceof Word && parts[0].text === '!!') {
    return new ErrorResponse(parts.slice(1), docstring)
  }
  return new Response(parts, docstring)
})

export const ARROW = kmid(
  seq(opt_sc(NEWLINES), SPACES),
  tok(T.ResponseArrow),
  SPACES
)

export const RESPONSE_ITEM = kright(ARROW, RESPONSE)
export const STEP = apply(
  seq(ACTION, rep_sc(RESPONSE_ITEM)),
  ([action, responses]) => new Step(action, responses).setFork(true)
)

export const LABEL = apply(
  kleft(list_sc(PART, SPACES), seq(tok(T.Colon), SPACES)),
  (words) => new Label(words.map((w) => w.toString()).join(' '))
)

export const SECTION = apply(LABEL, (text) => new Section(text))
export const BRANCH = alt_sc(SECTION, STEP) // section first, to make sure there is no colon after step

export const DENTS = apply(
  opt_sc(seq(SPACES, alt_sc(tok(T.Plus), tok(T.Minus)), tok(T.Space))),
  (lineHead) => {
    if (!lineHead) return { dent: 0, isFork: true }
    const [dents, seqOrFork] = lineHead
    return { dent: dents.length / 2, isFork: seqOrFork.kind === T.Plus }
  }
)

export const LINE = apply(
  seq(DENTS, BRANCH),
  ([{ dent, isFork }, branch], [start, end]) => ({
    dent,
    branch: branch.setFork(isFork),
  })
)

export const TEST_DESIGN = kmid(
  rep_sc(NEWLINES),
  apply(
    list_sc(
      apply(LINE, (line, [start, end]) => ({ line, start, end })),
      NEWLINES
    ),
    (lines) => {
      const startDent = 0
      let dent = startDent
      const root = new Section(new Label(''))
      let parent: Branch = root

      for (const { line, start } of lines) {
        const { dent: d, branch } = line
        if (Math.round(d) !== d) {
          throw new Error(
            `invalid odd indent of ${d * 2} at line ${start!.pos.rowBegin}`
          )
        } else if (d > dent + 1) {
          throw new Error(`invalid indent ${d} at line ${start!.pos.rowBegin}`)
        } else if (d === dent + 1) {
          parent = parent.children[parent.children.length - 1]
          ++dent
        } else if (d < startDent) {
          throw new Error(`invalid indent ${d} at line ${start!.pos.rowBegin}`)
        } else
          while (d < dent) {
            parent = parent.parent!
            --dent
          }
        parent.addChild(branch)
      }

      return root
    }
  ),
  rep_sc(NEWLINES)
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
