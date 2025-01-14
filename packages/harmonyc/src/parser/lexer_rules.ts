export enum T {
  Newline = 'newline',
  Comment = 'comment',
  /** the => */
  ResponseArrow = '=>',
  ErrorMark = '!!',
  Words = 'words',
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

const rules: [boolean, RegExp, T][] = [
  // false = ignore token
  // if multiple patterns match, the longest one wins, if same, the former
  // patterns must start with ^ and be /g
  [true, /^\n/g, T.Newline],
  [true, /^\t/g, T.InvalidTab],
  [true, /^[\x00-\x1f]/g, T.InvalidWhitespace],
  [true, /^ /g, T.Space],
  [false, /^(#|>|\/\/).*?(?=\n|$)/g, T.Comment],
  [true, /^:(?=\s*(?:\n|$))/g, T.Colon],
  [
    true,
    /^(?!\s|=>|!!|- |\+ |[\[\]"`|]|:\s*(?:\n|$)).+?(?=[\[\]"`|]|\n|$|=>|!!|:\s*(?:\n|$)|$)/g,
    T.Words,
  ],
  [true, /^-/g, T.Minus],
  [true, /^\+/g, T.Plus],
  [true, /^\[/g, T.OpeningBracket],
  [true, /^\]/g, T.ClosingBracket],
  [true, /^!!/g, T.ErrorMark],
  [true, /^=>/g, T.ResponseArrow],
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
  [true, /^\|(?: .*|(?=\n|$))/g, T.MultilineString],
  [true, /^\|[^ \n]/g, T.InvalidMultilineStringMark],
]

export default rules
