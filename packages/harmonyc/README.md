# Harmony Code

A test design tool that helps you separate the _what_ to test from the _how_ to automate. You write test cases in a simple Markdown format, and then automate them with your favorite test framework.

(This readme itself is a Harmony Code file.)

## Setup

1. Have Node.js installed.
2. Install Harmony Code in your project folder by:

   ```bash
   npm install harmonyc
   ```

3. To run it for all `.spec.md` files in your `src` folder:

   ```bash
   harmonyc src/**/*.spec.md
   ```

   ⇒ This will generate `.feature` files next to the `.spec.md` files.

## Syntax

A Harmony Code file is a Markdown file with a syntax that looks like this:

```markdown
# Products API

- **Create**:
  - **Anonymous:**
    - create product => error: unauthorized
  - **Admin**:
    1. authenticate admin
    2. create product => product created
    3. **Delete:**
       - delete product => product deleted
```

Compiling this with `harmonyc` will generate this `.feature` file:

```gherkin
Feature: products

    Scenario: T1 - Products API - Create - Anonymous
        When create product || products
        Then error: unauthorized || products

    Scenario: T2 - Products API - Create - Admin - Delete
        When authenticate admin || products
        When create product || products
        Then product created || products
        When delete product || products
        Then product deleted || products
```

### Actions and responses

List items (either in ordered or bulleted lists) consist of an **action** and zero or more **response**s, separated by a `=>`. The actions become `When`s and the responses become `Then`s.

The generated steps contain the feature name after a `||`. Cucumber's steps are in one global namespace, but including the feature name makes it easy to scope step defintions by feature.

### Sequences and forks

An ordered list means a **sequence**: the list items are included int the tests in order.

A bulleted list (`-` or `*` or `+`) means a **fork**: the node directly follows its parent node. All list items are separate branches, they will generate separate scenarios.

### Labels

Label are nodes that end with `:`. You can use them to structure your test design.
They are not included in the test case, but the test case name is generated from the labels.

### Specification text

Paragraphs outside of lists are for humans only, they are ignored in the automated tests.

## Running the tests

`harmonyc` only compiles `.harmony` files to `.feature` files. To run the tests, you need to set up a Cucumber implementation for your platform.

## License

MIT

### Automation

The steps in this file are automated with the following YAML:

```yaml harmony
automation:
  bats:
    steps:
      Have Node.js installed: command -v node
      Install Harmony Code {}: $_
      To run it {}: $_
      This will generate {}: |
        [ $(find . -name '*.spec.md' | wc -l) -gt 0 ]
  vitest:
    steps:
      A Harmony Code file {}: this.input = $_
```
