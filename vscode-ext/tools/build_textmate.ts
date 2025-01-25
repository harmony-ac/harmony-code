import { writeFileSync } from 'fs'
import rules, { T } from '../../packages/harmonyc/src/parser/lexer_rules'

const names: { [k in T]: string | null } = {
  '+': 'keyword.fork',
  '-': 'keyword.sequence',
  ':': 'markup.heading.marker',
  '=>': 'keyword.response',
  '!!': 'keyword.error',
  '[': 'punctuation.section.embedded.state',
  ']': 'punctuation.section.embedded.state',
  'backtick string': 'constant.numeric.code',
  comment: 'comment',
  'double-quote string': 'string',
  'invalid empty backtick string': 'invalid.string.backtick.empty',
  'invalid multiline string mark': 'invalid.string.multiline',
  'invalid tab': 'invalid.whitespace.tab',
  'invalid whitespace': 'invalid.whitespace',
  'multiline string': 'string',
  newline: null,
  space: null,
  'unclosed backtick string': 'constant.numeric.code',
  'unclosed double-quote string': 'string',
  words: 'source.word',
}
const patterns = rules.flatMap(([, re, t]) =>
  names[t]
    ? [
        {
          name: names[t] + '.harmony',
          match: re.source,
        },
      ]
    : []
)

const tm = {
  $schema:
    'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
  name: 'Harmony',
  patterns: [
    { name: 'invalid.indent.harmony', match: /^(?:  )*[ ][+-].*?$/.source },
    ...patterns.filter((p) => p.name.startsWith('comment')),
    {
      match: /^\s*(?:([+] )|([-] ))(.*)(:)\s*$/.source,
      captures: {
        1: { name: 'keyword.fork.harmony' },
        2: { name: 'keyword.sequence.harmony' },
        3: { name: 'markup.heading.harmony' },
        4: { name: 'markup.heading.marker.harmony' },
      },
    },
    ...patterns.filter((p) => !p.name.startsWith('comment')),
  ],
  scopeName: 'source.harmony',
}

writeFileSync(
  __dirname + '/../syntaxes/harmony.tmLanguage.json',
  JSON.stringify(tm, null, 2)
)
