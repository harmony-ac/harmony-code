import { CodeGenerator, Phrase, Test } from './model'

export abstract class Preset implements CodeGenerator {
  abstract feature(name: string, tests: Test[]): Generator<string>
  abstract test(t: Test): Generator<string>
  abstract phrase(phrase: Phrase): Generator<string>
}
