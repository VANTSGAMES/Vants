import type { NitroPayPlacementConfig } from "@banter/core";

declare global {
  interface Window {
    nitroAds?: {
      createAd: (id: string, config: Record<string, unknown>) => Promise<unknown>;
      addUserToken?: (token: string, type?: string) => void;
      queue: unknown[];
    };
    __cmp?: (cmd: string) => void;
  }
}

export const NITROPAY_SITE_ID = String(import.meta.env.VITE_NITROPAY_SITE_ID || "").trim();
export const NITROPAY_IS_LIVE = /^\d{3,10}$/.test(NITROPAY_SITE_ID);

let scriptInjected = false;

/**
 * Carga el script oficial de NitroPay SIEMPRE desde https://s.nitropay.com/ads-<ID>.js
 * con data-cfasync="false" (nunca alojado localmente).
 */
export function ensureNitroPayScript(): boolean {
  if (typeof window === "undefined") return false;

  if (!window.nitroAds) {
    window.nitroAds = {
      createAd: function (...args: unknown[]) {
        return new Promise((resolve) => {
          window.nitroAds?.queue.push(["createAd", args, resolve]);
        });
      },
      addUserToken: function (...args: unknown[]) {
        window.nitroAds?.queue.push(["addUserToken", args]);
      },
      queue: [],
    };
  }

  if (!NITROPAY_IS_LIVE) {
    return false; // Modo demo/preview hasta configurar VITE_NITROPAY_SITE_ID
  }

  if (!scriptInjected) {
    scriptInjected = true;
    const s = document.createElement("script");
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    s.src = `https://s.nitropay.com/ads-${NITROPAY_SITE_ID}.js`;
    document.head.appendChild(s);
  }
  return true;
}

export async function mountNitroPayPlacement(cfg: NitroPayPlacementConfig): Promise<boolean> {
  const ready = ensureNitroPayScript();
  if (!ready || !window.nitroAds) return false;
  await window.nitroAds.createAd(cfg.id, {
    format: cfg.format,
    sizes: cfg.sizes,
    demo: cfg.demo,
    refreshTime: cfg.refreshTime,
    skipBidders: cfg.skipBidders,
    report: cfg.report,
  });
  return true;
}

/** Reabre el modal CMP de consentimiento GDPR (Web o Electron vía IPC). */
export async function resurfacePrivacyConsent(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.banterDesktop?.resurfaceCmp) {
    await window.banterDesktop.resurfaceCmp();
    return;
  }
  if (typeof window.__cmp === "function") {
    window.__cmp("showModal");
  }
}
