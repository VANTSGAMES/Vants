/**
 * Adaptador de monetización Android (Capacitor + @capacitor-community/admob).
 * Se desactiva completamente en cuanto el usuario tiene Banter Nitro activo.
 */

export const ADMOB_BANNER_ID_ANDROID =
  String(import.meta.env.VITE_ADMOB_BANNER_ID || "").trim() ||
  "ca-app-pub-3940256099942544/6300978111"; // ID de prueba oficial de Google AdMob

function getNativeAdMob(): any | null {
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== "android") return null;
  return cap.Plugins?.AdMob || null;
}

export async function syncAndroidAdMobBanner(adFree: boolean): Promise<"hidden" | "shown" | "web-preview"> {
  const admob = getNativeAdMob();
  if (!admob) return "web-preview";

  if (adFree) {
    await admob.removeBanner?.().catch(() => {});
    return "hidden";
  }

  await admob.initialize?.({ initializeForTesting: ADMOB_BANNER_ID_ANDROID.includes("3940256099942544") }).catch(() => {});
  await admob.showBanner?.({
    adId: ADMOB_BANNER_ID_ANDROID,
    adSize: "ADAPTIVE_BANNER",
    position: "BOTTOM_CENTER",
    margin: 0,
    isTesting: ADMOB_BANNER_ID_ANDROID.includes("3940256099942544"),
  });
  return "shown";
}
