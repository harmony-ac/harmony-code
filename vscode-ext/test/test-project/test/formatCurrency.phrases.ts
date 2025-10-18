import { expect } from 'vitest'
import { formatCurrency } from '../src'

export default class FormatCurrencyPhrases {
  When_amount_(x: number) {
    return formatCurrency(x)
  }

  Then_(expected: string, result: string) {
    expect(result).toBe(expected)
  }
}