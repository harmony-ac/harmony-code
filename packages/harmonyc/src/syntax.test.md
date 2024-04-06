# Syntax

Markdown code is mapped to the Harmony test model along the following rules.

## Empty file

- empty => empty test design
- there are empty lines => empty test design

  ```markdown

  ```

- there is only a paragraph => empty test design

  ```markdown
  The user should be able to log in.
  ```

## Section headings

- there is only a h1 => one section

  ```markdown
  # Login form
  ```

- there are more h1s => forked sections

  ```markdown
  # Login

  # Logout
  ```

- there are only h2s => forked sections

  ```markdown
  ## Login

  ## Logout
  ```

- there are nested headings => nested forked sections

  ```markdown
  # Login form

  ## Log in
  ```

- there are deep nested headings => deep nested forked sections

  ```markdown
  # Login form

  ## Log in

  ### Empty checks

  ### Email validation

  ## Log out

  ### Re-login
  ```

## Bulleted lists

- there is only a bullet point => one step

  ```markdown
  - log in
  ```

- there are more bullet points => forked steps
  ```markdown
  - log in
  - log out
  ```
- there are nested bullet points => nested forked steps
  ```markdown
  - log in
    - create order
    - log out
  - sign up
    - log out
  ```
- deep nested bullet points => deep nested forked steps

## Numbered lists

- there is only a numbered item => one step, not forked

  ```markdown
  1. log in
  ```

- there are more numbered items => sequential steps

  ```markdown
  1. log in
  2. log out
  ```

- there are nested bulleted and numbered lists => nested sequences and forks

  ```markdown
  - log in
    1. create order
       - pay
       - clear cart
    2. log out
  ```

- there are numbered and nested lists on same level => bulleted items are forks, numbered items not

  ```markdown
  - log in

  1. create order
  2. pay

  - log out

  1. log in
  2. log out
  ```

## Responses

Responses are specified with `=>` after the action.

- there is only a response => step with one response and empty action
  ```markdown
  - => logged out
  ```
- there is action and response => step with action and response
  ```markdown
  - log out => logged out
  ```
- there are more responses => step with more responses
  ```markdown
  - log out => logged out => on home page
  ```

## Headings within lists

- there is a heading in list item => one section
  ```markdown
  - # Login form
  ```
- there are headings in bulleted items => forked sections
  ```markdown
  - ### Login
  - ### Logout
  ```

## Docstrings

- there is a docstring => action with docstring

  ````markdown
  - the user writes an email

    ```
    Hello John,

    Please find the attached invoice.

    Best regards,
    Jane
    ```
  ````

<details><summary>Automation</summary>

```yaml harmony
automation:
  node:
    steps:
      empty: const input = ""
      preamble: |
        import expect from 'expect'
        import { parse } from './syntax'
      there is/are {}: const input = $_
      => {}: expect(parse(input)).toMatchSnapshot($1)
```

</details>
