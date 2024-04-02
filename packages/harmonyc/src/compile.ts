#!/usr/bin/env node
import { indent } from './util/indent'
import { makeTests } from './model'
import { parseMarkdown } from './syntax'

export function compileFeature(name: string, src: string) {
  const root = parseMarkdown(src).setFeatureName(name)
  const tests = makeTests(root)
  const lines = [
    `Feature: ${name}`,
    '',
    ...indent(tests.flatMap((test) => test.toGherkin())),
  ]
  lines[0] = `Feature: ${name}`
  return lines.join('\n')
}
