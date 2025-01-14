/// <reference types="vitest" />
import type { Plugin } from 'vite'
import type { Vitest } from 'vitest/node'
import type { Task, Suite, File } from '@vitest/runner'
import { Reporter } from 'vitest/reporters'
import { watchFiles } from '../cli/watch.ts'
import { RunnerTaskResultPack } from 'vitest'
import { b } from 'vitest/dist/chunks/environment.LoooBwUu.js'

export interface HarmonyPluginOptions {
  watchDir: string
}

export default function harmonyPlugin({
  watchDir,
}: HarmonyPluginOptions): Plugin {
  return {
    name: 'harmony',
    configureServer(server) {
      watchFiles([`${watchDir}/**/*.harmony`])
    },
    config(config) {
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

function addPhrases(task: Task) {
  if ('tasks' in task) for (const child of task.tasks) addPhrases(child)
  else if (
    task.type === 'test' &&
    task.result?.state === 'fail' &&
    task.meta?.hasOwnProperty('phrases')
  ) {
    const x = task as any as Suite
    x.type = 'suite'
    x.tasks = task.meta.phrases!.map((step, i, a) => ({
      type: 'custom',
      id: x.id + '.' + i,
      mode: 'run',
      file: task.file,
      meta: {},
      context: {} as any,
      name: step,
      result: {
        state: i < a.length - 1 ? 'pass' : 'fail',
      },
    }))
  }
}
