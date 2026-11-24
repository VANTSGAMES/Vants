/**
 * VANTS PC (Electron) — Aplicación nativa 100% independiente de la web
 * -----------------------------------------------------------------------------
 * - Ventana frameless con barra superior nativa (minimizar, maximizar, cerrar).
 * - Carga el bundle local (web-dist/index.html) sin depender de cargar vants.cc.
 * - Funciones exclusivas de PC:
 *     1) Detector local de clips (Razer Cortex, Capturas de Windows, VALORANT/CS2/Fortnite).
 *     2) Lanzador rápido de juegos (CS2, VALORANT, Fortnite, LoL, Rocket League, Steam).
 *     3) Abrir clips o revelar su carpeta en el Explorador de Windows.
 *     4) Auto-actualización vía GitHub Releases (electron-updater).
 */

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { execFile } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch {
  autoUpdater = null;
}

const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.mov', '.ts', '.m4v', '.webm']);

const OFFICIAL_ANTICHEATS = [
  { id: 'vanguard', name: 'Riot Vanguard', procs: ['vgtray.exe', 'vgc.exe'] },
  { id: 'faceit', name: 'FACEIT Anti-Cheat', procs: ['faceitclient.exe', 'faceitservice.exe'] },
  { id: 'eac', name: 'Easy Anti-Cheat', procs: ['easyanticheat.exe', 'easyanticheat_eos.exe'] },
  { id: 'battleye', name: 'BattlEye', procs: ['beservice.exe'] },
];

const FLAGGED_TOOLS = [
  { label: 'Cheat Engine', match: /^cheatengine/i },
  { label: 'x64dbg / x32dbg', match: /^x(64|32)dbg\.exe$/i },
  { label: 'OllyDbg', match: /^ollydbg\.exe$/i },
  { label: 'Process Hacker / System Informer', match: /^(processhacker|systeminformer)\.exe$/i },
  { label: 'DLL Injector', match: /(extreme.?injector|gh_injector|process.?injector)/i },
  { label: 'ArtMoney / WeMod', match: /^(artmoney|wemod)/i },
];

const GAME_URIS = {
  cs2: 'steam://rungameid/730',
  valorant: 'riotclient://launch-product=valorant&launch-patchline=live',
  fortnite: 'com.epicgames.launcher://apps/Fortnite?action=launch&silent=true',
  lol: 'riotclient://launch-product=league_of_legends&launch-patchline=live',
  warzone: 'steam://rungameid/1938090',
  rocketleague: 'com.epicgames.launcher://apps/Sugar?action=launch&silent=true',
  apex: 'steam://rungameid/1172470',
  steam: 'steam://open/main',
};

let mainWindow = null;

function emitUpdateStatus(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('banter:update-status', {
      currentVersion: app.getVersion(),
      ...payload,
    });
  }
}

function setupAutoUpdater() {
  if (!autoUpdater || !app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => emitUpdateStatus({ state: 'checking' }));
  autoUpdater.on('update-available', (info) =>
    emitUpdateStatus({ state: 'available', version: info && info.version }),
  );
  autoUpdater.on('update-not-available', () => emitUpdateStatus({ state: 'up-to-date' }));
  autoUpdater.on('download-progress', (p) =>
    emitUpdateStatus({ state: 'downloading', percent: Math.round(p.percent || 0) }),
  );
  autoUpdater.on('update-downloaded', (info) =>
    emitUpdateStatus({ state: 'downloaded', version: info && info.version }),
  );
  autoUpdater.on('error', (err) =>
    emitUpdateStatus({ state: 'error', message: String((err && err.message) || 'update_error') }),
  );

  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }, 8000);
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }, 4 * 60 * 60 * 1000);
}

function getAllowedClipRoots() {
  const roots = [];
  const localApp = process.env.LOCALAPPDATA || '';
  if (localApp) {
    roots.push(path.join(localApp, 'Razer', 'Razer Cortex', 'GameClips'));
  }
  roots.push(path.join(os.homedir(), 'Videos'));
  return roots.map((r) => path.resolve(r));
}

