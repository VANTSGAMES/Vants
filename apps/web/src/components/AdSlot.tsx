import { useEffect } from "react";
import {
  buildNitroPlacementConfig,
  resolveMonetization,
  type BanterPlanId,
  type BanterPlatform,
} from "@banter/core";
import { mountNitroPayPlacement, NITROPAY_IS_LIVE, NITROPAY_SITE_ID } from "../lib/nitropay";
import { syncAndroidAdMobBanner } from "../lib/admob";

interface AdSlotProps {
  id: string;
  platform: BanterPlatform;
  planId: BanterPlanId;
  format?: "display" | "video-nc" | "anchor";
  onUpgradeClick?: () => void;
}

export function AdSlot({ id, platform, planId, format = "display", onUpgradeClick }: AdSlotProps) {
  const decision = resolveMonetization(platform, planId);

  useEffect(() => {
    // Sincroniza shell nativo de Escritorio (Electron BrowserView) y Android (AdMob)
    if (window.banterDesktop?.setAdFree) {
      window.banterDesktop.setAdFree(decision.adFree).catch(() => {});
    }
    if (platform === "android-capacitor") {
      syncAndroidAdMobBanner(decision.adFree).catch(() => {});
    }
    if (!decision.adFree && decision.adProvider === "nitropay-web") {
      const cfg = buildNitroPlacementConfig({
        id,
        platform,
        format,
        siteId: NITROPAY_SITE_ID,
      });
      mountNitroPayPlacement(cfg).catch(() => {});
    }
  }, [decision.adFree, decision.adProvider, format, id, platform]);

  if (decision.adFree) {
    return (
      <div className="ad-banner ad-banner--off" role="status">
        <div>
          <span className="pill pill--ok">AD-FREE ACTIVO</span>
          <p className="muted small" style={{ marginTop: 6 }}>
            {decision.reason}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-banner" data-ad-provider={decision.adProvider}>
      <div className="ad-banner__head">
        <span className="pill">
          {decision.adProvider === "admob-android"
            ? "GOOGLE ADMOB · ANDROID"
            : decision.adProvider === "nitropay-electron"
              ? "NITROPAY ELECTRON · CMP MODE 5"
              : NITROPAY_IS_LIVE
                ? `NITROPAY LIVE · SITE #${NITROPAY_SITE_ID}`
                : "NITROPAY DEMO · LISTO PARA SITE ID"}
        </span>
        {onUpgradeClick && (
          <button type="button" className="btn-link" onClick={onUpgradeClick}>
            Quitar anuncios con Banter Nitro →
          </button>
        )}
      </div>

      {decision.adProvider === "nitropay-web" && (
        <div id={id} className="ad-slot-box">
          {!NITROPAY_IS_LIVE && (
            <div className="ad-demo-placeholder">
              <strong>Espacio NitroPay ({format.toUpperCase()} · 728×90 / 320×50)</strong>
              <span className="muted small">
                Configura <code>VITE_NITROPAY_SITE_ID</code> y el redirect 301 en <code>/ads.txt</code> para servir anuncios reales.
              </span>
            </div>
          )}
        </div>
      )}

      {decision.adProvider === "nitropay-electron" && (
        <div className="ad-demo-placeholder">
          <strong>Carril lateral NitroPay Electron (2× 300×250 · skipBidders: [&apos;google&apos;])</strong>
          <span className="muted small">
            En la app Electron real, los anuncios se cargan en <code>BrowserView</code> remoto desde <code>/app/nitro-ads.html</code> tras aceptar el modal CMP.
          </span>
        </div>
      )}

      {decision.adProvider === "admob-android" && (
        <div className="ad-demo-placeholder">
          <strong>Google AdMob Adaptive Banner (Android · app-ads.txt)</strong>
          <span className="muted small">
            Anuncio nativo en Android vía <code>@capacitor-community/admob</code>; se destruye al instante con Banter Nitro en Google Play Billing.
          </span>
        </div>
      )}
    </div>
  );
}
