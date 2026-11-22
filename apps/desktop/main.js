/**
 * Banter Desktop (Electron) — Cumplimiento oficial NitroPay by Overwolf
 * -----------------------------------------------------------------------------
 * Implementa todos los requisitos de https://nitropay.com/docs/electron-apps-and-nitropay/:
 *   1. Anuncios servidos desde un dominio aprobado (BANTER_ORIGIN/app/nitro-ads.html), nunca file://.
 *   2. Ventana modal CMP (BANTER_ORIGIN/app/cmp.html) en la misma partición persist:adpartition.
 *   3. Eliminación del nombre de app y "Electron/x.y.z" del User-Agent del BrowserView de anuncios.
 *   4. Cabecera httpReferrer apuntando al dominio aprobado.
 *   5. Ancho del BrowserView >= 1280px para evitar clasificación errónea como móvil.
 *   6. Botón de preferencias GDPR vía IPC (`banter:resurface-cmp` -> cmp.html?resurface=1).
 *   7. Monetización híbrida: `banter:set-ad-free(true)` desmonta el BrowserView al instante para suscriptores Nitro.
 */

const { app, BrowserWindow, BrowserView, ipcMain } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch {
  autoUpdater = null;
}

const BANTER_ORIGIN = (process.env.BANTER_WEB_ORIGIN || 'https://vants.cc').replace(/\/$/, '');
const SITE_ID = (process.env.NITROPAY_SITE_ID || '').trim();
const DEMO_FLAG = SITE_ID ? '' : '&demo=1';
const AD_URL = `${BANTER_ORIGIN}/app/nitro-ads.html?siteId=${encodeURIComponent(SITE_ID || 'demo')}${DEMO_FLAG}`;
const CMP_URL = `${BANTER_ORIGIN}/app/cmp.html`;
const REFERRER = `${BANTER_ORIGIN}/`;
const AD_RAIL_WIDTH = 325;
const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.mov', '.ts', '.m4v', '.webm']);

let mainWindow = null;
let adView = null;
let isAdFree = false;
let cmpCompleted = false;

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

  // Comprueba al arrancar y cada 4 horas mientras la app esté abierta.
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }, 8000);
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }, 4 * 60 * 60 * 1000);
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
  for (const sub of ['VALORANT', 'Captures', 'Razer Cortex']) {
    const p = path.join(videosHome, sub);
    if (fs.existsSync(p) && !dirs.includes(p)) dirs.push(p);
  }

  const clips = [];
  const walk = (dir, depth = 0) => {
    if (depth > 3 || clips.length >= 25) return;
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
  return { folders: dirs, clips: clips.slice(0, 12) };
}

function positionAdView() {
  if (!mainWindow || !adView || isAdFree) return;
  const bounds = mainWindow.getContentBounds();
  // Ancho lógico >= 1280px según recomendación oficial NitroPay Electron.
  adView.setBounds({
    x: Math.max(0, bounds.width - AD_RAIL_WIDTH),
    y: 10,
    width: 1280,
    height: Math.max(540, bounds.height - 20),
  });
}

function attachAdView() {
  if (!mainWindow || isAdFree) return;
  if (!adView) {
    adView = new BrowserView({
      webPreferences: {
        partition: 'persist:adpartition',
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    const re = new RegExp(`(${app.getName()}|Electron)/[\\d\\.]+ `, 'g');
    adView.webContents.setUserAgent(adView.webContents.getUserAgent().replace(re, ''));
  }
  mainWindow.setBrowserView(adView);
  positionAdView();
  adView.webContents.loadURL(AD_URL, { httpReferrer: REFERRER }).catch(() => {});
}

function detachAdView() {
  if (!mainWindow || !adView) return;
  try {
    mainWindow.removeBrowserView(adView);
  } catch {
    // ya desmontado
  }
  try {
    adView.webContents.loadURL('about:blank').catch(() => {});
  } catch {
    // ignorar
  }
}

function createCmpModal(resurface = false) {
  if (!mainWindow) return null;
  const cmp = new BrowserWindow({
    width: 1120,
    height: 600,
    center: true,
    closable: resurface,
    skipTaskbar: true,
    modal: true,
    titleBarStyle: 'hidden',
    transparent: true,
    hasShadow: false,
    frame: false,
    movable: false,
    fullscreen: false,
    parent: mainWindow,
    webPreferences: {
      partition: 'persist:adpartition',
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  cmp.on('closed', () => {
    cmpCompleted = true;
    if (!isAdFree) {
      attachAdView();
    }
  });

  const target = resurface ? `${CMP_URL}?resurface=1` : CMP_URL;
  cmp.loadURL(target).catch(() => {
    // En desarrollo offline sin dominio remoto aún publicado, cierra el modal limpiamente.
    if (!cmp.isDestroyed()) cmp.close();
  });
  return cmp;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0a0a0b',
    title: 'Banter Desktop — VANTS Ecosystem',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.BANTER_DEV_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    const packagedDist = path.resolve(__dirname, 'web-dist/index.html');
    const workspaceDist = path.resolve(__dirname, '../web/dist/index.html');
    mainWindow.loadFile(packagedDist).catch(() => {
      mainWindow.loadFile(workspaceDist).catch(() => {
        mainWindow.loadURL(BANTER_ORIGIN);
      });
    });
  }

  mainWindow.on('resize', positionAdView);
  mainWindow.on('closed', () => {
    mainWindow = null;
    adView = null;
  });

  // Lanza CMP primero; solo al cerrarse se cargan los anuncios NitroPay (regla GDPR).
  if (!isAdFree) {
    createCmpModal(false);
  }
}

ipcMain.handle('banter:resurface-cmp', () => {
  createCmpModal(true);
});

ipcMain.handle('banter:set-ad-free', (_evt, nextAdFree) => {
  isAdFree = Boolean(nextAdFree);
  if (isAdFree) {
    detachAdView();
  } else if (cmpCompleted) {
    attachAdView();
  } else {
    createCmpModal(false);
  }
});

ipcMain.handle('banter:app-version', () => app.getVersion());

ipcMain.handle('banter:check-updates', async () => {
  if (!autoUpdater || !app.isPackaged) {
    return { supported: false, currentVersion: app.getVersion(), state: 'dev' };
  }
  try {
    const res = await autoUpdater.checkForUpdates();
    return {
      supported: true,
      currentVersion: app.getVersion(),
      latestVersion: res && res.updateInfo ? res.updateInfo.version : app.getVersion(),
    };
  } catch (err) {
    return { supported: true, currentVersion: app.getVersion(), error: String((err && err.message) || 'error') };
  }
});

ipcMain.handle('banter:install-update', () => {
  if (autoUpdater && app.isPackaged) {
    autoUpdater.quitAndInstall(false, true);
  }
});

ipcMain.handle('banter:scan-cortex-clips', () => scanCortexClipsLocal());

app.whenReady().then(() => {
  createMainWindow();
  setupAutoUpdater();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
