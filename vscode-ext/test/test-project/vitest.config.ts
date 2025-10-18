import { defineConfig } from 'vite'
import harmonyPlugin from '../../../packages/harmonyc/src/vitest/index.ts'

export default defineConfig({
  plugins: [harmonyPlugin()],
  test: {
    include: ['test/**/*.harmony'],
    forceRerunTriggers: ['vitest.config.ts', 'src/vitest/index.ts'],
  },
})
