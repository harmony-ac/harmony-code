import { Feature } from 'harmonyc/test'
import { parse } from './syntax.ts'
import { expect } from 'vitest'

Feature('Syntax', ({ Action, Response }) => {
  let src: string
  Action('empty', () => {
    src = ''
  })
  Action('there is/are {}', (_what, docstring) => {
    src = docstring
  })
  Response('{}', (name: string) => {
    expect(parse({ src, fileName: 'test' }).root.children).toMatchSnapshot(name)
  })
})
