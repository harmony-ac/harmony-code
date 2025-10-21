# Harmony Code

**Write unit tests that speak human language**

Harmony Code transforms how you write and maintain tests. Instead of wrestling with complex test code, you describe _what_ you want to test in plain English (or whichever language), and Harmony generates the Vitest test code for you.

## ✨ Why Harmony Code?

**💭 Think in scenarios, not syntax**  
Focus on business logic and user flows instead of test framework boilerplate.

**📖 Tests as living documentation**  
Your `.harmony` files become readable specifications that anyone can understand.

**🖇️ Separation of concerns**  
Test design (`.harmony`) stays separate from test implementation (`.phrases.ts`).

**⚡ Vitest integration**  
Get all the benefits of Vitest's speed and developer experience.

## 🚀 Quick Start

### 1. Install Harmony Code

```bash
npm install harmonyc
```

### 2. Configure Vitest

Add Harmony plugin to your `vitest.config.js` or `vite.config.js` and include `.harmony` files in tests:

```js
import harmony from 'harmonyc/vitest'

export default {
  plugins: [harmony()],
  test: {
    include: ['**/*.{test,spec}.{js,ts}', '**/*.harmony'],
  },
}
```

### 3. Write your first test

Create `formatCurrency.harmony`:

```harmony
# Currency Formatting

+ Dollar formatting:
  - format amount `123.45` => "$123.45"
  - format amount `100` => "$100.00"

+ Euro formatting:
  - format amount `67.98` with "EUR" => "€67.98"
```

### 4. Implement test steps

Harmony automatically generates `formatCurrency.phrases.ts` for you, adding new method stubs and keeping your existing implementations. It intelligently sorts methods alphabetically within `When_` and `Then_` categories. Fill them in like this:

```typescript
import { expect } from 'vitest'
import { formatCurrency } from '../src/currency'

export default class FormatCurrencyPhrases {
  async When_format_amount_X(amount: number) {
    return formatCurrency(amount)
  }

  async When_format_amount_X_with_Y(amount: number, currency: string) {
    return formatCurrency(amount, currency)
  }

  async Then_X(expected: string, actual: string) {
    expect(actual).toBe(expected)
  }
}
```

### 5. Run your tests

```bash
npx vitest
```

That's it! Your tests run just like regular Vitest tests, but with the clarity of human language.

## 🛠 IDE Support

**VS Code Extension**: Get syntax highlighting and IntelliSense for `.harmony` files.

Install: [Harmony Code Extension](https://marketplace.visualstudio.com/items?itemName=harmony-ac.harmony-code)

**Vitest Integration**: Run and debug tests directly from VS Code using the official Vitest extension.

## 📚 Harmony Code Syntax Guide

### Test Structure

Harmony Code uses indentation and symbols to create test scenarios:

- **`+ `** creates test **forks** - each becomes a separate test case
- **`- `** creates **sequential steps** within the same test case
- **Lines ending with `:`** are sections for organizing tests

### Actions and Expectations

Each step can have an action and expected outcomes:

```harmony
- action => expected result
- action => !! "expected error message"
```

**Actions** become `When_*` methods, **expectations** become `Then_*` methods.

### Parameters

Use quotes for strings and backticks for other values:

```harmony
- login with "john@example.com" remember `true` => user logged in
```

Becomes:

```typescript
async When_login_with_X_remember_Y(email: string, rememberMe: boolean) {
  // your implementation
}
```

Parameters are mapped to `X`, `Y`, `Z`, `A`, `B`, `C`... (alphabetically) in method names.

### Example: User Authentication

```harmony
# User Authentication

+ successful login:
  - enter email "user@test.com"
  - enter password "password123"
  - click login button => redirected to dashboard

+ failed login:
  - enter email "wrong@test.com"
  - enter password "wrongpass"
  - click login button => !! "Invalid credentials"

+ password requirements:
  + too short:
    - set password "123" => !! "Password must be at least 8 characters"
  + missing special character:
    - set password "password123" => !! "Password must contain a special character"
```

## 🔄 How It Works

1. **Write scenarios** in `.harmony` files using human-readable language
2. **Harmony generates** the corresponding Vitest test structure
3. **Harmony updates** your `.phrases.ts` files, adding new method stubs while preserving existing implementations
4. **You implement** the step methods (only the new ones need your attention)
5. **Run tests** with Vitest watch mode automatically, or with VSCode Vitest extension

The beauty is in the separation: your test scenarios remain clean and business-focused, while implementation details live in separate files.

### Smart Code Generation

- **Preserves your work**: Existing method implementations are never overwritten
- **Adds only what's needed**: New method stubs are generated for missing steps
- **Removes unused methods**: Methods no longer referenced in `.harmony` files are cleaned up
- **Keeps things organized**: Methods are sorted alphabetically within `When_` and `Then_` categories

## 🎯 Advanced Features

### Variables

Store and reuse values across test steps:

```harmony
+ user workflow:
  - create user => ${userId}
  - login with user id "${userId}" => success
  - delete user "${userId}" => user removed
```

### Test Switches

Generate multiple test cases with variations:

```harmony
+ password validation:
  - password { "123" / "abc" / "" } => !! "Invalid password"
```

This creates three separate test cases, one for each password value.

### Error Testing

Use `!!` to test error conditions. The error message is optional - if provided, it checks that the thrown error contains that substring:

```harmony
+ division by zero:
  - divide `10` by `0` => !! "Cannot divide by zero"
  - divide `5` by `0` => !!  # just checks that an error is thrown
```

**No implementation needed**: Error steps don't require corresponding methods in your phrases file.

### Complex Scenarios

Build sophisticated test flows:

```harmony
# E-commerce Checkout

+ guest checkout:
  - add product "T-shirt" to cart
  - go to checkout
  - enter shipping address:
    - name "John Doe"
    - address "123 Main St"
  - select payment method "credit card"
  - complete purchase => order confirmation

+ member checkout:
  - login as "member@test.com"
  - add product "Laptop" to cart
  - use saved address => address populated
  - complete purchase => order confirmation
  - check order history => order appears
```

## 🧹 Best Practices

**Use natural language**: Write steps as if explaining to a manual tester. Write in the language you use for discussing requirements.  
**Keep scenarios focused**: Each test should verify one main behavior  
**Use descriptive names**: Make test intentions clear from the scenario text  
**Use parameter-only names** if there is an obivous single-parameter input or output (e.g., `` => `true` ``, which will be `Then_X(x)` )  
**Group related tests**: Use sections (lines ending with `:`) to organize  
**Test edge cases**: Include error conditions and boundary values  
**Maintain phrase files**: Keep step implementations simple and focused, add JSDoc if step documentation is needed

## ⌨️ CLI Usage

Compile `.harmony` files manually:

```bash
npx harmonyc "src/**/*.harmony"
```

Watch for changes:

```bash
npx harmonyc "src/**/*.harmony" --watch
```

## 📦 Package Structure

- **`harmonyc`** - Core compiler and Vitest plugin
- **VS Code Extension** - Syntax highlighting and language support

## 🤝 Contributing

Harmony Code is open source and welcomes contributions. Check out our [GitHub repository](https://github.com/harmony-ac/code) for issues, feature requests, and development setup.

## 📄 License

MIT - see [LICENSE](LICENSE) for details.
