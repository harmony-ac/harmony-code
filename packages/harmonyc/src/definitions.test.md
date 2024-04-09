# Definitions

Code definitions are in code blocks in the markdown file.

Definitions start with line comment with one extra comment-start character, containing the phrase.

## JavaScript

1. ### language
   - language is JavaScript
2. ### syntax

   - empty => no definitions
   - there are empty lines => no definitions

     ```js

     ```

   - there is only some code => in the prelude
     ```js
     import { expect } from 'chai'
     ```
     ```text
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
import { Feature } from './model'
import { definitions } from './definitions'
/// language is JavaScript
const marker = '///'
/// empty
const feature = new Feature('test')
definitions({ feature, marker, code: '' })
/// there is/are {}
const feature = new Feature('test')
definitions({ feature, marker, code: $_ })
/// => in the prelude
expect(feature.prelude).to.eql($_)
/// => no definitions
expect(feature.definitions).to.be.empty
/// => definition(s)
expect(
  [...feature.definitions.entries()]
    .map(([k, v]) => `${k.expression}: ${v}`)
    .join('\n')
).to.eql($_)
```
