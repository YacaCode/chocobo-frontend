const { app, BrowserWindow, Menu, nativeTheme, shell } = require('electron');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const devUrl = process.env.CHOCOBO_ELECTRON_URL || '';
const candidateDevUrls = ['http://127.0.0.1:4300', 'http://127.0.0.1:4200'];

async function createWindow() {
  const windowBackground = nativeTheme.shouldUseDarkColors ? '#090f19' : '#f7f9fc';

  const win = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 560,
    autoHideMenuBar: true,
    backgroundColor: windowBackground,
    show: false,
    title: 'Chocobo',
    icon: path.join(__dirname, '..', 'public', 'chocobo-logo.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.once('ready-to-show', () => win.show());
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[electron] did-fail-load', { errorCode, errorDescription, validatedURL });
  });
  win.webContents.on('did-finish-load', () => {
    console.log('[electron] did-finish-load');
  });
  win.on('unresponsive', () => {
    console.warn('[electron] window unresponsive');
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  const startupUrl = await resolveStartupUrl();
  console.log('[electron] startup url', startupUrl ?? '(fallback)');

  if (startupUrl) {
    void win.loadURL(startupUrl);
    return;
  }

  const builtIndex = path.join(__dirname, '..', 'dist', 'chocobo-frontend', 'browser', 'index.html');

  if (fs.existsSync(builtIndex)) {
    void win.loadFile(builtIndex);
    return;
  }

  void win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Chocobo</title>
        <style>
          body {
            margin: 0;
            font-family: system-ui, sans-serif;
            background: #0e1623;
            color: #edf2f7;
            display: grid;
            min-height: 100vh;
            place-items: center;
            padding: 24px;
          }
          main {
            max-width: 640px;
            border: 1px solid #314155;
            border-radius: 14px;
            background: #182232;
            padding: 24px;
            box-shadow: 0 20px 70px rgba(0, 0, 0, 0.35);
          }
          h1 { margin: 0 0 12px; font-size: 1.5rem; }
          p { margin: 0 0 10px; line-height: 1.5; color: #aab6c7; }
          code { color: #f9a825; }
        </style>
      </head>
      <body>
        <main>
          <h1>Chocobo Desktop</h1>
          <p>O Electron nao encontrou o servidor Angular local nem o build estatico.</p>
          <p>Abra o frontend com <code>npm run start</code> ou gere o build com <code>npm run build</code>.</p>
        </main>
      </body>
    </html>
  `));
}

app.whenReady().then(async () => {
  nativeTheme.themeSource = 'system';
  Menu.setApplicationMenu(null);
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

nativeTheme.on('updated', () => {
  const windowBackground = nativeTheme.shouldUseDarkColors ? '#090f19' : '#f7f9fc';
  BrowserWindow.getAllWindows().forEach((window) => {
    window.setBackgroundColor(windowBackground);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

async function resolveStartupUrl() {
  if (devUrl) {
    return devUrl;
  }

  if (app.isPackaged) {
    return null;
  }

  for (const candidateUrl of candidateDevUrls) {
    if (await isPortOpen(candidateUrl)) {
      return candidateUrl;
    }
  }

  return null;
}

function isPortOpen(url) {
  const parsed = new URL(url);
  const port = Number(parsed.port);

  return new Promise((resolve) => {
    const socket = net.createConnection({ host: parsed.hostname, port }, () => {
      socket.end();
      resolve(true);
    });

    socket.setTimeout(250, () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => resolve(false));
  });
}
