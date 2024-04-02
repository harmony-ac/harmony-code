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
  return []
}

function list(node: List) {
  const isFork = node.ordered === false
  return node.children.map((item) => listItem(item, isFork))
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
