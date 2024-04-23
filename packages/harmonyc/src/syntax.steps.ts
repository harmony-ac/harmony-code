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

//# sourceMappingURL=data:application/json,%7B%22version%22%3A3%2C%22sources%22%3A%5B%5D%2C%22names%22%3A%5B%5D%2C%22mappings%22%3A%22%22%7D
