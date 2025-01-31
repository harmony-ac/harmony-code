import { writeFileSync } from 'fs'
import rules, { T } from '../../packages/harmonyc/src/parser/lexer_rules'

const names: { [k in T]: string | null } = {
  '+': 'keyword.control.fork',
  '-': 'keyword.sequence',
  ':': 'markup.heading.marker',
  '=>': 'keyword.control.response',
  '!!': 'keyword.control.error',
  '[': 'punctuation.section.embedded.state',
  ']': 'punctuation.section.embedded.state',
  'backtick string': 'constant.language',
  comment: 'comment.line',
  'double-quote string': 'string',
  'invalid empty backtick string': 'invalid.string.backtick.empty',
  'invalid multiline string mark': 'invalid.string.multiline',
  'invalid tab': 'invalid.whitespace.tab',
  'invalid whitespace': 'invalid.whitespace',
  'multiline string': 'string.unquoted',
  newline: null,
  space: null,
  'unclosed backtick string': 'invalid.string.backtick',
  'unclosed double-quote string': 'string',
  variable: 'variable.other.normal',
  'invalid empty variable': 'invalid.variable',
  'unclosed variable': 'invalid.variable',
  words: 'entity.name.function.call',
}
const patterns = Object.fromEntries(
  rules.flatMap(([, re, t]) =>
    names[t]
      ? [
          [
            t,
            {
              name: names[t] + '.harmony',
              match: re.source,
            },
          ],
        ]
      : []
  )
) as { [k in T]: any }

patterns[T.DoubleQuoteString] = {
  name: 'string.quoted.double.harmony',
  begin: '"',
  end: '"',
  patterns: [
    {
      name: 'constant.character.escape.harmony',
      match: /\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4})/.source,
    },
    {
      name: 'invalid.character.escape.harmony',
      match: /\\./.source,
    },
    {
      name: 'invalid.newline.escape.harmony',
      match: /\\\n/.source,
    },
    {
      name: 'variable.other.normal.harmony',
      match: /\$\{[^\n}]+\}/.source,
    },
    {
      name: 'invalid.variable.empty.harmony',
      match: /\$\{\}/.source,
    },
    {
      name: 'invalid.variable.unclosed.harmony',
      match: /\$\{[^}\n]*/.source,
    },
  ],
}
patterns[T.BacktickString] = {
  name: 'constant.language.code.harmony',
  begin: '`',
  end: '`',
  patterns: [
    {
      name: 'invalid.newline.escape.harmony',
      match: /\\\n/.source,
    },
    {
      name: 'variable.other.normal.harmony',
      match: /\$\{[^`}\n]+\}/.source,
    },
    {
      name: 'invalid.variable.empty.harmony',
      match: /\$\{\}/.source,
    },
    {
      name: 'invalid.variable.unclosed.harmony',
      match: /\$\{[^`}\n]*/.source,
    },
  ],
}

const tm = {
  $schema:
    'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
  name: 'Harmony',
  patterns: [
    { name: 'invalid.indent.harmony', match: /^(?:  )*[ ][+-].*?$/.source }, // odd number of spaces
    {
      name: 'invalid.line.harmony',
      match: /^(?:  )*(?![+-]( |$)|\/\/|=>|[#|])\S.*?$/.source,
    }, // odd number of spaces
    ...Object.values(patterns).filter((p) => p.name.startsWith('comment')),
    {
      match: /^\s*(?:([+] )|([-] ))(.*)(:)\s*$/.source,
      captures: {
        1: { name: 'keyword.control.fork.harmony' },
        2: { name: 'keyword.control.sequence.harmony' },
        3: { name: 'markup.heading.harmony' },
        4: { name: 'markup.heading.marker.harmony' },
      },
    },
    ...Object.values(patterns).filter((p) => !p.name.startsWith('comment')),
  ],
  scopeName: 'source.harmony',
}

writeFileSync(
  __dirname + '/../syntaxes/harmony.tmLanguage.json',
  JSON.stringify(tm, null, 2)
)