function isPathInsideAllowedRoots(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  const resolved = path.resolve(targetPath);
  const roots = getAllowedClipRoots();
  return roots.some((root) => resolved === root || resolved.startsWith(root + path.sep));
}

function scanCortexClipsLocal() {
  const dirs = [];
  const localApp = process.env.LOCALAPPDATA || '';
  if (localApp) {
    const base = path.join(localApp, 'Razer', 'Razer Cortex', 'GameClips');
    if (fs.existsSync(base)) {
      try {
        for (const profile of fs.readdirSync(base, { withFileTypes: true })) {
          if (!profile.isDirectory()) continue;
          const vids = path.join(base, profile.name, 'Videos');
          if (fs.existsSync(vids)) dirs.push(vids);
        }
      } catch {
        // ignorar errores de permisos
      }
      if (!dirs.length) dirs.push(base);
    }
  }
  const videosHome = path.join(os.homedir(), 'Videos');
  for (const sub of ['VALORANT', 'CS2', 'Fortnite', 'Captures', 'Razer Cortex']) {
    const p = path.join(videosHome, sub);
    if (fs.existsSync(p) && !dirs.includes(p)) dirs.push(p);
  }

  const clips = [];
  const walk = (dir, depth = 0) => {
    if (depth > 3 || clips.length >= 40) return;
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full, depth + 1);
      } else if (VIDEO_EXTS.has(path.extname(ent.name).toLowerCase())) {
        try {
          const st = fs.statSync(full);
          clips.push({
            name: ent.name,
            game: path.basename(path.dirname(full)),
            path: full,
            sizeMb: Number((st.size / 1048576).toFixed(1)),
            mtimeMs: st.mtimeMs,
          });
        } catch {
          // ignorar
        }
      }
    }
  };
  for (const d of dirs) walk(d, 0);
  clips.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return { folders: dirs, clips: clips.slice(0, 24) };
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#08080A',
    title: 'VANTS',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Cargar 100% la app local empaquetada (independiente de la web vants.cc)
  const devUrl = process.env.VANTS_DEV_URL || process.env.BANTER_DEV_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    const packagedDist = path.resolve(__dirname, 'web-dist/index.html');
    const workspaceDist = path.resolve(__dirname, '../web/dist/index.html');
    mainWindow.loadFile(packagedDist).catch(() => {
      mainWindow.loadFile(workspaceDist).catch(() => {});
    });
  }

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('vants:win-state', { maximized: true });
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('vants:win-state', { maximized: false });
  });

  // Abrir enlaces externos seguros en el navegador del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── IPC: Controles de ventana ────────────────────────────────────────────────
ipcMain.handle('vants:win-minimize', () => {
  mainWindow?.minimize();
  return { ok: true };
});
ipcMain.handle('vants:win-toggle-maximize', () => {
  if (!mainWindow) return { maximized: false };
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
  return { maximized: mainWindow.isMaximized() };
});
ipcMain.handle('vants:win-close', () => {
  mainWindow?.close();
  return { ok: true };
});
ipcMain.handle('vants:win-is-maximized', () => ({
  maximized: Boolean(mainWindow?.isMaximized()),
}));

// ── IPC: Lanzador rápido de juegos y enlaces externos ────────────────────────
ipcMain.handle('vants:launch-game', async (_evt, gameId) => {
  const uri = GAME_URIS[String(gameId || '').toLowerCase()];
  if (!uri) return { ok: false, error: 'juego_no_soportado' };
  try {
    await shell.openExternal(uri);
    return { ok: true, gameId };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || 'no_instalado') };
  }
});

ipcMain.handle('vants:open-external', async (_evt, url) => {
  const safe = String(url || '').trim();
  if (!/^https:\/\//i.test(safe)) return { ok: false, error: 'url_invalida' };
  try {
    await shell.openExternal(safe);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || 'open_error') };
  }
});

// Ventana modal integrada dentro de VANTS.exe para membresías / perfil sin salir de la app
ipcMain.handle('vants:open-inapp-modal', (_evt, url) => {
  const safe = String(url || '').trim();
  if (!/^https:\/\/(www\.)?vants\.cc(\/|$)/i.test(safe)) {
    return { ok: false, error: 'url_no_permitida' };
  }
  const modal = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 760,
    minHeight: 580,
    parent: mainWindow || undefined,
    modal: false,
    autoHideMenuBar: true,
    backgroundColor: '#08080A',
    title: 'VANTS GAMES · Membresías',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  modal.loadURL(safe).catch(() => {});
  return { ok: true };
});

