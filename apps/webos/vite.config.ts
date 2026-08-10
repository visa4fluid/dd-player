import { copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const appRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(appRoot, '../..');
const packageFiles = ['appinfo.json', 'icon.png', 'largeIcon.png'] as const;

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
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: resolve(appRoot, 'dist'),
    emptyOutDir: true,
    // webOS TV Chromium baseline (broad device coverage)
    target: 'chrome68',
    sourcemap: true,
  },
  plugins: [
    {
      name: 'webos-package-files',
      closeBundle() {
        const dist = resolve(appRoot, 'dist');
        for (const file of packageFiles) {
          copyFileSync(resolve(appRoot, file), resolve(dist, file));
        }
      },
    },
  ],
});
