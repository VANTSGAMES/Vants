import type { BanterPlatform } from "./platform.ts";
import { BANTER_PLANS, type BanterPlanId } from "./subscriptions.ts";

export type AdNetworkProvider = "none" | "nitropay-web" | "nitropay-electron" | "admob-android";

export interface MonetizationDecision {
  platform: BanterPlatform;
  planId: BanterPlanId;
  adFree: boolean;
  adProvider: AdNetworkProvider;
  billingChannel: "stripe" | "google-play-billing";
  requiresCmpResurfaceButton: boolean;
  /** En Electron, NitroPay exige excluir el bidder 'google' en createAd(). */
  nitroSkipBidders: string[];
  reason: string;
}

export interface NitroPayPlacementConfig {
  id: string;
  format: "display" | "video-nc" | "anchor";
  sizes: Array<[number, number]>;
  demo: boolean;
  refreshTime: number;
  skipBidders: string[];
  report: {
    enabled: boolean;
    position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    wording: string;
  };
}

/**
 * Motor híbrido de monetización Banter:
 * - Si el usuario tiene Banter Nitro o Nitro+, se apagan TODOS los anuncios en todas las plataformas.
 * - En Web y Escritorio (Electron): exclusividad programática con NitroPay (Overwolf), sin redes competidoras.
 * - En Android (Capacitor): Google AdMob + app-ads.txt + Google Play Billing (cumple Google Play y NitroPay).
 */
export function resolveMonetization(
  platform: BanterPlatform,
  planId: BanterPlanId,
): MonetizationDecision {
  const plan = BANTER_PLANS[planId];
  const billingChannel = platform === "android-capacitor" ? "google-play-billing" : "stripe";

  if (plan.adFree) {
    return {
      platform,
      planId,
      adFree: true,
      adProvider: "none",
      billingChannel,
      requiresCmpResurfaceButton: platform !== "android-capacitor",
      nitroSkipBidders: [],
      reason: `Suscripción ${plan.name} activa: anuncios desactivados en ${platform}.`,
    };
  }

  if (platform === "android-capacitor") {
    return {
      platform,
      planId,
      adFree: false,
      adProvider: "admob-android",
      billingChannel,
      requiresCmpResurfaceButton: false,
      nitroSkipBidders: [],
      reason: "Android nativo: Google AdMob + Google Play Billing.",
    };
  }

  if (platform === "desktop-electron") {
    return {
      platform,
      planId,
      adFree: false,
      adProvider: "nitropay-electron",
      billingChannel,
      requiresCmpResurfaceButton: true,
      nitroSkipBidders: ["google"],
      reason: "Escritorio Electron: NitroPay remoto con data-cmp-mode=5, CMP modal y skipBidders=['google'].",
    };
  }

  return {
    platform,
    planId,
    adFree: false,
    adProvider: "nitropay-web",
    billingChannel,
    requiresCmpResurfaceButton: true,
    nitroSkipBidders: [],
    reason: "Web: NitroPay display/video oficial con redirect 301 en /ads.txt.",
  };
}

/** Genera la configuración oficial de createAd() cumpliendo las reglas de NitroPay (incl. skipBidders en Electron). */
export function buildNitroPlacementConfig(params: {
  id: string;
  platform: BanterPlatform;
  format?: "display" | "video-nc" | "anchor";
  sizes?: Array<[number, number]>;
  siteId?: string;
  forceDemo?: boolean;
}): NitroPayPlacementConfig {
  const isElectron = params.platform === "desktop-electron";
  const hasSiteId = Boolean(params.siteId && /^\d{3,10}$/.test(params.siteId.trim()));
  return {
    id: params.id,
    format: params.format || "display",
    sizes: params.sizes || (isElectron ? [[300, 250]] : [[728, 90], [320, 50]]),
    demo: params.forceDemo ?? !hasSiteId,
    refreshTime: 30,
    skipBidders: isElectron ? ["google"] : [],
    report: {
      enabled: true,
      position: "bottom-right",
      wording: "Report Ad",
    },
  };
}
