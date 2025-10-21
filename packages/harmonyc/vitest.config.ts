import { defineConfig } from 'vite'
import harmonyPlugin from './src/vitest/index.ts'

export default defineConfig({
  plugins: [harmonyPlugin({})],
  test: {
    include: ['src/**/*.harmony'],
    forceRerunTriggers: ['vitest.config.ts', 'src/vitest/index.ts'],
  },
})
