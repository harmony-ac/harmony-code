import { RootContent as Node } from 'mdast'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { Branch, Section } from './model'

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
    }
  }

  return root
}

function* topLevel(node: Node) {
  if (node.type === 'paragraph') {
    console.log('paragraph')
    return
  }
}

function textContent(node: Node) {
  if (node.type === 'text') {
    return node.value
  }
  if (!('children' in node)) {
    return ''
  }
  return node.children.map(textContent).join('')
}
