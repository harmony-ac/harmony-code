import type { ViteDevServer, Plugin } from 'vite'
import { compileFile } from '../compiler/compiler'
import { watchFiles } from '../cli/watch'

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
  }
}
