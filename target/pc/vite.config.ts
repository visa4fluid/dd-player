import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const appRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(appRoot, '../..');

export default defineConfig({
  root: appRoot,
  base: './',
  resolve: {
    alias: {
      '@fluid': resolve(repoRoot, 'src'),
    },
  },
  server: {
    host: true,
    port: 5176,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4176,
    strictPort: true,
  },
  build: {
    outDir: resolve(appRoot, 'dist'),
    emptyOutDir: true,
    target: 'chrome134',
    sourcemap: true,
  },
});
