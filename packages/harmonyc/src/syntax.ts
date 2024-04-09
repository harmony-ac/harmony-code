import { Code, List, ListItem, RootContent as Node } from 'mdast'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { Branch, Feature, Section, Step } from './model'
import { definitions } from './definitions'

export interface ParsedFeature {
  name: string
  root: Section
}

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
  definitions({ marker, code, feature })
  return []
}

function listItem(node: ListItem, isFork: boolean) {
  const first = node.children[0]
  const text = textContent(first)
  let branch: Branch
  if (first.type === 'heading') {
    branch = new Section(text, [], isFork)
  } else {
    const [action, ...responses] = text.split(/(?:^| )=>(?: |$)/)
    const step = (branch = new Step(
      action,
      responses.filter(Boolean),
      [],
      isFork
    ))
    let i = 0
    for (const child of node.children.slice(1)) {
      if (child.type === 'list') break
      if (child.type === 'code') {
        if (step.phrases[i]) step.phrases[i].docstring = child.value
        else break
        ++i
      }
    }
  }
  for (const child of node.children) {
    if (child.type === 'list') {
      for (const b of list(child)) branch.addChild(b)
    }
  }
  return branch
}

function textContent(node: Node | undefined): string {
  if (!node) return ''
  if (node.type === 'text') {
    return node.value.split(/\s+/).filter(Boolean).join(' ')
  }
  if (node.type === 'list') return ''
  if (!('children' in node)) return ''
  return node.children.map(textContent).filter(Boolean).join(' ')
}
