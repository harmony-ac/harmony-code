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
  // if multiple patterns match, the longest one wins, if same length, the former
  // patterns must be y (sticky)
  [true, /\n/y, T.Newline],
  [true, /\t/y, T.InvalidTab],
  [true, /[\x00-\x1f]/y, T.InvalidWhitespace],
  [true, /^[ ]*[+] /my, T.Plus],
  [true, /^[ ]*[-] /my, T.Minus],
  [true, / /y, T.Space],
  [false, /(#|>|\/\/).*?(?=\n|$)/y, T.Comment],
  [true, /:(?=\s*(?:\n|$))/y, T.Colon],
  [true, /\[/y, T.OpeningBracket],
  [true, /\]/y, T.ClosingBracket],
  [true, /!!/y, T.ErrorMark],
  [true, /=>/y, T.ResponseArrow],
  [
    true,
    /"(?:[^"\\\n]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/y,
    T.DoubleQuoteString,
  ],
  [
    true,
    /"(?:[^"\\\n]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*/y,
    T.UnclosedDoubleQuoteString,
  ],
  [true, /``/y, T.InvalidEmptyBacktickString],
  [true, /`[^`]+`/y, T.BacktickString],
  [true, /`[^`]*/y, T.UnclosedBacktickString],
  [true, /\|(?: .*|(?=\n|$))/y, T.MultilineString],
  [true, /\|[^ \n]/y, T.InvalidMultilineStringMark],
  [true, /.+?(?=[\[\]"`|]|$|=>|!!|:\s*$)/my, T.Words],
]

export default rules
