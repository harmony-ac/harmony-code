import { Token, Lexer, TokenPosition, TokenError } from 'typescript-parsec'
import rules from './lexer_rules.js'
export { T } from './lexer_rules.js'

// based on https://github.com/microsoft/ts-parsec/blob/3350fcb/packages/ts-parsec/src/Lexer.ts
/*
    MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
*/

class TokenImpl<T> implements Token<T> {
  private nextToken: Token<T> | undefined | null

  constructor(
    private readonly lexer: LexerImpl<T>,
    private readonly input: string,
    public kind: T,
    public text: string,
    public pos: TokenPosition,
    public keep: boolean
  ) {}

  public get next(): Token<T> | undefined {
    if (this.nextToken === undefined) {
      this.nextToken = this.lexer.parseNextAvailable(
        this.input,
        this.pos.index + this.text.length,
        this.pos.rowEnd,
        this.pos.columnEnd
      )
      if (this.nextToken === undefined) {
        this.nextToken = null
      }
    }

    return this.nextToken === null ? undefined : this.nextToken
  }
}

class LexerImpl<T> implements Lexer<T> {
  constructor(public rules: [boolean, RegExp, T][]) {
    for (const rule of this.rules) {
      if (!rule[1].sticky) {
        throw new Error(
          `Regular expression patterns for a tokenizer should be sticky: ${rule[1].source}`
        )
      }
    }
  }

  public parse(input: string): TokenImpl<T> | undefined {
    return this.parseNextAvailable(input, 0, 1, 1)
  }

  public parseNext(
    input: string,
    indexStart: number,
    rowBegin: number,
    columnBegin: number
  ): TokenImpl<T> | undefined {
    if (indexStart === input.length) {
      return undefined
    }

    // changed here: instead of slicing the input string, we use a running index
    const lastIndex = indexStart
    // let result: TokenImpl<T> | undefined
    for (const [keep, regexp, kind] of this.rules) {
      // changed here: instead of slicing the input string, we use a running index
      regexp.lastIndex = lastIndex
      if (regexp.test(input)) {
        // changed here: instead of slicing the input string, we use a running index
        const text = input.slice(lastIndex, regexp.lastIndex)
        let rowEnd = rowBegin
        let columnEnd = columnBegin
        for (const c of text) {
          switch (c) {
            case '\r':
              break
            case '\n':
              rowEnd++
              columnEnd = 1
              break
            default:
              columnEnd++
          }
        }

        const newResult = new TokenImpl<T>(
          this,
          input,
          kind,
          text,
          { index: indexStart, rowBegin, columnBegin, rowEnd, columnEnd },
          keep
        )
        // changed here: instead of keeping the longest token, we keep the first one
        return newResult
        // if (
        //   result === undefined ||
        //   result.text.length < newResult.text.length
        // ) {
        //   result = newResult
        // }
      }
    }

    // if (result === undefined) {
    throw new TokenError(
      {
        index: indexStart,
        rowBegin,
        columnBegin,
        rowEnd: rowBegin,
        columnEnd: columnBegin,
      },
      `Unable to tokenize the rest of the input: ${input.substr(indexStart)}`
    )
    // } else {
    //   return result
    // }
  }

  public parseNextAvailable(
    input: string,
    index: number,
    rowBegin: number,
    columnBegin: number
  ): TokenImpl<T> | undefined {
    let token: TokenImpl<T> | undefined
    while (true) {
      token = this.parseNext(
        input,
        token === undefined ? index : token.pos.index + token.text.length,
        token === undefined ? rowBegin : token.pos.rowEnd,
        token === undefined ? columnBegin : token.pos.columnEnd
      )
      if (token === undefined) {
        return undefined
      } else if (token.keep) {
        return token
      }
    }
  }
}

export const lexer = new LexerImpl(rules)
