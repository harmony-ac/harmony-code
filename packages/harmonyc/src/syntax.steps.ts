import { When, Then } from '@cucumber/cucumber'
import { parseMarkdown } from './syntax'
import { Branch, Section } from './model'
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
when(
  'empty lines',
  `

`
)
when('only a h1', `# Login form`)
when('only a paragraph', `One can log in.`)
when(
  'some headings',
  `
# Login form
## Log in
## Log out
`
)
when(
  'only a bullet point',
  `
- log in
`
)