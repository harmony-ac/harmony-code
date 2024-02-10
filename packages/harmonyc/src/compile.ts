#!/usr/bin/env node
import { indent } from './util/indent'
import { makeTests } from './model'
import { parse } from './parser'

export function compileFeature(name: string, src: string) {
  const root = parse(src).setFeatureName(name)
  const tests = makeTests(root)
  const lines = [
    `Feature: ${name}`,
    '',
    ...indent(tests.flatMap((test) => test.toGherkin())),
  ]
  lines[0] = `Feature: ${name}`
  return lines.join('\n')
}
