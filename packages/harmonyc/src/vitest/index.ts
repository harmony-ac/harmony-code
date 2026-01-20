/// <reference types="vitest" />
import type { File, Suite, Task } from '@vitest/runner'
import { readFile, writeFile } from 'fs/promises'
import c from 'tinyrainbow'
import { Project } from 'ts-morph'
import type { Plugin } from 'vite'
import { RunnerTaskResultPack } from 'vitest'
import type { Vitest } from 'vitest/node'
import { Reporter } from 'vitest/reporters'
import { compileFeature, CompilerOptions } from '../compiler/compile.ts'
import { preprocess } from '../compiler/compiler.ts'
import { PhraseMethod } from '../model/model.ts'
import { PhrasesAssistant } from '../phrases_assistant/phrases_assistant.ts'

export interface HarmonyPluginOptions extends Partial<CompilerOptions> {
  autoEditPhrases?: boolean
  /** Argument placheholder to detect existing phrase methods with an older scheme, and migrate them */
  legacyArgumentPlaceholder?: string | ((index: number) => string)
}

const DEFAULT_OPTIONS: HarmonyPluginOptions = {
  autoEditPhrases: true,
}

export default function harmonyPlugin(opts: HarmonyPluginOptions = {}): Plugin {
  const options = { ...DEFAULT_OPTIONS, ...opts }
  const project = new Project()
  return {
    name: 'harmony',
    resolveId(id) {
      if (id.endsWith('.harmony')) {
        return id
      }
    },
    transform(code, id) {
      if (!id.endsWith('.harmony')) return null
      code = preprocess(code)
      const { outFile, phraseMethods, featureClassName } = compileFeature(
        id,
        code,
        opts,
      )

      if (options.autoEditPhrases) {
        void updatePhrasesFile(
          project,
          id,
          phraseMethods,
          featureClassName,
          options,
        )
      }

      return {
        code: outFile.valueWithoutSourceMap,
        map: outFile.sourceMap as any,
      }
    },
    config(config: any) {
      config.test ??= {}
      config.test.reporters ??= ['default']
      if (!Array.isArray(config.test.reporters)) {
        config.test.reporters = [config.test.reporters]
      }
      config.test.reporters.splice(0, 0, new HarmonyReporter())
    },
  }
}

declare module 'vitest' {
  interface TaskMeta {
    phrases?: string[]
  }
}

class HarmonyReporter implements Reporter {
  ctx!: Vitest
  files?: File[]
  onInit(ctx: Vitest) {
    this.ctx = ctx
  }
  onCollected(files?: File[]) {
    this.files = files
  }
  onTaskUpdate(packs: RunnerTaskResultPack[]) {
    if (this.files) for (const file of this.files) addPhrases(file)
  }
  onFinished(files: File[], errors: unknown[]) {
    for (const file of files) addPhrases(file)
  }
}

function addPhrases(task: Task, depth = 2) {
  if ('tasks' in task) {
    for (const child of task.tasks) addPhrases(child, depth + 1)
  } else if (
    task.type === 'test' &&
    task.result?.state === 'fail' &&
    task.meta?.hasOwnProperty('phrases') &&
    task.meta.phrases!.length > 0
  ) {
    const x = task as any as Suite
    x.name +=
      '\n' +
      task.meta
        .phrases!.map((step, i, a) => {
          const indent = '  '.repeat(depth)
          const failed = i === a.length - 1
          const figure = failed ? c.red('×') : c.green('✓')
          return `${indent}${figure} ${step}`
        })
        .join('\n')
    delete task.meta.phrases // to make sure not to add them again
  }
}

async function updatePhrasesFile(
  project: Project,
  id: string,
  phraseMethods: PhraseMethod[],
  featureClassName: string,
  opts: HarmonyPluginOptions,
): Promise<void> {
  try {
    const phrasesFile = id.replace(/\.harmony$/, '.phrases.ts')
    let phrasesFileContent = ''

    try {
      phrasesFileContent = await readFile(phrasesFile, 'utf-8')
    } catch {
      // File doesn't exist
    }

    const pa = new PhrasesAssistant(
      project,
      phrasesFile,
      featureClassName,
      opts,
    )
    pa.ensureMethods(phraseMethods)
    const newContent = pa.toCode()

    if (newContent === phrasesFileContent) {
      return // No changes needed
    }
    await writeFile(phrasesFile, newContent, 'utf-8')
  } catch (e) {
    console.error('Error updating phrases file:', e)
  }
}
