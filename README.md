# Harmony Code

A simple model-based test design tool that generates Cucumber feature files.

## Setup

You need to have Node.js installed. Then you can install Harmony Code in your project folder by:

```bash
npm install harmonyc
```

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

Compiling this with `harmonyc` will generate this `.feature` file:

```gherkin
Feature: products

    Scenario: T1 - Products API - Create - Anonymous
        When create product -- products
        Then error: unauthorized -- products
    
    Scenario: T2 - Products API - Create - Admin - Delete
        When authenticate admin -- products
        When create product -- products
        Then product created -- products
        When delete product -- products
        Then product deleted -- products
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

The generated steps contain the feature name after a ` -- `. Cucumber's steps are in one global namespace, but including the feature name makes it easy to scope step defintions by feature.


## Running the tests

Currenlty `harmonyc` only compiles `.harmony` files to `.feature` files. To run the tests, you need to set up Cucumber or Specflow, depending on your environment.

## License

MIT
