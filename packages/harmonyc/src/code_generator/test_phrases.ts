import { expect } from 'vitest'

export class TestPhrases {
  constructor(private context: any) {}
  When_goodbye() {
    throw new Error('Goodbye, World!')
  }
  When_hello() {
    return (this.context.task.meta.greeting = 'Hello!')
  }
  When_greet_(name: string) {
    this.context.task.meta.greeting = `Hello, ${name}!`
  }
  async Then__is_(x: string, y: string) {
    expect(x).toBe(y)
  }
  Then_last_char(s: string) {
    return s.slice(-1)
  }
  Then_last_char_of_greeting() {
    return this.context.task.meta.greeting.slice(-1)
  }
  Then_(s: string, r: string) {
    expect(s).toBe(r)
  }
}
