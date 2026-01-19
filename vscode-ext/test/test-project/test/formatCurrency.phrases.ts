import { expect } from 'vitest'
import { formatCurrency } from '../src'




export default class FormatCurrencyPhrases {
  
  When_amount_(x: number) {
    return formatCurrency(x)
  }

  async When_amount_X(x: any) {
    return formatCurrency(x)
  }

  async When_amount_X_Y(amount: any, currency: string) {
    return formatCurrency(amount, currency)
  }

  Then_X(expected: string, result: string) {
    expect(result).toBe(expected)
  }
}
 