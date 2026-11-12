import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const host = '127.0.0.1';
const port = 5176;
const rendererUrl = `http://${host}:${port}`;

function waitForPort(timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolveWait, reject) => {
    const attempt = () => {
      const socket = createConnection({ host, port }, () => {
        socket.end();
        resolveWait(undefined);
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Vite non risponde su ${rendererUrl}`));
          return;
        }
        setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

function run(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: appRoot,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return child;
}

const tsc = run('npx', ['tsc', '-p', 'tsconfig.electron.json']);
tsc.on('exit', async (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  const vite = run('npx', ['vite']);
  const stop = () => {
    vite.kill('SIGTERM');
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  try {
    await waitForPort();
  } catch (error) {
    vite.kill('SIGTERM');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const electronArgs = ['.'];
  if (process.platform === 'linux') {
    electronArgs.push('--no-sandbox');
  }
  const electron = run('npx', ['electron', ...electronArgs], {
    ELECTRON_DEV: '1',
    ELECTRON_RENDERER_URL: rendererUrl,
  });
  electron.on('exit', (electronCode) => {
    vite.kill('SIGTERM');
    process.exit(electronCode ?? 0);
  });
});
