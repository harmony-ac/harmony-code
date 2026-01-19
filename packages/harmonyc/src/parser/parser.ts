import type { Parser, ParserOutput, Token } from 'typescript-parsec'
import {
  alt_sc,
  apply,
  expectEOF,
  expectSingleResult,
  fail,
  kleft,
  kmid,
  kright,
  list_sc,
  nil,
  opt_sc,
  rep_sc,
  seq,
  tok,
  unableToConsumeToken,
} from 'typescript-parsec'
import type { Branch } from '../model/model.ts'
import {
  Action,
  CodeLiteral,
  Docstring,
  ErrorResponse,
  Label,
  Response,
  SaveToVariable,
  Section,
  SetVariable,
  Step,
  StringLiteral,
  Switch,
  Word,
} from '../model/model.ts'
import { T, lexer } from './lexer.ts'

export function parse(input: string): Section
export function parse<T>(input: string, production: Parser<any, T>): T
export function parse<T>(
  input: string,
  production: Parser<any, T> = TEST_DESIGN as any,
) {
  const tokens = lexer.parse(input)
  return expectSingleResult(expectEOF(production.parse(tokens)))
}

function anythingBut(kind: T) {
  return {
    parse(token: Token<T> | undefined): ParserOutput<T, Token<T>> {
      if (token === undefined)
        return { successful: false, error: unableToConsumeToken(token) }
      if (token.kind === kind)
        return { successful: false, error: unableToConsumeToken(token) }
      return {
        candidates: [
          {
            firstToken: token,
            nextToken: token.next,
            result: token,
          },
        ],
        successful: true,
        error: undefined,
      }
    },
  }
}

export const NEWLINES = list_sc(tok(T.Newline), nil()),
  WORDS = apply(
    tok(T.Words),
    ({ text }) => new Word(text.trimEnd().split(/\s+/).join(' ')),
  ),
  DOUBLE_QUOTE_STRING = alt_sc(
    apply(
      tok(T.DoubleQuoteString),
      ({ text }) => new StringLiteral(JSON.parse(text)),
    ),
    seq(tok(T.UnclosedDoubleQuoteString), fail('unclosed double-quote string')),
  ) as Parser<T, StringLiteral>,
  BACKTICK_STRING = apply(
    tok(T.BacktickString),
    ({ text }) => new CodeLiteral(text.slice(1, -1)),
  ),
  DOCSTRING = kright(
    opt_sc(NEWLINES),
    apply(
      list_sc(tok(T.MultilineString), tok(T.Newline)),
      (lines) =>
        new Docstring(lines.map(({ text }) => text.slice(2)).join('\n')),
    ),
  ),
  ERROR_MARK = tok(T.ErrorMark),
  VARIABLE = apply(tok(T.Variable), ({ text }) => text.slice(2, -1)),
  SIMPLE_PART = alt_sc(WORDS, DOUBLE_QUOTE_STRING, BACKTICK_STRING, DOCSTRING),
  //REPEATER = apply(
  //list_sc(rep_sc(SIMPLE_PART), tok(T.And)),
  //(cs) => new Repeater(cs)
  //),
  SWITCH = apply(
    list_sc(SIMPLE_PART, tok(T.Semicolon)),
    (cs) => new Switch(cs),
  ),
  BRACES = kmid(tok(T.OpeningBrace), SWITCH, tok(T.ClosingBrace)),
  PART = alt_sc(SIMPLE_PART, BRACES),
  PHRASE = rep_sc(PART),
  ARG = alt_sc(DOUBLE_QUOTE_STRING, BACKTICK_STRING, DOCSTRING),
  SET_VARIABLE = apply(
    seq(VARIABLE, ARG),
    ([variable, value]) => new SetVariable(variable, value),
  ),
  ACTION = alt_sc(
    SET_VARIABLE,
    apply(PHRASE, (parts, range) => new Action(parts).at(range)),
  ),
  RESPONSE = apply(seq(PHRASE, opt_sc(VARIABLE)), ([parts, variable], range) =>
    new Response(
      parts,
      variable !== undefined ? new SaveToVariable(variable) : undefined,
    ).at(range),
  ),
  ERROR_RESPONSE = apply(
    seq(ERROR_MARK, opt_sc(alt_sc(DOUBLE_QUOTE_STRING, DOCSTRING))),
    ([, parts]) => new ErrorResponse(parts),
  ),
  SAVE_TO_VARIABLE = apply(
    VARIABLE,
    (variable) => new Response([], new SaveToVariable(variable)),
  ),
  ARROW = kright(opt_sc(NEWLINES), tok(T.ResponseArrow)),
  RESPONSE_ITEM = kright(
    ARROW,
    alt_sc(SAVE_TO_VARIABLE, ERROR_RESPONSE, RESPONSE),
  ),
  STEP = apply(seq(ACTION, rep_sc(RESPONSE_ITEM)), ([action, responses]) =>
    new Step(action, responses).setFork(true),
  ),
  LABEL = apply(kleft(list_sc(PART, nil()), tok(T.Colon)), (words, range) =>
    new Label(words.map((w) => w.toString()).join(' ')).at(range),
  ),
  SECTION = apply(LABEL, (text) => new Section(text)),
  BRANCH = apply(alt_sc(SECTION, STEP), (branch, range) => branch.at(range)), // section first, to make sure there is no colon after step
  DENTS = apply(alt_sc(tok(T.Plus), tok(T.Minus)), (seqOrFork) => {
    return {
      dent: (seqOrFork.text.trimEnd().length - 1) / 2,
      isFork: seqOrFork.kind === T.Plus,
    }
  }),
  NODE = apply(
    seq(DENTS, BRANCH),
    ([{ dent, isFork }, branch], [start, end]) => ({
      dent,
      branch: branch.setFork(isFork),
    }),
  ),
  ANYTHING_BUT_NEWLINE = anythingBut(T.Newline),
  TEXT = apply(
    seq(tok(T.Words), rep_sc(ANYTHING_BUT_NEWLINE)),
    () => undefined,
  ),
  LINE = alt_sc(NODE, TEXT),
  TEST_DESIGN = kmid(
    rep_sc(NEWLINES),
    apply(
      opt_sc(
        list_sc(
          apply(LINE, (line, [start, end]) => ({ line, start, end })),
          NEWLINES,
        ),
      ),
      (lines, range) => {
        let dent: number | undefined
        const root = new Section(new Label(''))
        let parent: Branch = root

        for (const { line, start } of lines ?? []) {
          if (line === undefined) continue
          const { dent: d, branch } = line
          if (dent === undefined) {
            if (d !== 0)
              throw new Error(
                `invalid indent ${d} at line ${
                  start!.pos.rowBegin
                }: first step must not be indented`,
              )
            dent = 0
          } else if (Math.round(d) !== d) {
            throw new Error(
              `invalid odd indent of ${d * 2} at line ${start!.pos.rowBegin}`,
            )
          } else if (d > dent + 1) {
            throw new Error(
              `invalid indent ${d} at line ${start!.pos.rowBegin}`,
            )
          } else if (d === dent + 1) {
            parent = parent.children[parent.children.length - 1]
            ++dent
          } else
            while (d < dent) {
              parent = parent.parent!
              --dent
            }
          parent.addChild(branch)
        }

        return root.at(range)
      },
    ),
    rep_sc(NEWLINES),
  )
