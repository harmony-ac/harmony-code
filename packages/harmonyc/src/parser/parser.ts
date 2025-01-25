import type { Parser, Token } from 'typescript-parsec'
import {
  alt_sc,
  apply,
  expectEOF,
  expectSingleResult,
  kright,
  opt_sc,
  rep_sc,
  seq,
  tok,
  list_sc,
  kleft,
  kmid,
  fail,
  nil,
  rep_n,
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
  Docstring,
  Word,
  Label,
  ErrorResponse,
  SaveToVariable,
  SetVariable,
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

export const NEWLINES = list_sc(tok(T.Newline), nil()),
  WORDS = apply(
    tok(T.Words),
    ({ text }) => new Word(text.trimEnd().split(/\s+/).join(' '))
  ),
  DOUBLE_QUOTE_STRING = alt_sc(
    apply(
      tok(T.DoubleQuoteString),
      ({ text }) => new StringLiteral(JSON.parse(text))
    ),
    seq(tok(T.UnclosedDoubleQuoteString), fail('unclosed double-quote string'))
  ) as Parser<T, StringLiteral>,
  BACKTICK_STRING = apply(
    tok(T.BacktickString),
    ({ text }) => new CodeLiteral(text.slice(1, -1))
  ),
  DOCSTRING = kright(
    opt_sc(NEWLINES),
    apply(
      list_sc(tok(T.MultilineString), tok(T.Newline)),
      (lines) =>
        new Docstring(lines.map(({ text }) => text.slice(2)).join('\n'))
    )
  ),
  ERROR_MARK = tok(T.ErrorMark),
  VARIABLE = apply(tok(T.Variable), ({ text }) => text.slice(2, -1)),
  PART = alt_sc(WORDS, DOUBLE_QUOTE_STRING, BACKTICK_STRING, DOCSTRING),
  PHRASE = rep_sc(PART),
  ARG = alt_sc(DOUBLE_QUOTE_STRING, BACKTICK_STRING, DOCSTRING),
  SET_VARIABLE = apply(
    seq(VARIABLE, ARG),
    ([variable, value]) => new SetVariable(variable, value)
  ),
  ACTION = alt(
    apply(PHRASE, (parts) => new Action(parts)),
    SET_VARIABLE
  ),
  RESPONSE = apply(PHRASE, (parts) => new Response(parts)),
  ERROR_RESPONSE = apply(
    seq(ERROR_MARK, opt_sc(alt_sc(DOUBLE_QUOTE_STRING, DOCSTRING))),
    ([, parts]) => new ErrorResponse(parts)
  ),
  SAVE_TO_VARIABLE = apply(
    VARIABLE,
    (variable) => new SaveToVariable(variable)
  ),
  ARROW = kright(opt_sc(NEWLINES), tok(T.ResponseArrow)),
  RESPONSE_ITEM = kright(
    ARROW,
    alt(RESPONSE, ERROR_RESPONSE, SAVE_TO_VARIABLE)
  ),
  STEP = apply(seq(ACTION, rep_sc(RESPONSE_ITEM)), ([action, responses]) =>
    new Step(action, responses).setFork(true)
  ),
  LABEL = apply(
    kleft(list_sc(PART, nil()), tok(T.Colon)),
    (words) => new Label(words.map((w) => w.toString()).join(' '))
  ),
  SECTION = apply(LABEL, (text) => new Section(text)),
  BRANCH = alt_sc(SECTION, STEP), // section first, to make sure there is no colon after step
  DENTS = apply(alt_sc(tok(T.Plus), tok(T.Minus)), (seqOrFork) => {
    return {
      dent: (seqOrFork.text.length - 2) / 2,
      isFork: seqOrFork.kind === T.Plus,
    }
  }),
  LINE = apply(
    seq(DENTS, BRANCH),
    ([{ dent, isFork }, branch], [start, end]) => ({
      dent,
      branch: branch.setFork(isFork),
    })
  ),
  TEST_DESIGN = kmid(
    rep_sc(NEWLINES),
    apply(
      opt_sc(
        list_sc(
          apply(LINE, (line, [start, end]) => ({ line, start, end })),
          NEWLINES
        )
      ),
      (lines) => {
        const startDent = 0
        let dent = startDent
        const root = new Section(new Label(''))
        let parent: Branch = root

        for (const { line, start } of lines ?? []) {
          const { dent: d, branch } = line
          if (Math.round(d) !== d) {
            throw new Error(
              `invalid odd indent of ${d * 2} at line ${start!.pos.rowBegin}`
            )
          } else if (d > dent + 1) {
            throw new Error(
              `invalid indent ${d} at line ${start!.pos.rowBegin}`
            )
          } else if (d === dent + 1) {
            parent = parent.children[parent.children.length - 1]
            ++dent
          } else if (d < startDent) {
            throw new Error(
              `invalid indent ${d} at line ${start!.pos.rowBegin}`
            )
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
