import { FrameworkConfig } from './config'

export const frameworks: Record<string, FrameworkConfig> = {
  bats: {
    outExtension: 'bats',
  },
  node: {
    outExtension: 'js',
    runCommand: 'node --test',
    watchCommand: 'node --test --watch',
  },
  gherkin: {
    outExtension: 'feature',
    feature: ['Feature: ${name}', '', '${tests|indent}'],
    test: ['Scenario: ${name}', '${steps|indent}'],
    step: ['${phrases}'],
    phrase: ['${text}'],
  },
}
