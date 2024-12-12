import { describe, expect, test } from 'vitest'
import { T, lexer } from './lexer'
import { Token } from 'typescript-parsec'
import exp from 'constants'

function lex(input: string) {
  let list: Token<T> | undefined = lexer.parse(input)
  const arr: string[] = []
  while (list) {
    arr.push(list.kind)
    list = list.next
  }
  return arr.join(',')
}

test('empty', () => {
  expect(lex('')).toEqual('')
})
test('space', () => {
  expect(lex('   ')).toEqual('space,space,space')
})

test('comment', () => {
  expect(lex('#hello')).toEqual('')
  expect(lex('// hello')).toEqual('')
  expect(lex('> hello')).toEqual('')
})

test('response mark', () => {
  expect(lex('=>')).toBe('=>')
})
test('[', () => {
  expect(lex('[')).toBe('[')
})

test('text', () => {
  expect(lex('hello')).toBe('word')
  expect(lex('hello world')).toBe('word,space,word')
})

test('text with space after', () => {
  expect(lex('hello ')).toBe('word,space')
})

test('text with => after', () => {
  expect(lex('hello=>')).toBe('word')
  expect(lex('hello =>')).toBe('word,space,=>')
})
test('soft break before =>', () => {
  expect(lex('hello\n=>')).toBe('word,newline,=>')
})

test('newline', () => {
  expect(lex('\n')).toBe('newline')
  expect(lex('\n\n')).toBe('newline,newline')
  expect(lex('hello\nworld')).toBe('word,newline,word')
})

describe('seq and fork', () => {
  test('seq', () => {
    expect(lex('- hello')).toBe('-,space,word')
  })
  test('fork', () => {
    expect(lex('+ hello')).toBe('+,space,word')
  })
})

describe('dent', () => {
  test('single dent', () => {
    expect(lex('  [x ] ')).toBe('space,space,[,word,space,],space')
  })
  test('multiple dent', () => {
    expect(lex('    + ')).toBe('space,space,space,space,+,space')
  })
  test('dent with seq', () => {
    expect(lex('  - ')).toBe('space,space,-,space')
  })
  test('dent with seq and PhraseText', () => {
    expect(lex('  - hi')).toBe('space,space,-,space,word')
  })
  test('dent with fork and PhraseText', () => {
    expect(lex('  + hi')).toBe('space,space,+,space,word')
  })
})

describe('state', () => {
  test('state', () => {
    expect(lex('[x]')).toBe('[,word,]')
  })
  test('state with space', () => {
    expect(lex('[ x ]')).toBe('[,space,word,space,]')
  })
})

describe('colon', () => {
  test('colon', () => {
    expect(lex('hello:')).toBe('word,:')
  })
})

describe('double-quote string', () => {
  test('unclosed', () => {
    expect(() => lex('"')).toThrow()
    expect(() => lex('" ')).toThrow()
    expect(() => lex('":')).toThrow()
    expect(() => lex('"hello')).toThrow()
    expect(() => lex('"hello, world')).toThrow()
  })
  test('empty', () => {
    expect(lex('""')).toBe('double-quote string')
  })
  test('simple', () => {
    expect(lex('"hello"')).toBe('double-quote string')
  })
})

describe('backtick string', () => {
  test('unclosed', () => {
    expect(() => lex('`')).toThrow()
    expect(() => lex('` ')).toThrow()
    expect(() => lex('`:')).toThrow()
    expect(() => lex('`hello')).toThrow()
    expect(() => lex('`hello, world')).toThrow()
  })
  test('empty', () => {
    expect(lex('``')).toBe('invalid empty backtick string')
  })
  test('simple', () => {
    expect(lex('`hello`')).toBe('backtick string')
    expect(lex('a`hello`')).toBe('word,backtick string')
  })
})
