# Harmony Code

A simple model-based test design tool that generates Cucumber feature files.

## Setup

You need to have Node.js installed. Then you can install Harmony Code in your project folder by:

```bash
npm install harmonyc
```

(This saves the dependency in your package.json.)
And then run it for all `.harmony` files in your `src` folder:

```bash
harmonyc src/**/*.harmony
```

This will generate `.feature` files next to the `.harmony` files.

## Syntax

A `.harmony` file is a text file with a syntax that looks like this:

```
Products API:
+ Create:
  + Anonymous:
    - create product => error: unauthorized
  + Admin:
    - authenticate admin
    - create product => product created
    - Delete:
      - delete product => product deleted
```

The lines of a file are nodes of a tree. The tree is specified with the indentation of the lines, which is n times 2 spaces and a `+` or `-` with one more space. `-` means 
the node comes after the preceding nodes, and `+` means a fork.

Every line is either a label (ending with `:`) or a step. A step consists of an action
and one or more responses denoted by `=>`.

Compiling this with `harmonyc` will generate a `.feature` file that looks like this:

```gherkin
Feature: change_password

    Scenario: T1 - Products API - Create - Anonymous
        When create product
        Then error: unauthorized
    
    Scenario: T2 - Products API - Create - Admin - Delete
        When authenticate admin
        When create product
        Then product created
        When delete product
        Then product deleted
```

## Running the tests

`harmonyc` only compiles `.harmony` files to `.feature` files. To run the tests, you need to set up Cucumber or Specflow, depending on your environment.

## License

MIT
