const { contextBridge, ipcRenderer } = require('electron');

const desktopApi = {
  platform: 'desktop-electron',
  // Controles de ventana nativa sin bordes (frameless)
  minimize: () => ipcRenderer.invoke('vants:win-minimize'),
  toggleMaximize: () => ipcRenderer.invoke('vants:win-toggle-maximize'),
  close: () => ipcRenderer.invoke('vants:win-close'),
  isMaximized: () => ipcRenderer.invoke('vants:win-is-maximized'),
  onWindowState: (listener) => {
    const handler = (_evt, state) => listener(state);
    ipcRenderer.on('vants:win-state', handler);
    return () => ipcRenderer.removeListener('vants:win-state', handler);
  },

  // Lanzador rápido de juegos de PC y enlaces externos seguros
  launchGame: (gameId) => ipcRenderer.invoke('vants:launch-game', String(gameId || '')),
  openExternal: (url) => ipcRenderer.invoke('vants:open-external', String(url || '')),

  // Detector y gestión de clips locales (Razer Cortex / Capturas de Windows)
  scanCortexClips: () => ipcRenderer.invoke('banter:scan-cortex-clips'),
  openClipFile: (filePath) => ipcRenderer.invoke('vants:open-clip', String(filePath || '')),
  revealClipFolder: (filePath) => ipcRenderer.invoke('vants:reveal-clip', String(filePath || '')),

  // VANTS Shield (verificación de integridad competitiva en modo usuario)
  runShieldCheck: () => ipcRenderer.invoke('vants:shield-check'),

  // Versión y auto-actualización vía GitHub Releases (electron-updater)
  getAppVersion: () => ipcRenderer.invoke('banter:app-version'),
  checkForUpdates: () => ipcRenderer.invoke('banter:check-updates'),
  installUpdate: () => ipcRenderer.invoke('banter:install-update'),
  onUpdateStatus: (listener) => {
    const handler = (_evt, payload) => listener(payload);
    ipcRenderer.on('banter:update-status', handler);
    return () => ipcRenderer.removeListener('banter:update-status', handler);
  },
};

contextBridge.exposeInMainWorld('vantsDesktop', desktopApi);
contextBridge.exposeInMainWorld('banterDesktop', desktopApi);
