import { defineConfig } from 'vite'
import harmonyPlugin from './src/vitest/index.ts'

export default defineConfig({
  plugins: [harmonyPlugin({ watchDir: 'src' })],
})
