import { Token, buildLexer } from 'typescript-parsec'

export enum T {
  Newline = 'Newline',
  EOF = 'EOF',
  Comment = 'Comment',
  /** indentation unit */
  Dent = 'Dent',
  /** sequence item */
  Seq = 'Seq',
  /** fork branch */
  Fork = 'Fork',
  /** state declaration or precondition */
  State = 'State',
  Label = 'Label',
  /** the => */
  ResponseArrow = 'ResponseArrow',
  PhraseText = 'Phrase',
  Space = 'Space',
  DoubleQuoteString = 'DoubleQuoteString',
  BacktickString = 'BacktickString',
}

export const lexer = buildLexer([
  // false = ignore token
  // if multiple patterns match, the longest one wins
  // patterns must start with ^ and be /g
  [false, /^\s*\n/g, T.Newline],
  [false, /^\s*$/g, T.EOF],
  [false, /^#.*?(?=\n|$)/g, T.Comment],
  [false, /^>.*?(?=\n|$)/g, T.Comment],
  [false, /^\/\/.*?(?=\n|$)/g, T.Comment],
  [true, /^ {2}/g, T.Dent],
  [true, /^- /g, T.Seq],
  [true, /^\+ /g, T.Fork],
  [true, /^\[\s*.*?\s*\]/g, T.State],
  [true, /^[^-+\s[][^\n[]*?\s*:(?=\s*(?:\n|$))/g, T.Label],
  [true, /^\s*=>\s*/g, T.ResponseArrow],
  [true, /^[^-+\s["`][^\n["`]*?(?=\s*(?:\n|$|\[|=>|"|`))/g, T.PhraseText],
  [
    true,
    /^(")[^"]*?\1/g, // JSON string
    T.DoubleQuoteString,
  ],
  [true, /^(`)[^`]+?\1/g, T.BacktickString], // empty backtick string is not allowed
])
