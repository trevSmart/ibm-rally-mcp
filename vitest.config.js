import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
    exclude: ['node_modules/**', 'coverage/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.js', 'index.js'],
      exclude: ['src/**/*.test.js', '**/node_modules/**']
    },
    setupFiles: ['./vitest.setup.js'],
    testTimeout: 10000
  }
})
