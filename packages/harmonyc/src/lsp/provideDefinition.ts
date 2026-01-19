import { Location, TextDocumentPositionParams } from 'vscode-languageserver'
import { parse } from '../parser/parser.js'
import { connection, documents } from './server.js'
import { getWorkspace } from './workspace.js'

// Handle go to definition requests
export function provideDefinition(
  textDocumentParams: TextDocumentPositionParams,
): Location | null {
  const uri = textDocumentParams.textDocument.uri
  const document = documents.get(uri)

  if (!document) {
    return null
  }

  // Only handle .harmony files
  if (!uri.endsWith('.harmony')) {
    connection.console.log(`Definition request for non-harmony file: ${uri}`)
    return null
  }

  const workspace = getWorkspace()
  if (!workspace) {
    connection.console.log('No workspace available for definition lookup')
    return null
  }

  try {
    // Convert URI to file path
    const filePath = uri.replace('file://', '')

    // Parse the document to get the AST (for future symbol resolution)
    const text = document.getText()
    const ast = parse(text)

    connection.console.log(
      `Definition request for ${uri} at ${textDocumentParams.position.line}:${textDocumentParams.position.character}`,
    )

    // Use workspace to find definition in corresponding .phrases.ts file
    const location = workspace.findDefinition(
      filePath,
      textDocumentParams.position,
    )

    if (location) {
      connection.console.log(`Found definition at ${location.uri}`)
      return location
    } else {
      connection.console.log('No definition found in phrases file')

      // Fallback: return first line of the current harmony file
      const fallbackLocation: Location = {
        uri: uri,
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      }
      connection.console.log(
        `Returning fallback definition at line 0 of current file`,
      )
      return fallbackLocation
    }
  } catch (error) {
    // If there's a parse error, we can't provide definitions
    connection.console.log(`Cannot provide definition due to error: ${error}`)
    return null
  }
}
