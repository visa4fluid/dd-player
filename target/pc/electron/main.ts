import { app, BrowserWindow } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.ELECTRON_DEV === '1';
const rendererUrl = process.env.ELECTRON_RENDERER_URL ?? 'http://127.0.0.1:5176';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#0F1C24',
    show: false,
    webPreferences: {
      preload: join(appRoot, '../electron/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  if (isDev) {
    void window.loadURL(rendererUrl);
    window.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  void window.loadFile(join(appRoot, '../dist/index.html'));
}

void app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
