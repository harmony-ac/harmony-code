#!/usr/bin/env node

import {
  CompletionItem,
  CompletionItemKind,
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  Location,
  ProposedFeatures,
  TextDocumentPositionParams,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node.js'

import { TextDocument } from 'vscode-languageserver-textdocument'
import { parse } from '../parser/parser.js'

// Create a connection for the server, using Node's IPC as a transport.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

let hasConfigurationCapability = false
let hasWorkspaceFolderCapability = false
let hasDiagnosticRelatedInformationCapability = false

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities

  // Does the client support the `workspace/configuration` request?
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  )
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  )
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  )

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        // WIP resolveProvider: true,
      },
      // Tell the client that this server supports go to definition
      // WIP definitionProvider: true,
    },
  }
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    }
  }
  return result
})

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined,
    )
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log('Workspace folder change event received.')
    })
  }
})

// The settings interface
interface HarmonySettings {
  maxNumberOfProblems: number
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
const defaultSettings: HarmonySettings = { maxNumberOfProblems: 1000 }
let globalSettings: HarmonySettings = defaultSettings

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<HarmonySettings>> = new Map()

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear()
  } else {
    globalSettings = <HarmonySettings>(
      (change.settings.harmonyLanguageServer || defaultSettings)
    )
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument)
})

function getDocumentSettings(resource: string): Thenable<HarmonySettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings)
  }
  let result = documentSettings.get(resource)
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'harmonyLanguageServer',
    })
    documentSettings.set(resource, result)
  }
  return result
}

// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri)
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document)
})

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
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

// Handle go to definition requests
connection.onDefinition(
  (textDocumentParams: TextDocumentPositionParams): Location | null => {
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
  },
)

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VS Code
  connection.console.log('We received a file change event')
})

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
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
  },
)

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  if (item.data === 1) {
    item.detail = 'Harmony Code'
    item.documentation = 'Harmony Code language support'
  } else if (item.data === 2) {
    item.detail = 'Section keyword'
    item.documentation = 'Define a test section'
  }
  return item
})

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// Listen on the connection
connection.listen()
