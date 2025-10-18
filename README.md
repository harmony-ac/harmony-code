# Harmony Code

A test design & BDD tool that helps you separate _what_ you test and _how_ you automate it. You write test cases in a simple easy-to-read format, and then automate them with Vitest.

## Setup

You need to have Node.js installed. Then you can install Harmony Code in your project folder by:

```bash
npm install harmonyc
```

Then add it to your `vitest.config.js` or `vite.config.js` file, and specify which folder to watch for `.harmony` files:

```js
import harmony from 'harmonyc/vitest'

export default {
  plugins: [harmony({ watchDir: 'src' })],
}
```

This will run .harmony files in vitest.

## VSCode plugin

Harmony Code has a [VSCode plugin](https://marketplace.visualstudio.com/items?itemName=harmony-ac.harmony-code) that supports syntax highlighting.

Harmony Code is compatible with Vitest's VSCode plugin, so you can run and debug tests from the editor.

## Syntax

A `.harmony` file is a text file with a syntax that looks like this:

```
+ Products API:
  + Create:
    + Anonymous:
      - create product => !! "unauthorized"
    + Admin:
      - authenticate with "admin" => product count `0`
      - create product
        => product created
        => product count `1`
      - Delete:
        - delete product => product deleted => product count `0`
```

### Indentation

The lines of a file are nodes of a tree. The tree is specified with the indentation of the lines, which is n times 2 spaces and a `+` or `-` with one more space. The `+` or `-` sign is considered to be part of the indentation.

### Sequences and forks

`-` means a sequence: the node follows the previous sibling node and its descendants.

`+` means a fork: the node directly follows its parent node. All siblings with `+` are separate branches, they will generate separate scenarios.

### Phrases (actions and responses)

After the mark, every node can contain an **action** and zero or more **responses**, together called **phrases**. The action is the text before the `=>`, and the responses are the text after the `=>`.

Both actions and responses get compiled to simple function calls - in JavaScript, awaited function calls. Actions will become `When_*` functions, and responses will become `Then_*` functions. The return value of the action is passed to the responses of the same step as the last argument.

### Arguments

Phrases (actions and responses) can have arguments which are passed to the implementation function. There are two types of arguments: strings and code fragments:

```harmony
+ strings:
  + hello "John"
+ code fragment:
  + greet `3` times
```

becomes

```javascript
test('T1 - strings', async () => {
  const P = new Phrases();
  await P.When_hello_("John");
})
test('T2 - code fragment', async () => {
  const P = new Phrases();
  await P.When_greet__times(3);
})
```

### Labels

Labels are lines that start with `-` or `+` and end with `:`. You can use them to structure your test design.
They are not included in the test case, but the test case name is generated from the labels.

### Comments

Lines starting with `#` or `//` are comments and are ignored.

### Switches

You can generate multiple test cases by adding a `{ A / B / C }` syntax into action(s) and possibly response(s).

```harmony
+ password is { "A" / "asdf" / "password123" } => !! "password is too weak"
```

### Error matching

You can use `!!` to denote an error response. This will verify that the action throws an error. You can specify the error message after the `!!`.

### Variables

You can set variables in the tests and use them in strings and code fragments:

```
+ set variable:
  + ${name} "John"
    + greet "${name}" => "hello John"
+ store result into variable:
  + run process => ${result}
    + "${result}" is "success"
```

becomes

```javascript
test('T1 - set variable', (context) => {
  const P = new Phrases();
  (context.task.meta.variables ??= {})['name'] = "John";
  await P.When_greet_(context.task.meta.variables?.['name']);
})
test('T2 - store result in variable', (context) => {
  const P = new Phrases();
  const r = await P.When_run_process();
  (context.task.meta.variables ??= {})['result'] = r;
  await P.Then__is_(`${context.task.meta.variables?.['result']});
})
```


## License

MIT
