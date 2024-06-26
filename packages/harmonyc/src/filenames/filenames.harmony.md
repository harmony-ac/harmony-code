# Filenames

## Input files

Input files are `.harmony.md` files. The base is the file path without the `.harmony.md` extension.

- input file is "./src/hello.harmony.md" => base is "./src/hello"

## Test files

Test files are generated from the input files. Its name is `<base>.test.mjs`.

- input file is "./src/hello.harmony.md" => test file is "./src/hello.test.mjs"

## Steps files

Steps files are generated from the input files if they do not exist.
If a `<base>.steps.*` file exists, it is the steps file.
If no step file exists, a `.steps.ts` file will be generated.

- input file is "./src/hello.harmony.md" => steps file is "./src/hello.steps.ts"
- ### ts
  1. input file is "./src/hello.harmony.md"
  2. a file "./src/hello.steps.ts" exists
     => steps file is "./src/hello.steps.ts"
- ### not ts
  1. input file is "./src/hello.harmony.md"
  2. a file "./src/hello.steps.tsx" exists
     => steps file is "./src/hello.steps.tsx"
