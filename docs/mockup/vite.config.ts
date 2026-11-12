import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const mockupRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(mockupRoot, '../..');

export default defineConfig({
  root: mockupRoot,
  base: './',
  appType: 'spa',
  resolve: {
    alias: {
      '@fluid-element/app-header': resolve(repoRoot, 'element/litelement/app-header/src/index.ts'),
      '@fluid-element/app-navigation-drawer': resolve(
        repoRoot,
        'element/litelement/app-navigation-drawer/src/index.ts',
      ),
      '@fluid-element/lit-grid': resolve(repoRoot, 'element/litelement/lit-grid/src/index.ts'),
      '@fluid-element/lit-pagination': resolve(repoRoot, 'element/litelement/lit-pagination/src/index.ts'),
      '@fluid-element/lit-tooltip': resolve(repoRoot, 'element/litelement/lit-tooltip/src/index.ts'),
    },
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    },
  },
  server: {
    host: true,
    port: 5182,
    open: '/mockup.html',
  },
  preview: {
    host: true,
    port: 4182,
    open: '/',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    assetsInlineLimit: 8_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(mockupRoot, 'mockup.html'),
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  plugins: [
    viteSingleFile({
      removeViteModuleLoader: true,
      useRecommendedBuildConfig: false,
    }),
    {
      name: 'mockup-spa-index',
      closeBundle() {
        const from = resolve(mockupRoot, 'dist/mockup.html');
        if (!existsSync(from)) return;
        let html = readFileSync(from, 'utf8');
        html = html.split('<script type="module">').join('<script>');
        const start = html.indexOf('<script>');
        const end = html.indexOf('</script>', start);
        const bodyClose = html.lastIndexOf('</body>');
        if (start >= 0 && end > start && bodyClose > end) {
          const body = html.slice(start + '<script>'.length, end);
          const wrapped = `<script>(function(){\n${body}\n})();</script>`;
          html = html.slice(0, start) + html.slice(end + '</script>'.length);
          const insertAt = html.lastIndexOf('</body>');
          html = html.slice(0, insertAt) + wrapped + '\n  ' + html.slice(insertAt);
        }
        writeFileSync(from, html);
        writeFileSync(resolve(mockupRoot, 'dist/index.html'), html);
      },
    },
  ],
});
