import { Token, buildLexer } from 'typescript-parsec'

export enum T {
  Newline,
  EOF,
  Comment,
  Dent,
  Seq,
  Fork,
  State,
  Label,
  ResponseMark,
  Phrase,
  Space,
}

export const lexer = buildLexer([
  [false, /^\s*\n/g, T.Newline],
  [false, /^\s*$/g, T.EOF],
  [false, /^#.*?(?=\n|$)/g, T.Comment],
  [false, /^\/\/.*?(?=\n|$)/g, T.Comment],
  [true, /^ {2}/g, T.Dent],
  [true, /^- /g, T.Seq],
  [true, /^\+ /g, T.Fork],
  [true, /^\[\s*.*?\s*\]/g, T.State],
  [true, /^[^-+\s[][^\n[]*?\s*:(?=\s*(?:\n|$))/g, T.Label],
  [true, /^\s*=>\s*/g, T.ResponseMark],
  [true, /^[^-+\s[][^\n[]*?(?=\s*(?:\n|$|\[|=>))/g, T.Phrase],
])