# Writing unit tests in .harmony files

When writing unit tests, write them in `.harmony` files using a special structured format. This specification will be compiled to JS on-the-fly and imports the corresponding `.phrases.ts` files for step implementations.

## File Structure

For tests belonging to a feature, you need:

- `example.harmony` - Test specifications (this file)
- `example.phrases.ts` - Step implementations (you create this)

## .harmony File Format

### Syntax Rules

#### Line start

1. **Lines starting with `+ `** on the same level become forks, each creating a separate test case.
2. **Lines starting with `- `** become consecutive test steps in the same test case
3. Every other line is ignored

#### Line content

1. **Sections** are any line ending in `:`. It is ignored but is used for naming test cases and groups.
2. **Steps** consist of an _action_ and an _expected outcome_ separated by `=>`.
3. **Error steps** consist of an _action_ followed by `=> !!` and an _expected error message_ in double quotes.

#### Action and Expected Outcome syntax

Use human-readable phrases for both actions and expected outcomes.
Both actions and expected outcomes can contain:

- **words**
- **punctuation** is ignored
- **string arguments** enclosed in double quotes`"like this"`
- **code arguments** enclosed in backticks `` `like this` ``

Use string arguments for string parameters and code arguments for numbers, booleans, objects, arrays etc.

If there is one obvious default action in the test case with one parameter, use an action that contains just that parameter.
If there is one obvious default expected outcome with one parameter, use an expected outcome that contains just that parameter.

### Example

```harmony
# Calculator Functions

This library provides basic calculator functions.

+ multiply():
  - multiply `2` and `3` => `6`
  - multiply `-2` and `3` => `-6`

+ divide():
  - divide `6` by `2` => `3`

  Division by zero is an error.

  + by zero:
    We need to test both non-zero and zero dividends.
    + divide `5` by `0` => !! "Division by zero"
    + divide `0` by `0` => !! "Division by zero"
```

## .phrases.ts File Implementation

Create a class that implements step methods corresponding to your test specifications. Use imports as needed, e.g. import the functions you are testing.

`When_*` methods implement actions, and `Then_*` methods implement expected outcomes. `Then_*` methods receive
an extra parameter, the return value of the preceding `When_*` method. Add the words and parameters from the action / expected outcome, separated by underscores, with parameters denoted by `X`,`Y`,`Z`,`A`,`B`,...

Use vitest.expect in assertions.

Error responses need no implementation.

```typescript
import { expect } from 'vitest'
import { multiply, divide } from './calculator'

export default class CalculatorPhrases {
  result: number | undefined

  async When_multiply_X_and_Y(a: number, b: number) {
    return multiply(a, b)
  }

  async When_divide_X_by_Y(a: number, b: number) {
    return divide(a, b)
  }

  async Then_X(expected: number, actual: number) {
    expect(actual).toBe(expected)
  }
}
```

## Best Practices

1. **Keep test descriptions clear and concise**
2. **Group related tests using sections**
3. **Use meaningful parameter names in method signatures, and add TypeScript types**
4. **Store state in class properties for complex scenarios**
5. **Handle edge cases explicitly (errors, null values, etc.)**
6. **Use descriptive comments in-line to explain test groups**
7. **Test both happy path and error conditions**
