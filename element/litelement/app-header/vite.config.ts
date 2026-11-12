import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const appRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(appRoot, 'demo'),
  server: {
    host: true,
    port: 5180,
    open: true,
  },
  preview: {
    host: true,
    port: 4180,
  },
});
