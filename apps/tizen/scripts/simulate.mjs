import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = resolve(appRoot, 'dist');
const indexHtml = resolve(distDir, 'index.html');
const wgtPath = resolve(appRoot, 'pkg', 'FluidPlayer.wgt');
const studioPath = process.env.TIZEN_STUDIO_PATH;
const simulatorDir = studioPath
  ? resolve(studioPath, 'tools/sec-tv-simulator')
  : '';
const simulatorBin = simulatorDir ? resolve(simulatorDir, 'simulator') : '';

if (!existsSync(indexHtml) || !existsSync(resolve(distDir, 'config.xml'))) {
  console.error('Build missing. Run: npm run build:tizen');
  process.exit(1);
}

const pack = spawnSync(process.execPath, [resolve(appRoot, 'scripts/package-wgt.mjs')], {
  cwd: appRoot,
  stdio: 'inherit',
  env: process.env,
});
if (pack.status !== 0) process.exit(pack.status ?? 1);

console.log('');
console.log('Samsung TV Web Simulator');
console.log(`  app: ${indexHtml}`);
console.log(`  .wgt: ${wgtPath}`);
console.log('');

if (!simulatorBin || !existsSync(simulatorBin)) {
  console.log('TIZEN_STUDIO_PATH non impostato o simulator assente.');
  console.log('1. Installa Tizen Studio + TV Extension + Samsung TV Web Simulator');
  console.log('2. In .env: TIZEN_STUDIO_PATH=/path/to/tizen-studio');
  console.log('3. Oppure a mano:');
  console.log(
    `   cd "$TIZEN_STUDIO_PATH/tools/sec-tv-simulator" && ./simulator --file "${indexHtml}"`,
  );
  process.exit(0);
}

const fileArgs = ['--platform', 'tizentv', '--file', indexHtml];

/** @param {string[]} args */
function runSimulator(args) {
  return spawn(simulatorBin, args, {
    cwd: simulatorDir,
    stdio: 'ignore',
    detached: true,
    env: process.env,
  });
}

// Chiude un'istanza già aperta (single-instance → evento --close).
runSimulator(['--close']).unref();
await sleep(800);

// Avvio Simulator + path app (bootstrap / --file).
runSimulator(fileArgs).unref();

// Seconda invocazione: con single-instance attiva l'evento "open"
// e forza install+launch dell'html (affidabile anche dopo il primo avvio).
await sleep(2500);
runSimulator(fileArgs).unref();

console.log('Simulator avviato: l’app dovrebbe aprirsi automaticamente.');
console.log('(Se resta sulla home TV, tasto destro → Install Application → .wgt)');
process.exit(0);
