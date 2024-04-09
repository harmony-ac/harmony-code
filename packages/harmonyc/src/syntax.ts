import { Code, List, ListItem, RootContent as Node } from 'mdast'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { Branch, Feature, Section, Step } from './model'
import {
  CucumberExpression,
  ParameterTypeRegistry,
} from '@cucumber/cucumber-expressions'

export interface ParsedFeature {
  name: string
  root: Section
}

const registry = new ParameterTypeRegistry()

export function parse({
  fileName,
  src,
}: {
  fileName: string
  src: string
}): Feature {
  const tree = unified().use(remarkParse).parse(src)
  const rootNodes = tree.children
  const feature = new Feature('')
  const headings = [feature.root]
  let name: string | undefined

  for (let i = 0; i < rootNodes.length; i++) {
    const node = rootNodes[i]
    if (node.type === 'heading') {
      if (node.depth === 1 && name === undefined) {
        name = textContent(node)
      }
      const level = node.depth
      const section = new Section(textContent(node), [], true)
      const last = headings.slice(0, level).reverse().find(Boolean)!
      last.addChild(section)
      headings[level] = section
      headings.length = level + 1
    } else {
      const last = headings[headings.length - 1]
      for (const branch of topLevel(node, feature)) last.addChild(branch)
    }
  }
  feature.name = name ?? fileName
  feature.root.setFeature(feature)
  return feature
}

function topLevel(node: Node, feature: Feature) {
  if (node.type === 'paragraph') return []
  if (node.type == 'list') return list(node)
  if (node.type === 'code') return code(node, feature)
  return []
}

function list(node: List) {
  const isFork = node.ordered === false
  return node.children.map((item) => listItem(item, isFork))
}

function code(node: Code, feature: Feature) {
  if (!node.meta?.match(/harmony/)) return []
  const code = node.value
  const marker = '///'
  const re = new RegExp(`^\s*${q(marker)}(.*?)$`, 'gm')
  let match = re.exec(node.value)
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
  return []
}

function q(pattern: string) {
  return pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function listItem(node: ListItem, isFork: boolean) {
  const first = node.children[0]
  const text = textContent(first)
  let branch: Branch
  if (first.type === 'heading') {
    branch = new Section(text, [], isFork)
  } else {
    const [action, ...responses] = text.split(/(?:^| )=>(?: |$)/)
    branch = new Step(action, responses.filter(Boolean), [], isFork)
    const second = node.children[1]
    if (second?.type === 'code') {
      ;(branch as Step).action.docstring = second.value
    }
  }
  for (const child of node.children) {
    if (child.type === 'list') {
      for (const b of list(child)) branch.addChild(b)
    }
  }
  return branch
}

function textContent(node: Node): string {
  if (node.type === 'text') {
    return node.value.split(/\s+/).filter(Boolean).join(' ')
  }
  if (node.type === 'list') return ''
  if (!('children' in node)) return ''
  return node.children.map(textContent).filter(Boolean).join(' ')
}
