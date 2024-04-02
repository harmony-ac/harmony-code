import { Branch, Section } from './model'

export function parseMarkdown(text: string): Branch {
  return new Section('', [new Section(), new Section()])
}
