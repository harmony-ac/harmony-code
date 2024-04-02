import { List, ListItem, RootContent as Node } from 'mdast'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { Branch, Section, Step } from './model'

export function parseMarkdown(text: string): Branch {
  const tree = unified().use(remarkParse).parse(text)
  const rootNodes = tree.children
  const root = new Section('', [])
  const headings = [root]

  for (let i = 0; i < rootNodes.length; i++) {
    const node = rootNodes[i]
    if (node.type === 'heading') {
      const level = node.depth
      const section = new Section(textContent(node), [], true)
      const last = headings.slice(0, level).reverse().find(Boolean)!
      last.addChild(section)
      headings[level] = section
      headings.length = level + 1
    } else {
      const last = headings[headings.length - 1]
      for (const branch of topLevel(node)) last.addChild(branch)
    }
  }

  return root
}

function topLevel(node: Node) {
  if (node.type === 'paragraph') return []
  if (node.type == 'list') return list(node)
}

function list(node: List) {
  const isFork = node.ordered === false
  return node.children.map((item) => listItem(item, isFork))
}

function listItem(node: ListItem, isFork: boolean) {
  const step = new Step(textContent(node), [], [], true)
  for (const child of node.children) {
    if (child.type === 'list') {
      for (const branch of list(child)) step.addChild(branch)
    }
  }
  return step
}

function textContent(node: Node) {
  if (node.type === 'text') {
    return node.value
  }
  if (node.type === 'list') return ''
  if (!('children' in node)) return ''
  return node.children.map(textContent).join('')
}
