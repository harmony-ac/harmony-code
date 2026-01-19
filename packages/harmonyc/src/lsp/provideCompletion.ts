import {
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
} from 'vscode-languageserver'

// This handler resolves additional information for the item selected in
// the completion list.
export function resolveCompletion(item: CompletionItem): CompletionItem {
  if (item.data === 1) {
    item.detail = 'Harmony Code'
    item.documentation = 'Harmony Code language support'
  } else if (item.data === 2) {
    item.detail = 'Section keyword'
    item.documentation = 'Define a test section'
  }
  return item
}

export function provideCompletion(
  _textDocumentPosition: TextDocumentPositionParams,
): CompletionItem[] {
  // The pass parameter contains the position of the text document in
  // which code complete got requested.
  return [
    {
      label: 'Harmony',
      kind: CompletionItemKind.Text,
      data: 1,
    },
    {
      label: 'Section',
      kind: CompletionItemKind.Keyword,
      data: 2,
    },
  ]
}
