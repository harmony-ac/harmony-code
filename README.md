# Harmony Code

A test design & BDD tool that helps you separate the _what_ to test from the _how_ to automate it. You write test cases in a simple Markdown format, and then automate them with Vitest (and soon with many more frameworks and languages).

(**Note**: There have been big changes since v0.2.)

## Usage

1. Have Node.js installed.
2. You can compile your `*.md` files in the `src` folder by running

   ```bash script
   npx harmonyc src/**/*.md
   ```

3. Then you can run the generated tests with Vitest by running

   ```bash script
   npx vitest
   ```

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

### Actions and responses

List items (either in ordered or bulleted lists) consist of an **action** and zero or more **response**s, separated by a `=>`.

The generated steps contain the feature name after a `||`. Cucumber's steps are in one global namespace, but including the feature name makes it easy to scope step defintions by feature.

### Sequences and forks

An ordered list means a **sequence**: the list items are included int the tests in order.

A bulleted list (`-` or `*` or `+`) means a **fork**: the node directly follows its parent node. All list items are separate branches, they will generate separate scenarios.

### Labels

Label are nodes that end with `:`. You can use them to structure your test design.
They are not included in the test case, but the test case name is generated from the labels.

### Text

Paragraphs outside of lists are for humans only, they are ignored in the automated tests.

## License

MIT
