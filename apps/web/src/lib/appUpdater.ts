import type { BanterPlatform } from "@banter/core";

export interface UpdateStatusPayload {
  state: "idle" | "checking" | "available" | "downloading" | "downloaded" | "up-to-date" | "error";
  currentVersion?: string;
  version?: string;
  percent?: number;
  message?: string;
  downloadUrl?: string;
}

export interface DetectedCortexClip {
  name: string;
  game: string;
  path: string;
  sizeMb: number;
  mtimeMs: number;
}

const GITHUB_LATEST_RELEASE_API = "https://api.github.com/repos/VANTSGAMES/banter/releases/latest";

export function subscribeDesktopUpdates(cb: (status: UpdateStatusPayload) => void): () => void {
  if (typeof window !== "undefined" && window.banterDesktop?.onUpdateStatus) {
    return window.banterDesktop.onUpdateStatus((raw) => cb(raw as unknown as UpdateStatusPayload));
  }
  return () => {};
}

export async function triggerInstallDesktopUpdate(): Promise<void> {
  if (typeof window !== "undefined" && window.banterDesktop?.installUpdate) {
    await window.banterDesktop.installUpdate();
  }
}

export async function scanDesktopCortexClips(): Promise<{ folders: string[]; clips: DetectedCortexClip[] }> {
  if (typeof window !== "undefined" && window.banterDesktop?.scanCortexClips) {
    return window.banterDesktop.scanCortexClips();
  }
  return { folders: [], clips: [] };
}

/**
 * Comprueba actualizaciones según plataforma:
 * - Desktop Electron: electron-updater (GitHub Releases latest.yml, descarga automática en segundo plano).
 * - Android Capacitor: Google Play In-App Updates (@capawesome/capacitor-app-update) en modo FLEXIBLE.
 * - Web: consulta la última Release de GitHub para ofrecer el instalador actualizado.
 */
export async function checkPlatformUpdate(platform: BanterPlatform): Promise<UpdateStatusPayload> {
  if (platform === "desktop-electron" && typeof window !== "undefined" && window.banterDesktop?.checkForUpdates) {
    const res = await window.banterDesktop.checkForUpdates();
    if (res.error) return { state: "error", currentVersion: res.currentVersion, message: res.error };
    if (res.latestVersion && res.currentVersion && res.latestVersion !== res.currentVersion) {
      return { state: "available", currentVersion: res.currentVersion, version: res.latestVersion };
    }
    return { state: "up-to-date", currentVersion: res.currentVersion };
  }

  if (platform === "android-capacitor") {
    try {
      const cap = (globalThis as any).Capacitor;
      const appUpdate = cap?.Plugins?.AppUpdate;
      if (appUpdate?.getAppUpdateInfo) {
        const info = await appUpdate.getAppUpdateInfo();
        // updateAvailability === 2 (UPDATE_AVAILABLE en Google Play Core)
        if (info?.updateAvailability === 2) {
          if (info.flexibleUpdateAllowed && appUpdate.startFlexibleUpdate) {
            await appUpdate.startFlexibleUpdate();
            return {
              state: "downloading",
              currentVersion: String(info.currentVersionName || ""),
              version: String(info.availableVersionName || "nueva"),
            };
          }
          if (info.immediateUpdateAllowed && appUpdate.performImmediateUpdate) {
            await appUpdate.performImmediateUpdate();
          }
          return {
            state: "available",
            currentVersion: String(info.currentVersionName || ""),
            version: String(info.availableVersionName || "nueva"),
          };
        }
        return { state: "up-to-date", currentVersion: String(info?.currentVersionName || "1.0.0") };
      }
    } catch {
      // Fallback limpio fuera del runtime nativo Android
    }
  }

  try {
    const r = await fetch(GITHUB_LATEST_RELEASE_API, { headers: { Accept: "application/vnd.github+json" } });
    if (r.ok) {
      const j = (await r.json()) as { tag_name?: string; html_url?: string };
      return {
        state: "up-to-date",
        version: (j.tag_name || "v1.0.0").replace(/^v/, ""),
        downloadUrl: j.html_url || "https://github.com/VANTSGAMES/banter/releases/latest",
      };
    }
  } catch {
    // offline
  }
  return { state: "idle" };
}
