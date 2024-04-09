# Definitions

Code definitions are in code blocks in the markdown file.

Definitions start with line comment with one extra comment-start character, containing the phrase.

## JavaScript

- empty => no definitions
- there are empty lines => no definitions

  ```js

  ```

- there is only some code => in the prelude
  ```js
  import { expect } from 'chai'
  ```
- there is one empty definition => no definitions
  ```js
  /// The user is logged in
  ```
- there is one empty definition with empty line=> no definitions

  ```js
  /// The user is logged in
  ```

- there is one definition => definition

  ```js
  /// The user is logged in
  assert(user.isLoggedIn)
  ```

  ```yaml
  The user is logged in: assert(user.isLoggedIn)
  The user is an admin: assert(user.isAdmin)
  ```

- there are two definitions => definitions

  ```js
  /// The user is logged in
  assert(user.isLoggedIn)
  /// The user is an admin
  assert(user.isAdmin)
  ```

  ```yaml
  The user is logged in: assert(user.isLoggedIn)
  The user is an admin: assert(user.isAdmin)
  ```

### Prelude

### Arguments

TODO

### Docstrings

TODO

---

```js harmony
/// there is/are {}
/// => no definitions
/// => definition(s)
```
