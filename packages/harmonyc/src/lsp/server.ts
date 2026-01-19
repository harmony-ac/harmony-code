#!/usr/bin/env node

import {
  createConnection,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node.js'

import { TextDocument } from 'vscode-languageserver-textdocument'
import { provideCompletion, resolveCompletion } from './provideCompletion.js'
import { provideDefinition } from './provideDefinition.js'
import { validateTextDocument } from './validateTextDocument.js'
import { getWorkspace, initializeWorkspace } from './workspace.js'

// Create a connection for the server, using Node's IPC as a transport.
export const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
export const documents: TextDocuments<TextDocument> = new TextDocuments(
  TextDocument,
)

let hasConfigurationCapability = false
let hasWorkspaceFolderCapability = false
export let hasDiagnosticRelatedInformationCapability = false

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities

  // Initialize workspace if we have workspace folders
  if (params.workspaceFolders && params.workspaceFolders.length > 0) {
    const workspaceRoot = params.workspaceFolders[0].uri.replace('file://', '')
    initializeWorkspace(workspaceRoot)
    connection.console.log(`Initialized workspace at: ${workspaceRoot}`)
  } else if (params.rootUri) {
    const workspaceRoot = params.rootUri.replace('file://', '')
    initializeWorkspace(workspaceRoot)
    connection.console.log(`Initialized workspace at: ${workspaceRoot}`)
  }

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
      definitionProvider: true,
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

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document)

  const uri = change.document.uri
  const workspace = getWorkspace()

  if (workspace) {
    const filePath = uri.replace('file://', '')
    if (uri.endsWith('.harmony')) {
      workspace.addHarmonyFile(filePath, change.document.getText())
    } else if (uri.endsWith('.phrases.ts')) {
      workspace.addPhrasesFile(filePath, change.document.getText())
    }
  }
})

documents.onDidOpen((event) => {
  const uri = event.document.uri
  const workspace = getWorkspace()

  if (workspace) {
    const filePath = uri.replace('file://', '')
    if (uri.endsWith('.harmony')) {
      workspace.addHarmonyFile(filePath, event.document.getText())
    } else if (uri.endsWith('.phrases.ts')) {
      workspace.addPhrasesFile(filePath, event.document.getText())
    }
  }
})

documents.onDidClose((event) => {
  const uri = event.document.uri
  documentSettings.delete(uri)

  // When a .harmony file is closed, optionally remove its .phrases.ts file
  if (uri.endsWith('.harmony')) {
    const workspace = getWorkspace()
    if (workspace) {
      const filePath = uri.replace('file://', '')
      // Note: We might want to keep the phrases file loaded even when harmony file is closed
      // workspace.removePhrasesFile(filePath)
    }
  }
})

connection.onDefinition(provideDefinition)

connection.onDidChangeWatchedFiles((change) => {
  // Monitored files have change in VS Code
  connection.console.log('We received a file change event')
})

connection.onCompletion(provideCompletion)
connection.onCompletionResolve(resolveCompletion)

documents.listen(connection)
connection.listen()
