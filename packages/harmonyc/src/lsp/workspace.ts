import * as fs from 'fs'
import * as t from 'ts-morph'
import { Location } from 'vscode-languageserver'
import { DEFAULT_COMPILER_OPTIONS } from '../compiler/compile.js'
import { Phrase } from '../model/model.js'
import { connection } from './server.js'

export class LspWorkspace {
  private project: t.Project
  private phrasesFiles = new Map<string, t.SourceFile>()
  private workspaceRoot: string

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot
    this.project = new t.Project({
      useInMemoryFileSystem: false,
      skipFileDependencyResolution: true,
    })

    connection.console.log(`Initialized LSP workspace at: ${workspaceRoot}`)
  }

  /**
   * Add or update a .harmony file in the workspace
   */
  addHarmonyFile(harmonyFilePath: string, currentText?: string): void {
    // For now, we just track that a harmony file was opened/changed
    // In the future, we might want to parse the harmony file for better language support
    connection.console.log(`Harmony file updated: ${harmonyFilePath}`)

    // Also add the corresponding phrases file if it exists
    const phrasesPath = this.getPhrasesFilePath(harmonyFilePath)
    this.addPhrasesFile(phrasesPath)
  }

  /**
   * Add or update a .phrases.ts file in the workspace
   */
  addPhrasesFile(phrasesPath: string, currentText?: string): void {
    try {
      // Check if file exists on disk
      if (!fs.existsSync(phrasesPath)) {
        connection.console.log(`Phrases file not found: ${phrasesPath}`)
        return
      }

      // Add or get the source file
      let sourceFile = this.phrasesFiles.get(phrasesPath)
      if (!sourceFile) {
        try {
          if (currentText !== undefined) {
            // Use provided text content (from unsaved document)
            sourceFile = this.project.createSourceFile(
              phrasesPath,
              currentText,
              { overwrite: true },
            )
          } else {
            // Load from file system
            sourceFile = this.project.addSourceFileAtPath(phrasesPath)
          }
          this.phrasesFiles.set(phrasesPath, sourceFile)
          connection.console.log(
            `Added phrases file to workspace: ${phrasesPath}`,
          )
        } catch (error) {
          connection.console.log(
            `Failed to add phrases file: ${phrasesPath}, error: ${error}`,
          )
          return
        }
      } else {
        if (currentText !== undefined) {
          // Update with current text content (from unsaved document)
          sourceFile.replaceWithText(currentText)
          connection.console.log(
            `Updated phrases file with current text: ${phrasesPath}`,
          )
        } else {
          // Refresh from file system
          sourceFile.refreshFromFileSystemSync()
          connection.console.log(`Refreshed phrases file: ${phrasesPath}`)
        }
      }
    } catch (error) {
      connection.console.log(
        `Error handling phrases file ${phrasesPath}: ${error}`,
      )
    }
  }

  /**
   * Remove a .phrases.ts file from the workspace
   */
  removePhrasesFile(harmonyFilePath: string): void {
    const phrasesPath = this.getPhrasesFilePath(harmonyFilePath)
    const sourceFile = this.phrasesFiles.get(phrasesPath)

    if (sourceFile) {
      sourceFile.delete()
      this.phrasesFiles.delete(phrasesPath)
      connection.console.log(
        `Removed phrases file from workspace: ${phrasesPath}`,
      )
    }
  }

  /**
   * Find definition for a symbol at the given position in a harmony file
   */
  findDefinition(harmonyFilePath: string, phrase: Phrase): Location | null {
    const phrasesPath = this.getPhrasesFilePath(harmonyFilePath)
    const sourceFile = this.phrasesFiles.get(phrasesPath)

    if (!sourceFile) {
      connection.console.log(`No phrases file loaded for: ${harmonyFilePath}`)
      return null
    }

    try {
      // Get the default export class
      const defaultExport = sourceFile.getDefaultExportSymbol()
      if (!defaultExport) {
        connection.console.log(`No default export found in: ${phrasesPath}`)
        return null
      }

      const declarations = defaultExport.getDeclarations()
      if (declarations.length === 0) {
        return null
      }

      const classDeclaration = declarations.find((decl) =>
        t.Node.isClassDeclaration(decl),
      )
      if (!classDeclaration || !t.Node.isClassDeclaration(classDeclaration)) {
        connection.console.log(`No class declaration found in: ${phrasesPath}`)
        return null
      }

      const functionName = phrase.toFunctionName(DEFAULT_COMPILER_OPTIONS)

      // Find methods in the class
      const method = classDeclaration.getMethod(functionName)
      if (!method) {
        connection.console.log(
          `No method named ${functionName} found in: ${phrasesPath}`,
        )
        return null
      }
      const nameNode = method.getNameNode()
      const start = nameNode.getStart()
      const sourceFileForLocation = method.getSourceFile()
      const lineAndColumn = sourceFileForLocation.getLineAndColumnAtPos(start)

      const location: Location = {
        uri: `file://${phrasesPath}`,
        range: {
          start: {
            line: lineAndColumn.line - 1, // VS Code is 0-based
            character: lineAndColumn.column - 1,
          },
          end: {
            line: lineAndColumn.line - 1,
            character: lineAndColumn.column - 1 + method.getName().length,
          },
        },
      }

      connection.console.log(
        `Found definition for ${harmonyFilePath} at ${phrasesPath}:${lineAndColumn.line}:${lineAndColumn.column}`,
      )
      return location
    } catch (error) {
      connection.console.log(
        `Error finding definition in ${phrasesPath}: ${error}`,
      )
      return null
    }
  }

  /**
   * Get all method names from a phrases file
   */
  getMethodNames(harmonyFilePath: string): string[] {
    const phrasesPath = this.getPhrasesFilePath(harmonyFilePath)
    const sourceFile = this.phrasesFiles.get(phrasesPath)

    if (!sourceFile) {
      return []
    }

    try {
      const defaultExport = sourceFile.getDefaultExportSymbol()
      if (!defaultExport) {
        return []
      }

      const declarations = defaultExport.getDeclarations()
      const classDeclaration = declarations.find((decl) =>
        t.Node.isClassDeclaration(decl),
      )

      if (!classDeclaration || !t.Node.isClassDeclaration(classDeclaration)) {
        return []
      }

      return classDeclaration.getMethods().map((method) => method.getName())
    } catch (error) {
      connection.console.log(
        `Error getting method names from ${phrasesPath}: ${error}`,
      )
      return []
    }
  }

  /**
   * Convert .harmony file path to corresponding .phrases.ts file path
   */
  private getPhrasesFilePath(harmonyFilePath: string): string {
    return harmonyFilePath.replace(/\.harmony$/, '.phrases.ts')
  }

  /**
   * Refresh all loaded phrases files from the file system
   */
  refreshAll(): void {
    for (const [filePath, sourceFile] of this.phrasesFiles) {
      try {
        sourceFile.refreshFromFileSystemSync()
        connection.console.log(`Refreshed: ${filePath}`)
      } catch (error) {
        connection.console.log(`Failed to refresh ${filePath}: ${error}`)
      }
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.phrasesFiles.clear()
    // ts-morph project cleanup is automatic
  }
}

let workspace: LspWorkspace | null = null

/**
 * Initialize the workspace with the given root path
 */
export function initializeWorkspace(workspaceRoot: string): void {
  workspace = new LspWorkspace(workspaceRoot)
}

/**
 * Get the current workspace instance
 */
export function getWorkspace(): LspWorkspace | null {
  return workspace
}
