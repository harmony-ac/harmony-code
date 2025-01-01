# Harmony Code

A test design & BDD tool that helps you separate the _what_ to test from the _how_ to automate it. You write test cases in a simple easy-to-read format, and then automate them with Vitest (and soon with other frameworks and languages).

## Setup

You need to have Node.js installed. Then you can install Harmony Code in your project folder by:

```bash
npm install harmonyc
```

And then run it for all `.harmony` files in your `src` folder:

```bash
harmonyc src/**/*.harmony
```

This will generate `.test.mjs` files next to the `.harmony` files, and generate empty definition files for you.

## Syntax

A `.harmony` file is a text file with a syntax that looks like this:

```
+ Products API:
  + Create:
    + Anonymous:
      - create product => !! "unauthorized"
    + Admin:
      - authenticate admin
      - create product => product created
      - Delete:
        - delete product => product deleted
```

### Indentation

The lines of a file are nodes of a tree. The tree is specified with the indentation of the lines, which is n times 2 spaces and a `+` or `-` with one more space. The `+` or `-` sign is considered to be part of the indentation.

### Sequences and forks

`-` means a sequence: the node follows the previous sibling node and its descendants.

`+` means a fork: the node directly follows its parent node. All siblings with `+` are separate branches, they will generate separate scenarios.

### Labels

Label are nodes that end with `:`. You can use them to structure your test design.
They are not included in the test case, but the test case name is generated from the labels.

### Comments

Lines starting with `#` or `//` are comments and are ignored.

### Steps

All other lines are steps. A step consists of an action, and one or more responses denoted by `=>`.
Actions will become `When` steps, and responses will become `Then` steps.

### Error matching

You can use `!!` to denote an error response. This will verify that the action throws an error. You can specify the error message after the `!!`.

## Running the tests

## License

MIT
