import { When, Then } from '@cucumber/cucumber'
import { parseMarkdown } from './syntax'
import { Branch, Section, Step } from './model'
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
when(
  'empty lines',
  `

`
)
when('only a paragraph', `One can log in.`)
then('empty test design', new Section())

when('only a h1', `# Login form`)
then('one section', new Section('', [new Section('Login form', [], true)]))

when(
  'more h1s',
  `
# Login
# Logout
`
)
then(
  'forked sections',
  new Section('', [
    new Section('Login', [], true),
    new Section('Logout', [], true),
  ])
)

when(
  'only h2s',
  `
## Login
## Logout
`
)
when(
  'nested headings',
  `
# Login form
## Log in
`
)
then(
  'nested forked sections',
  new Section('', [
    new Section('Login form', [new Section('Log in', [], true)], true),
  ])
)

when(
  'deep nested headings',
  `
# Login form
## Log in
### Empty checks
### Email validation
## Log out
### Re-login
`
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
when(
  'only a bullet point',
  `
- log in
`
)
then('one step', new Section('', [new Step('log in', [], [], true)]))

when(
  'more bullet points',
  `
- log in
- log out
`
)
then(
  'forked steps',
  new Section('', [
    new Step('log in', [], [], true),
    new Step('log out', [], [], true),
  ])
)
when(
  'nested bullet points',
  `
- log in
  - create order
  - log out
- sign up
  - log out
`
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

when(
  'deep nested bullet points',
  `
- log in
  - create order
    - add product
    - remove product
  - log out
`)
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