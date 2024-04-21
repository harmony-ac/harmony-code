import { expect } from 'vitest'
import { Feature } from 'harmonyc/test'

Feature('js api', ({ Action, Response }) => {
  let n = 0
  Action('add {int}', async function (k: number) {
    n += k
  })
  Response('result is {float}', async function (k: number) {
    expect(n).toBe(k)
  })
})
