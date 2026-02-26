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

  async Then_result_has_X(hint: string, res: any) {
    expect(res).toMatchSnapshot(hint)
  }

  async Then_X(x: string, res: any) {
    throw new Error("TODO Then_X");
  }

  async Then_result_has_dollar_sign_and_2_decimals(res: any) {
    expect(res).toMatchInlineSnapshot(`"$123.40"`)
  }
}
 