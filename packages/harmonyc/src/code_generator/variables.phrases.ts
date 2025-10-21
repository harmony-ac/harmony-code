import { expect } from 'vitest'

export default class VariablesPhrases {
  async When_X(x: any) {
    return x
  }
  async Then_X_is_Y(x: any, y: any) {
    expect(x).toBe(y)
  }

  async Then_(res: any) {
    throw new Error("TODO Then_");
  }
}
