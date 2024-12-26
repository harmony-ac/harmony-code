import { Token, buildLexer } from 'typescript-parsec'
import rules from './lexer_rules.js'


export const lexer = buildLexer(rules)
