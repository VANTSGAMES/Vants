const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('banterDesktop', {
  platform: 'desktop-electron',
  /** Reabre el modal CMP de NitroPay (obligatorio para cumplimiento GDPR en Electron). */
  resurfaceCmp: () => ipcRenderer.invoke('banter:resurface-cmp'),
  /** Activa o desactiva el carril lateral de anuncios NitroPay según suscripción Banter Nitro. */
  setAdFree: (adFree) => ipcRenderer.invoke('banter:set-ad-free', Boolean(adFree)),
  getAppVersion: () => ipcRenderer.invoke('banter:app-version'),
});
