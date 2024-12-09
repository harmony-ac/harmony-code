import { describe, expect, test } from 'vitest'
import { Section, Step } from './model'
import { parse } from './parser'

function check(input: string, expected?: Section) {
  test(input, () => {
    const res = parse(input)
    if (expected) expect(res).toEqual(expected)
    else expect(res).toMatchSnapshot()
  })
}

check('', new Section(''))
check('hello', new Section('', [new Step('hello', [], [], true)]))
check(
  `
> comment
hello
world`.trim(),
  new Section('', [
    new Step('hello', [], [], true),
    new Step('world', [], [], true),
  ])
)
check(
  `
happy:
# comment
- hello
- world`.trim(),
  new Section('', [
    new Section(
      'happy',
      [new Step('hello', [], [], false), new Step('world', [], [], false)],
      true
    ),
  ])
)
check(
  `
happy:
+ hello
+ world`.trim(),
  new Section('', [
    new Section(
      'happy',
      [new Step('hello', [], [], true), new Step('world', [], [], true)],
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