// ── IPC: Clips locales (Razer Cortex / Capturas) ─────────────────────────────
ipcMain.handle('banter:scan-cortex-clips', () => scanCortexClipsLocal());

ipcMain.handle('vants:open-clip', async (_evt, filePath) => {
  if (!isPathInsideAllowedRoots(filePath) || !fs.existsSync(filePath)) {
    return { ok: false, error: 'ruta_no_permitida' };
  }
  const err = await shell.openPath(filePath);
  return err ? { ok: false, error: err } : { ok: true };
});

ipcMain.handle('vants:reveal-clip', (_evt, filePath) => {
  if (!isPathInsideAllowedRoots(filePath) || !fs.existsSync(filePath)) {
    return { ok: false, error: 'ruta_no_permitida' };
  }
  shell.showItemInFolder(filePath);
  return { ok: true };
});

function listUserProcesses() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      execFile('tasklist', ['/FO', 'CSV', '/NH'], { timeout: 5000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout) => {
        if (err || !stdout) return resolve([]);
        const names = new Set();
        for (const line of String(stdout).split(/\r?\n/)) {
          const m = line.match(/^"([^"]+)"/);
          if (m && m[1]) names.add(m[1].trim().toLowerCase());
        }
        resolve([...names]);
      });
      return;
    }
    execFile('ps', ['-eo', 'comm='], { timeout: 5000 }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      const names = new Set(
        String(stdout)
          .split(/\r?\n/)
          .map((l) => l.trim().toLowerCase())
          .filter(Boolean),
      );
      resolve([...names]);
    });
  });
}

async function runVantsShieldCheck() {
  const procs = await listUserProcesses();
  const procSet = new Set(procs);
  const activeAntiCheats = OFFICIAL_ANTICHEATS.filter((ac) => ac.procs.some((p) => procSet.has(p))).map((ac) => ({
    id: ac.id,
    name: ac.name,
  }));
  const flaggedTools = [];
  for (const proc of procs) {
    for (const rule of FLAGGED_TOOLS) {
      if (rule.match.test(proc)) {
        flaggedTools.push({ label: rule.label, process: proc });
        break;
      }
    }
  }
  const checkedAt = new Date().toISOString();
  const status = flaggedTools.length === 0 ? 'clean' : 'flagged';
  const digest = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        status,
        appVersion: app.getVersion(),
        packaged: app.isPackaged,
        activeAntiCheats: activeAntiCheats.map((a) => a.id),
        flaggedCount: flaggedTools.length,
        checkedAt,
      }),
    )
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();

  return {
    status,
    code: `VANTS-SHIELD-${digest}`,
    checkedAt,
    appVersion: app.getVersion(),
    packaged: app.isPackaged,
    platform: process.platform,
    processCount: procs.length,
    activeAntiCheats,
    flaggedTools,
  };
}

// ── IPC: VANTS Shield (verificación de integridad en modo usuario) ───────────
ipcMain.handle('vants:shield-check', () => runVantsShieldCheck());

// ── IPC: Versión y auto-actualización ────────────────────────────────────────
ipcMain.handle('banter:app-version', () => ({ version: app.getVersion(), packaged: app.isPackaged }));
ipcMain.handle('banter:check-updates', async () => {
  if (!autoUpdater || !app.isPackaged) {
    return { supported: false, currentVersion: app.getVersion() };
  }
  try {
    const res = await autoUpdater.checkForUpdates();
    return { supported: true, currentVersion: app.getVersion(), latestVersion: res?.updateInfo?.version || null };
  } catch (err) {
    return { supported: true, error: String((err && err.message) || 'update_check_failed') };
  }
});
ipcMain.handle('banter:install-update', () => {
  if (autoUpdater && app.isPackaged) {
    autoUpdater.quitAndInstall(false, true);
    return { ok: true };
  }
  return { ok: false };
});

app.whenReady().then(() => {
  createMainWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
