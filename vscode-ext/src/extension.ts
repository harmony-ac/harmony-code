import * as path from 'path'
import * as vscode from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'

let client: LanguageClient | undefined

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  // Only activate in trusted workspaces
  if (!vscode.workspace.isTrusted) {
    vscode.window.showWarningMessage(
      'Harmony Code language features require a trusted workspace',
    )
    return
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('Harmony Code requires an open workspace')
    return
  }

  // Try to find the harmonyc package
  const harmonycPath = findHarmonycPackage(workspaceFolder.uri.fsPath)
  if (!harmonycPath) {
    vscode.window.showWarningMessage(
      `harmonyc package not found. Please install harmonyc to enable language features:
      npm install -D harmonyc`,
    )
    return
  }

  // Start the language server
  try {
    client = await startLanguageServer(harmonycPath, context)

    // Register restart command
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'harmony.restartLanguageServer',
        async () => {
          if (client) {
            await client.stop()
            client = await startLanguageServer(harmonycPath, context)
          }
        },
      ),
    )

    console.log('Harmony Language Server started successfully')
  } catch (error) {
    console.error('Failed to start Harmony Language Server:', error)
    vscode.window.showErrorMessage(
      `Failed to start Harmony Language Server: ${error}`,
    )
  }
}

export async function deactivate(): Promise<void> {
  if (client) {
    await client.stop()
  }
}

function findHarmonycPackage(workspacePath: string): string | undefined {
  const possiblePaths = [
    path.join(workspacePath, 'node_modules', 'harmonyc'),
    path.join(workspacePath, '..', 'packages', 'harmonyc'), // monorepo structure
  ]

  const fs = require('fs')
  for (const harmonycPath of possiblePaths) {
    const packageJsonPath = path.join(harmonycPath, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        if (packageJson.name === 'harmonyc') {
          return harmonycPath
        }
      } catch (error) {
        console.warn(`Error reading package.json at ${packageJsonPath}:`, error)
      }
    }
  }
  return undefined
}

async function startLanguageServer(
  harmonycPath: string,
  context: vscode.ExtensionContext,
): Promise<LanguageClient> {
  // The server is implemented in the harmonyc package
  const serverModule = path.join(harmonycPath, 'dist', 'lsp', 'server.js')

  // Check if the server exists, if not use a fallback
  const fs = require('fs')
  const serverPath = fs.existsSync(serverModule)
    ? serverModule
    : path.join(harmonycPath, 'dist', 'lsp', 'server.js')

  const serverOptions: ServerOptions = {
    run: { module: serverPath, transport: TransportKind.ipc },
    debug: {
      module: serverPath,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'harmony' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.harmony'),
    },
  }

  const client = new LanguageClient(
    'harmonyLanguageServer',
    'Harmony Language Server',
    serverOptions,
    clientOptions,
  )

  await client.start()
  return client
}
