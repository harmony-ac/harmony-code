import type { ViteDevServer, Plugin } from 'vite'
import { watchFiles } from '../cli/watch.ts'

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
