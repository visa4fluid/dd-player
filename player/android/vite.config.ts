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
    port: 5175,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4175,
    strictPort: true,
  },
  build: {
    outDir: resolve(appRoot, 'dist'),
    emptyOutDir: true,
    // Android WebView (API 29+ / Chromium ~100). MSE e media element per il signage.
    target: 'chrome100',
    sourcemap: true,
    assetsInlineLimit: 0,
  },
});
