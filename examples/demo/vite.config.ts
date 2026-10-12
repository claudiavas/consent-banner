import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The demo consumes the library straight from its source, so edits to ../../src
// show up without rebuilding the package.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@claudiavas/consent-banner': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
});
