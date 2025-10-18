import { defineConfig } from 'vite'
import harmonyPlugin from './src/vitest/index.ts'

export default defineConfig({
  plugins: [harmonyPlugin({ watchDir: 'src' })],
  test: {
    include: ['**/*.harmony'],
    forceRerunTriggers: ['vitest.config.ts', 'src/vitest/index.ts'],
  },
})
