import { expect } from 'vitest'

export default class VariablesPhrases {
  async When_(x: any) {
    return x
  }
  async Then__is_(x: any, y: any) {
    expect(x).toBe(y)
  }
}
