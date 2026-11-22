const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('banterDesktop', {
  platform: 'desktop-electron',
  /** Reabre el modal CMP de NitroPay (obligatorio para cumplimiento GDPR en Electron). */
  resurfaceCmp: () => ipcRenderer.invoke('banter:resurface-cmp'),
  /** Activa o desactiva el carril lateral de anuncios NitroPay según suscripción Banter Nitro. */
  setAdFree: (adFree) => ipcRenderer.invoke('banter:set-ad-free', Boolean(adFree)),
  getAppVersion: () => ipcRenderer.invoke('banter:app-version'),
  /** Auto-actualización vía GitHub Releases (electron-updater). */
  checkForUpdates: () => ipcRenderer.invoke('banter:check-updates'),
  installUpdate: () => ipcRenderer.invoke('banter:install-update'),
  onUpdateStatus: (listener) => {
    const handler = (_evt, payload) => listener(payload);
    ipcRenderer.on('banter:update-status', handler);
    return () => ipcRenderer.removeListener('banter:update-status', handler);
  },
  /** Escanea clips recientes en Razer Cortex (y carpetas compatibles) en Windows. */
  scanCortexClips: () => ipcRenderer.invoke('banter:scan-cortex-clips'),
});
