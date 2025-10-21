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
