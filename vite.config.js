/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Wave 4.4-C2b: per-file environment override pattern. Global env stays
// node (fast; existing tests need no DOM). Component tests opt into
// jsdom individually via the `// @vitest-environment jsdom` file-header
// directive. setupFiles always runs — its jest-dom matcher import is
// a no-op when the test environment is node.

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    setupFiles: ['./src/test/setup.js'],
  },
})
