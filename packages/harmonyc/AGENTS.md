# Writing unit tests in Harmony Code (.harmony) files

When writing unit tests, write them in `.harmony` files using a special structured format. This specification will be compiled to JS on-the-fly and imports the corresponding `.phrases.ts` files for phrase implementations.

## File Structure

For tests belonging to a feature, you need:

- `example.harmony` - Test specifications
- `example.phrases.ts` - Phrase implementations
The Harmony Code compiler will edit the `.phrases.ts` file to add or remove method stubs.

## .harmony File Format

Example:

```harmony
# This is a comment
Thi is a comment too
+ Section 1:
  This is a description of section 1
  over multiple lines.
  - step 1 => expected result 1
  - step 2 => expected result 2
+ Section 2:
  + input 1 => expected result 1
  + input 2 => expected result 2
```

### Syntax Rules

#### Line start

1. **Lines starting with `+ `** on the same level become forks, each creating a separate test case.
2. **Lines starting with `- `** become consecutive test steps in the same test case
3. Every other line is ignored

#### Line content

1. **Sections** are any line ending in `:`. It is ignored but is used for naming test cases and groups.
2. **Steps** consist of an _action_ and a _response_ separated by `=>`.
3. **Error steps** consist of an _action_ followed by `=> !!` and an _error response_, which must be an expected error message fragment in double quotes or docstring, prefer docstring even for single line.

#### Action and Response syntax

Use human-readable phrases for both actions and responses.
Both actions and responses can contain:

- **words**
- **punctuation** is treated as word separators; leading/trailing punctuation is stripped
- **string arguments** enclosed in double quotes`"like this"`
- **code arguments** enclosed in backticks `` `like this` ``. Can be multi-line.
- **docstring argument** at the end of the action/response, either starting on same line or on the next line, consecutive lines starting with `| ` are part of it.
  ```harmony
  - greeting is | Hello, John Doe!
  - address is
    | 123 Main St
    | Springfield
  - send email => !! | Email address is invalid
  ```
  Prefere same line if single-line and short. Pefer single-line multiline for error messages.
- **variable references** `${varName}` (see Variables section below)

Use string arguments for string parameters and code arguments for numbers, booleans, objects, arrays etc.

#### Single-argument actions and responses

If there is one obvious default action in the feature of the file with one parameter, use an action that consists of only that parameter.
If there is one obvious default response with one parameter, use an response that contains just that parameter.
```harmony
+ greet:
  - "John" => "Hello, John!"
```
These will be declared in the phrases file as `When_X(name: string)` and `Then_X(expected: string, res: any)`.

#### Empty action
A step can omit the action and consist only of a response. Use this for preconditions or fork branches without an action.

```harmony
+ log in
  + => logged in successfully
  + log out => logged out successfully
```

#### Multiple responses

A step can have multiple `=>` responses chained:

```harmony
- do something => first result => second result
```
Prefer to put them in separate lines, aligned by the =>
```harmony
- do something => first result
               => second result
    + do a
    + do b
```
#### Interleaved narrative

Use lines without `+` or `-` to add narrative or descriptions to the test cases. This is a powerful way to make tests more readable and maintainable.

### Example

```harmony
# Calculator Functions

This library provides basic calculator functions.

+ multiply():
  + multiply `2` and `3` => `6`
  + multiply `-2` and `3` => `-6`

+ divide():
  + divide `6` by `2` => `3`

  Division by zero is an error.

  + by zero:
    We need to test both non-zero and zero dividends.
    + divide `5` by `0` => !! "Division by zero"
    + divide `0` by `0` => !! "Division by zero"
```

```harmony
+ login and manage:
  - log in with "admin" role
    + manage users
    + manage orders
```

### Variables

By default, the return value of an action's `When_*` method is passed as the last argument to all `Then_*` methods of the same step. To store values across steps, use variables with `${varName}` syntax.

**Set a variable** (a special action with no `When_*` method):
```harmony
- ${userId} "abc-123"
- ${count} `42`
```

**Save a response to a variable** (inline with `=>`):
```harmony
- create user => ${userId}
```

**Save the return value of a `Then_` method to a variable:**
```harmony
- create user => id ${userId}
```

**Use a variable**:
```harmony
- log in with ${userId}
```

**Use a variable in a string argument**
```harmony
- login with "${userId}@example.com"
```

**Use a variable in a code argument:**
```harmony
- process `{id: ${userId}}`
```

Variables set with a plain assignment action require no method implementation. Variables used in strings are interpolated using `context.task.meta.variables?.["varName"]` at runtime.

### Switches (Parameterized variants)

Use `{ option1 ; option2 ; option3 }` inside a phrase to generate one test case per option. All switches within a single test case must have the same number of choices.

```harmony
+ password validation:
  - set password { "123" ; "abc" ; "" } => !! "Invalid password"
```

This generates three separate test cases. Multiple switches in the same test case are resolved in parallel (first choices together, second choices together, etc.):

```harmony
+ greet { "John" ; "Jane" } => { "Hello John!" ; "Hello Jane!" }
```

## .phrases.ts File Implementation

Create a class that implements step methods corresponding to your test specifications. Use imports as needed, e.g. import the functions you are testing.

`When_*` methods implement actions, and `Then_*` methods implement responses. `Then_*` methods receive
an extra parameter, the return value of the preceding `When_*` method. Add the words and parameters from the action / response, separated by underscores, with parameters denoted by `X`,`Y`,`Z`,`A`,`B`,...

### Method naming rules

- Words are joined with underscores: `hello world` → `When_hello_world`
- Each argument (string or code) is replaced by the next placeholder: first `X`, then `Y`, `Z`, `A`, `B`, `C`, ..., e.g. `add "5" and "10"` → `When_add_X_and_Y(x: string, y: string)`
- Punctuation is treated as a word separator and leading/trailing punctuation is stripped: `hello, world!` → `When_hello_world`
- Non-ASCII letters (accented, international) are preserved in method names

Use vitest expect in assertions.

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
