import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { parse } from '../parser/parser.js'
import {
  connection,
  hasDiagnosticRelatedInformationCapability,
} from './server.js'

export async function validateTextDocument(
  textDocument: TextDocument,
): Promise<void> {
  if (!textDocument.uri.endsWith('.harmony')) {
    return
  }
  const text = textDocument.getText()
  const diagnostics: Diagnostic[] = []

  try {
    // Try to parse the document using the harmonyc parser
    const ast = parse(text)
    connection.console.log(`Successfully parsed document: ${textDocument.uri}`)

    // If parsing succeeds, no errors to report
  } catch (error) {
    // If parsing fails, create a diagnostic for the error
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Try to extract line information from error message if available
    let line = 0
    let character = 0

    // Look for line information in the error message
    const lineMatch = errorMessage.match(/line (\d+)/i)
    if (lineMatch) {
      line = parseInt(lineMatch[1]) - 1 // Convert to 0-based
    }

    // Look for column/character information in the error message
    const columnMatch = errorMessage.match(/column (\d+)/i)
    if (columnMatch) {
      character = parseInt(columnMatch[1]) - 1 // Convert to 0-based
    }

    // If no specific position found, try to find the error position from the parser
    if (
      line === 0 &&
      character === 0 &&
      error instanceof Error &&
      'pos' in error &&
      typeof (error as any).pos === 'object'
    ) {
      const pos = (error as any).pos
      if (pos && pos.rowBegin) {
        line = pos.rowBegin - 1
        character = pos.columnBegin ? pos.columnBegin - 1 : 0
      }
    } else if (errorMessage.match(/^<END-OF-FILE>/)) {
      line = text.split('\n').length - 1
      character = text.length - text.lastIndexOf('\n') - 1
    }

    const lines = text.split('\n')
    const endCharacter = line < lines.length ? lines[line].length : character

    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line, character },
        end: { line, character: Math.max(character, endCharacter) },
      },
      message: `${errorMessage}`
        .replace(/^\{.*?\}:\s*/, '')
        .replace(/^Unable to consume token: /, 'Invalid '),
      source: 'harmony-parser',
    }

    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: diagnostic.range,
          },
          message: 'Harmony syntax error detected by parser',
        },
      ]
    }

    diagnostics.push(diagnostic)
    connection.console.log(
      `Parse error in ${textDocument.uri}: ${errorMessage}`,
    )
  }

  // Send the computed diagnostics to VS Code.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}
