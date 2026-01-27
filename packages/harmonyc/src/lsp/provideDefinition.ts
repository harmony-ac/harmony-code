import { Location, TextDocumentPositionParams } from 'vscode-languageserver'
import { Phrase } from '../model/model.js'
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

    // Parse the document to get the AST
    const text = document.getText()
    const ast = parse(text)

    connection.console.log(
      `Definition request for ${uri} at ${textDocumentParams.position.line}:${textDocumentParams.position.character}`,
    )

    // Use AST to find the node at the cursor position
    const nodeAtPosition = ast.findNodeAtPosition(
      textDocumentParams.position.line,
      textDocumentParams.position.character,
    )

    let phrase: Phrase | null = null
    if (nodeAtPosition) {
      connection.console.log(
        `Found node at position: ${nodeAtPosition.constructor.name}`,
      )

      // If we found a Phrase, use its information for definition lookup
      if (nodeAtPosition instanceof Phrase) {
        phrase = nodeAtPosition as Phrase
        connection.console.log(
          `Found phrase: ${phrase.kind} - ${phrase.toString()}`,
        )
        // TODO: Use phrase information to improve definition lookup precision
      }
    }

    if (!phrase) {
      connection.console.log('No phrase found at the given position')
      return null
    }

    // Use workspace to find definition in corresponding .phrases.ts file
    const location = workspace.findDefinition(filePath, phrase)

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
