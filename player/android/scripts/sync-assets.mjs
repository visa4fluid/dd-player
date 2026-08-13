import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = resolve(appRoot, 'dist');
const assetsDir = resolve(appRoot, 'native/app/src/main/assets/public');

if (!existsSync(resolve(distDir, 'index.html'))) {
  console.error('Build missing. Run: npm run build:android');
  process.exit(1);
}

rmSync(assetsDir, { recursive: true, force: true });
mkdirSync(assetsDir, { recursive: true });
cpSync(distDir, assetsDir, { recursive: true });
console.log(`Copied Vite dist → ${assetsDir}`);
