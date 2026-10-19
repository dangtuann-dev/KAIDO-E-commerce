import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./test/mocks/server-only.js', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['src/**/__tests__/**/*.test.js', 'test/**/*.test.js'],
  },
});
