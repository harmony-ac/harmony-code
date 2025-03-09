/// <reference types="vitest" />
import type { Plugin } from 'vite'
import type { Vitest } from 'vitest/node'
import type { Task, Suite, File } from '@vitest/runner'
import { Reporter } from 'vitest/reporters'
import { watchFiles } from '../cli/watch.ts'
import { RunnerTaskResultPack } from 'vitest'
import c from 'tinyrainbow'
import { compileFiles } from '../compiler/compiler.ts'

export interface HarmonyPluginOptions {
  watchDir: string
}

export default function harmonyPlugin({
  watchDir,
}: HarmonyPluginOptions): Plugin {
  return {
    name: 'harmony',
    config(config) {
      config.test ??= {}
      config.test.reporters ??= ['default']
      if (!Array.isArray(config.test.reporters)) {
        config.test.reporters = [config.test.reporters]
      }
      config.test.reporters.splice(0, 0, new HarmonyReporter())
    },
    async configureServer(server) {
      const isWatchMode = server.config.server.watch !== null
      const patterns = [`${watchDir}/**/*.harmony`]
      if (isWatchMode) {
        await watchFiles(patterns)
      } else {
        await compileFiles(patterns)
      }
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
