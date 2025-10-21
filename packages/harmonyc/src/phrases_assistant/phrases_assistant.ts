import * as t from 'ts-morph'
import { PhraseMethod } from '../model/model'

export class PhrasesAssistant {
  project = new t.Project({
    useInMemoryFileSystem: true,
  })
  file: t.SourceFile
  clazz: t.ClassDeclaration

  constructor(content: string, className: string) {
    this.file = this.project.createSourceFile('filename.ts', content, {
      overwrite: true,
    })
    const clazz = this.file.getClass(className)
    if (!clazz) {
      const defaultExport = this.file.getDefaultExportSymbol()
      if (defaultExport) {
        const decl = defaultExport.getDeclarations()[0]
        if (t.Node.isClassDeclaration(decl)) {
          this.clazz = decl
          this.clazz.rename(className)
        }
      }
    } else {
      this.clazz = clazz
      if (!this.clazz.isDefaultExport()) {
        this.clazz.setIsDefaultExport(true)
      }
    }
    this.clazz ??= this.file.addClass({
      name: className,
      isDefaultExport: true,
    })
  }

  ensureMethods(methods: PhraseMethod[]) {
    for (const method of methods) {
      this.ensureMethod(method)
    }
    this.clazz
      .getMethods()
      .filter((m) => !methods.find((md) => md.name === m.getName()))
      .forEach((m) => {
        if (
          m.getStatements().length === 1 &&
          m
            .getStatements()[0]
            .getText()
            .match(/throw new Error\(["']TODO /)
        ) {
          m.remove()
        }
      })
    this.sortMethods()
  }

  ensureMethod(method: PhraseMethod) {
    let existing = this.clazz.getMethod(method.name)
    if (!existing) {
      this.addMethod(method)
    }
  }

  addMethod(method: PhraseMethod) {
    const m = this.clazz.addMethod({
      isAsync: true,
      name: method.name,
      parameters: method.parameters,
      statements: [`throw new Error("TODO ${method.name}");`],
    })
    m.formatText({ indentSize: 2 })
  }

  sortMethods() {
    const groups = ['When_', 'Then_']
    const members = this.clazz.getMembersWithComments()
    const sorted = members.slice().sort((a, b) => {
      const kindA = t.Node.isMethodDeclaration(a)
        ? groups.findIndex((g) => a.getName().startsWith(g))
        : -1
      const kindB = t.Node.isMethodDeclaration(b)
        ? groups.findIndex((g) => b.getName().startsWith(g))
        : -1
      if (kindA !== kindB) {
        return kindA - kindB
      }
      if (kindA === -1 && kindB === -1) {
        return 0
      }
      if (!t.Node.isMethodDeclaration(a) || !t.Node.isMethodDeclaration(b)) {
        // never happens
        return 0
      }
      return a.getName() < b.getName() ? -1 : 1
    })

    const moves = calculateMoves(members, sorted)
    for (const move of moves) {
      const method = members[move.fromIndex]
      if (t.Node.isCommentClassElement(method)) {
        // something went wrong
        return
      }
      method.setOrder(move.toIndex)
      const [moved] = members.splice(move.fromIndex, 1)
      members.splice(move.toIndex, 0, moved)
    }
  }

  toCode() {
    let s = this.file.getFullText()

    // fix extra space
    const closing = this.clazz.getEnd() - 1
    if (s.slice(closing - 2, closing + 1) === '\n }') {
      s = s.slice(0, closing - 1) + s.slice(closing)
    }

    return s
  }
}

/**
 * Calculates a set of move operations to transform one array into another.
 * Both arrays must contain the same elements, just in different order.
 *
 * @param actual - The current array that needs to be reordered
 * @param desired - The target array with the desired order
 * @returns Array of move operations {fromIndex, toIndex} that transform actual into desired
 */
function calculateMoves<T>(
  actual: T[],
  desired: T[]
): Array<{ fromIndex: number; toIndex: number }> {
  if (actual.length !== desired.length) {
    throw new Error('Arrays must have the same length')
  }

  // Create a working copy to track changes
  const working = [...actual]
  const moves: Array<{ fromIndex: number; toIndex: number }> = []

  // For each position in the desired array
  for (let targetIndex = 0; targetIndex < desired.length; targetIndex++) {
    const targetElement = desired[targetIndex]

    // Find where this element currently is in our working array
    const currentIndex = working.indexOf(targetElement)

    if (currentIndex === -1) {
      throw new Error('Arrays must contain the same elements')
    }

    // If it's not in the right position, move it
    if (currentIndex !== targetIndex) {
      // Record the move operation
      moves.push({
        fromIndex: currentIndex,
        toIndex: targetIndex,
      })

      // Apply the move to our working array
      const [movedElement] = working.splice(currentIndex, 1)
      working.splice(targetIndex, 0, movedElement)
    }
  }

  return moves
}
