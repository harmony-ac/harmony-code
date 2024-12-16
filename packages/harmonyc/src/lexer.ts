import { Token, buildLexer } from 'typescript-parsec'

export enum T {
  Newline = 'newline',
  Comment = 'comment',
  /** the => */
  ResponseArrow = '=>',
  Word = 'word',
  Minus = '-',
  Plus = '+',
  Colon = ':',
  Space = 'space',
  OpeningBracket = '[',
  ClosingBracket = ']',
  DoubleQuoteString = 'double-quote string',
  UnclosedDoubleQuoteString = 'unclosed double-quote string',
  BacktickString = 'backtick string',
  UnclosedBacktickString = 'unclosed backtick string',
  InvalidEmptyBacktickString = 'invalid empty backtick string',
  InvalidWhitespace = 'invalid whitespace',
  InvalidTab = 'invalid tab',
  MultilineString = 'multiline string',
  InvalidMultilineStringMark = 'invalid multiline string mark',
}

export const lexer = buildLexer([
  // false = ignore token
  // if multiple patterns match, the longest one wins, if same, the former
  // patterns must start with ^ and be /g
  [true, /^\n/g, T.Newline],
  [true, /^\t/g, T.InvalidTab],
  [true, /^[\x00-\x1f]/g, T.InvalidWhitespace],
  [true, /^ /g, T.Space],
  [true, /^-/g, T.Minus],
  [true, /^\+/g, T.Plus],
  [true, /^:/g, T.Colon],
  [true, /^\[/g, T.OpeningBracket],
  [true, /^\]/g, T.ClosingBracket],
  [true, /^=>/g, T.ResponseArrow],
  [false, /^(#|>|\/\/).*?(?=\n|$)/g, T.Comment],
  [
    true,
    /^"(?:[^"\\\n]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/g,
    T.DoubleQuoteString,
  ],
  [
    true,
    /^"(?:[^"\\\n]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*/g,
    T.UnclosedDoubleQuoteString,
  ],
  [true, /^``/g, T.InvalidEmptyBacktickString],
  [true, /^`[^`]+`/g, T.BacktickString],
  [true, /^`[^`]*/g, T.UnclosedBacktickString],
  [true, /^(?!=>)[^\s[\]"`:|]+?(?=[\s[\]"`:|]|=>|$)/g, T.Word],
  [true, /^\|(?: .*)?/g, T.MultilineString],
  [true, /^\|[^ ]/g, T.InvalidMultilineStringMark],
])
