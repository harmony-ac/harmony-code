import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Build for Node.js environment
    target: 'node18',
    // Output directory
    outDir: 'out',
    // Entry point
    lib: {
      entry: 'src/extension.ts',
      formats: ['cjs'],
      fileName: () => 'extension.js',
    },
    // Don't minify for easier debugging
    minify: false,
    // Generate sourcemaps for debugging
    sourcemap: true,
    rollupOptions: {
      // External modules that shouldn't be bundled
      external: ['vscode', 'fs', 'path', 'child_process'],
      output: {
        // CommonJS format for VS Code extensions
        format: 'cjs',
      },
    },
  },
  // Define environment variables for the extension
  define: {
    // Required for some dependencies
    global: 'globalThis',
  },
})
