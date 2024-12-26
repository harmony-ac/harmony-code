import { writeFileSync } from 'fs'
import rules, { T } from '../../packages/harmonyc/src/parser/lexer_rules'

const names: { [k in T]: string | null } = {
  '+': 'keyword.operator.wordlike.fork',
  '-': 'keyword.operator.wordlike.sequence',
  ':': 'markup.heading.marker',
  '=>': 'keyword.operator.wordlike.response',
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
  word: 'source.word',
}

const tm = {
  $schema:
    'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
  name: 'Harmony',
  patterns: [
    ...rules.flatMap(([, re, t]) =>
      names[t]
        ? [
            {
              name: names[t] + '.harmony',
              match: re.source.replace(/^\^/, ''),
            },
          ]
        : []
    ),
  ],
  scopeName: 'source.harmony',
}

writeFileSync(
  __dirname + '/../syntaxes/harmony.tmLanguage.json',
  JSON.stringify(tm, null, 2)
)
