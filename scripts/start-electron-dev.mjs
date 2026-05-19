import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';

const angularProcess = spawnNpmScript('start');

let electronProcess = null;
let shuttingDown = false;

console.log('[electron-dev] aguardando servidor Angular...');

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

angularProcess.on('exit', (code) => {
  if (!shuttingDown) {
    process.exitCode = code ?? 1;
  }
  shutdown();
});

waitForDevServer().then((url) => {
  if (!url || shuttingDown) {
    return;
  }

  console.log(`[electron-dev] servidor Angular detectado em ${url}`);

  electronProcess = spawnNpmScript('electron', {
    CHOCOBO_ELECTRON_URL: url
  });

  console.log('[electron-dev] Electron iniciado.');

  electronProcess.on('exit', (code) => {
    process.exitCode = code ?? 0;
    shutdown();
  });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
  shutdown();
});

async function waitForDevServer() {
  const candidates = [4200, 4300];

  for (let attempt = 0; attempt < 240; attempt += 1) {
    for (const port of candidates) {
      if (await isPortOpen(port)) {
        return `http://127.0.0.1:${port}`;
      }
    }

    await delay(500);
  }

  throw new Error('Nao foi possivel localizar o servidor Angular em 4200 ou 4300.');
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port }, () => {
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

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function spawnNpmScript(script, extraEnv = {}) {
  if (process.platform === 'win32') {
    return spawn('cmd.exe', ['/d', '/s', '/c', `npm.cmd run ${script}`], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
      env: {
        ...process.env,
        ...extraEnv
      }
    });
  }

  return spawn('npm', ['run', script], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      ...extraEnv
    }
  });
}

function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill();
  }

  if (!angularProcess.killed) {
    angularProcess.kill();
  }
}