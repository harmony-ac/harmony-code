# js api

Example

```js
import { Action } from 'harmonyc/test'
import { adder } from './adder'
import { test, expect } from 'vitest'

test('it can add numbers', () => {
  await Action('add 2')
  await Response('result is 2')
  await Action('add 4')
  await Response('result is 6')
})

Action('add {int}', (n) => {
  adder.add(n)
})

Response('result is {int}', (n) => {
  expect(adder.result).toBe(n)
})
```

- ### It can add numbers
  1. add 2 => result is 2
  2. add 4 => result is 6
  3. add 4 => result is 10
- ### Test cases are separate
  1. add 2 => result is 2
  2. add 2 => result is 4
