import { Location, TextDocumentPositionParams } from 'vscode-languageserver'
import { parse } from '../parser/parser'
import { connection, documents } from './server'

// Handle go to definition requests
export function provideDefinition(
  textDocumentParams: TextDocumentPositionParams,
): Location | null {
  const uri = textDocumentParams.textDocument.uri
  const document = documents.get(uri)

  if (!document) {
    return null
  }

  try {
    // Parse the document to get the AST
    const text = document.getText()
    const ast = parse(text)

    // For now, simple implementation: always return first line
    // In the future, we could traverse the AST to find actual definitions
    const location: Location = {
      uri: uri,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
    }

    connection.console.log(
      `Definition request for ${uri} at ${textDocumentParams.position.line}:${textDocumentParams.position.character}`,
    )
    connection.console.log(`Returning definition at line 0`)

    return location
  } catch (error) {
    // If there's a parse error, we can't provide definitions
    connection.console.log(
      `Cannot provide definition due to parse error: ${error}`,
    )
    return null
  }
}
