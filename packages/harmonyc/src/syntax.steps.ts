import { When, Then } from '@cucumber/cucumber'
import { parseMarkdown } from './syntax'
import { Section, Step } from './model'
import { expect } from 'expect'

interface W {
  input: string
}
function when(phrase: string, input: string) {
  When<W>(`${phrase} || syntax`, function () {
    this.input = input
  })
}
function then(phrase: string, expected: unknown) {
  Then<W>(`${phrase} || syntax`, function () {
    const root = parseMarkdown(this.input)
    expect(root).toEqual(expected)
  })
}

when('empty', '')
then('empty test design', new Section())

then('one section', new Section('', [new Section('Login form', [], true)]))

then(
  'forked sections',
  new Section('', [
    new Section('Login', [], true),
    new Section('Logout', [], true),
  ])
)
then(
  'nested forked sections',
  new Section('', [
    new Section('Login form', [new Section('Log in', [], true)], true),
  ])
)
then(
  'deep nested forked sections',
  new Section('', [
    new Section(
      'Login form',
      [
        new Section(
          'Log in',
          [
            new Section('Empty checks', [], true),
            new Section('Email validation', [], true),
          ],
          true
        ),
        new Section('Log out', [new Section('Re-login', [], true)], true),
      ],
      true
    ),
  ])
)
then('one step', new Section('', [new Step('log in', [], [], true)]))
then(
  'forked steps',
  new Section('', [
    new Step('log in', [], [], true),
    new Step('log out', [], [], true),
  ])
)
then(
  'nested forked steps',
  new Section('', [
    new Step(
      'log in',
      [],
      [
        new Step('create order', [], [], true),
        new Step('log out', [], [], true),
      ],
      true
    ),
    new Step('sign up', [], [new Step('log out', [], [], true)], true),
  ])
)

then(
  'one step, not forked',
  new Section('', [new Step('log in', [], [], false)])
)
then(
  'sequential steps',
  new Section('', [
    new Step('log in', [], [], false),
    new Step('log out', [], [], false),
  ])
)
then(
  'nested sequences and forks',
  new Section('', [
    new Step(
      'log in',
      [],
      [
        new Step(
          'create order',
          [],
          [new Step('pay', [], [], true), new Step('clear cart', [], [], true)],
          false
        ),
        new Step('log out', [], [], false),
      ],
      true
    ),
  ])
)

then(
  'bulleted items are forks, numbered items not',
  new Section('', [
    new Step('log in', [], [], true),
    new Step('create order', [], [], false),
    new Step('pay', [], [], false),
    new Step('log out', [], [], true),
    new Step('log in', [], [], false),
    new Step('log out', [], [], false),
  ])
)

when(
  'deep nested bullet points',
  `
- log in
  - create order
    - add product
    - remove product
  - log out
`
)
then(
  'deep nested forked steps',
  new Section('', [
    new Step(
      'log in',
      [],
      [
        new Step(
          'create order',
          [],
          [
            new Step('add product', [], [], true),
            new Step('remove product', [], [], true),
          ],
          true
        ),
        new Step('log out', [], [], true),
      ],
      true
    ),
  ])
)

when(
  'only response',
  `
- => logged out
`
)
then(
  'step with one response',
  new Section('', [new Step('', ['logged out'], [], true)])
)

when(
  'action and response',
  `
- log out => logged out
`
)
then(
  'step with action and response',
  new Section('', [new Step('log out', ['logged out'], [], true)])
)
when(
  'more responses',
  `
- log out => logged out => on home page
`
)
then(
  'step with more responses',
  new Section('', [
    new Step('log out', ['logged out', 'on home page'], [], true),
  ])
)
when(
  'heading in list item',
  `
- ### Login form
`
)

when(
  'headings in bulleted items',
  `
- ### Login
- ### Logout
`
)

When('there is/are {} || syntax', function (_what, docstring) {
  if (typeof docstring === 'function') throw new Error('missing docstring')
  this.input = docstring
})
then(
  'action with docstring',
  new Section('', [new Step('action', [], [], true, '', 'Docstring')])
)
