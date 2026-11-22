export type BanterPlatform = "web" | "desktop-electron" | "android-capacitor";

declare global {
  interface Window {
    banterDesktop?: {
      platform: "desktop-electron";
      resurfaceCmp: () => Promise<void>;
      setAdFree: (adFree: boolean) => Promise<void>;
      getAppVersion: () => Promise<string>;
      checkForUpdates?: () => Promise<{ supported: boolean; currentVersion?: string; latestVersion?: string; error?: string }>;
      installUpdate?: () => Promise<void>;
      onUpdateStatus?: (cb: (status: Record<string, unknown>) => void) => () => void;
      scanCortexClips?: () => Promise<{
        folders: string[];
        clips: Array<{ name: string; game: string; path: string; sizeMb: number; mtimeMs: number }>;
      }>;
    };
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }
}

export function detectPlatform(): BanterPlatform {
  if (typeof window === "undefined") return "web";
  if (window.banterDesktop?.platform === "desktop-electron") {
    return "desktop-electron";
  }
  const capPlatform = window.Capacitor?.getPlatform?.();
  if (window.Capacitor?.isNativePlatform?.() && capPlatform === "android") {
    return "android-capacitor";
  }
  return "web";
}

export function platformLabel(platform: BanterPlatform): string {
  switch (platform) {
    case "desktop-electron":
      return "Escritorio (Electron)";
    case "android-capacitor":
      return "Android (Capacitor)";
    default:
      return "Web";
  }
}
