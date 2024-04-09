import {
  CucumberExpression,
  ParameterTypeRegistry,
} from '@cucumber/cucumber-expressions'
import { Feature } from './model'

const registry = new ParameterTypeRegistry()

export function definitions({
  marker,
  code,
  feature,
}: {
  marker: string
  code: string
  feature: Feature
}) {
  const re = new RegExp(`^\s*${q(marker)}(.*?)$`, 'gm')
  let match = re.exec(code)
  const start = match?.index ?? code.length
  feature.prelude += code.slice(0, start)
  while (match) {
    const bodyStart = match.index + match[0].length
    const head = match[1].trim()
    match = re.exec(code)
    const end = match?.index ?? code.length
    const body = code.slice(bodyStart, end).trim()
    if (body) {
      feature.definitions.set(new CucumberExpression(head, registry), body)
    }
  }
}

function q(pattern: string) {
  return pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}
