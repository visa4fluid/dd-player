import { mkdirSync, existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = resolve(appRoot, 'dist');
const pkgDir = resolve(appRoot, 'pkg');
const wgtPath = resolve(pkgDir, 'FluidPlayer.wgt');

if (!existsSync(resolve(distDir, 'config.xml')) || !existsSync(resolve(distDir, 'index.html'))) {
  console.error('Missing player/tizen/dist (run build first).');
  process.exit(1);
}

mkdirSync(pkgDir, { recursive: true });

const zip = spawnSync('zip', ['-qr', wgtPath, '.'], {
  cwd: distDir,
  stdio: 'inherit',
});

if (zip.error?.code === 'ENOENT') {
  console.error('Command `zip` not found. Install zip (e.g. sudo apt install zip).');
  process.exit(1);
}

if (zip.status !== 0) {
  process.exit(zip.status ?? 1);
}

console.log(`Created ${relative(process.cwd(), wgtPath)} (unsigned)`);
console.log(
  'Per TV/Emulator firmato: tizen package -t wgt -s <profile> -- player/tizen/dist',
);
