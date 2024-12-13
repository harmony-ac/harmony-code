import { describe, expect, test } from 'vitest'
import { Action, Label, Section, Step, Word } from './model'
import { parse } from './parser'

function check(input: string, expected?: Section) {
  test(input, () => {
    const res = parse(input)
    if (expected) expect(res).toEqual(expected)
    else expect(res).toMatchSnapshot()
  })
}

check('', new Section())
check(
  'hello',
  new Section(new Label(), [
    new Step(new Action([new Word('hello')]), [], [], true),
  ])
)
check(
  `
> comment
hello
world`.trim(),
  new Section(new Label(), [
    new Step(new Action([new Word('hello')]), [], [], true),
    new Step(new Action([new Word('world')]), [], [], true),
  ])
)
check(
  `
happy:
# comment
- hello
- world`.trim(),
  new Section(new Label(), [
    new Section(
      new Label('happy'),
      [
        new Step(new Action([new Word('hello')]), [], [], false),
        new Step(new Action([new Word('world')]), [], [], false),
      ],
      true
    ),
  ])
)
check(
  `
happy:
+ hello
+ world`.trim(),
  new Section(new Label(), [
    new Section(
      new Label('happy'),
      [
        new Step(new Action([new Word('hello')]), [], [], true),
        new Step(new Action([new Word('world')]), [], [], true),
      ],
      true
    ),
  ])
)
check(
  `
happy:
+ hello:
  + world`.trim(),
  new Section('', [
    new Section(
      'happy',
      [new Section('hello', [new Step('world', [], [], true)], true)],
      true
    ),
  ])
)

check(
  `
hello
- wonderful
  - world`.trim(),
  new Section('', [
    new Step(
      'hello',
      [],
      [new Step('wonderful', [], [new Step('world', [], [], false)], false)],
      true
    ),
  ])
)

describe('section', () => {
  check(
    `
log in:
- enter username
- enter password`.trim()
  )
})

describe('response', () => {
  check(
    `
log in:
- enter username and password => success
`.trim()
  )
})
