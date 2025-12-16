import { defineConfig } from 'vite'
import harmonyPlugin from './src/vitest/index.ts'

export default defineConfig({
  plugins: [harmonyPlugin({})],
  test: {
    testTimeout: 15_000,
    include: ['src/**/*.harmony'],
    forceRerunTriggers: ['vitest.config.ts', 'src/vitest/index.ts'],
  },
})
