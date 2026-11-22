import test from "node:test";
import assert from "node:assert/strict";
import {
  BANTER_PLANS,
  buildNitroPlacementConfig,
  resolveMonetization,
  sanitizeCustomizationForPlan,
  validateRegistrationPayload,
  validateRequestPayload,
} from "../packages/core/src/index.ts";
import { buildNitroAdsTxtRedirect, handleEdgeRequest } from "../apps/edge/src/index.js";

test("Hybrid monetization matrix complies with NitroPay (Web/Electron) and Google Play (Android)", () => {
  // 1) Free en Web -> NitroPay Web
  const webFree = resolveMonetization("web", "free");
  assert.equal(webFree.adFree, false);
  assert.equal(webFree.adProvider, "nitropay-web");
  assert.equal(webFree.billingChannel, "stripe");
  assert.equal(webFree.requiresCmpResurfaceButton, true);

  // 2) Free en Electron -> NitroPay Electron con skipBidders:['google']
  const desktopFree = resolveMonetization("desktop-electron", "free");
  assert.equal(desktopFree.adFree, false);
  assert.equal(desktopFree.adProvider, "nitropay-electron");
  assert.deepEqual(desktopFree.nitroSkipBidders, ["google"]);
  assert.equal(desktopFree.requiresCmpResurfaceButton, true);

  // 3) Free en Android -> Google AdMob + Google Play Billing (sin tags web NitroPay)
  const androidFree = resolveMonetization("android-capacitor", "free");
  assert.equal(androidFree.adFree, false);
  assert.equal(androidFree.adProvider, "admob-android");
  assert.equal(androidFree.billingChannel, "google-play-billing");

  // 4) Banter Nitro y Nitro+ apagan anuncios en TODAS las plataformas
  for (const platform of ["web", "desktop-electron", "android-capacitor"] as const) {
    for (const plan of ["nitro", "nitro_plus"] as const) {
      const d = resolveMonetization(platform, plan);
      assert.equal(d.adFree, true);
      assert.equal(d.adProvider, "none");
    }
  }
});

test("buildNitroPlacementConfig enforces skipBidders:['google'] on Electron and demo mode without Site ID", () => {
  const electronDemo = buildNitroPlacementConfig({
    id: "banter-electron-slot-1",
    platform: "desktop-electron",
    siteId: "",
  });
  assert.deepEqual(electronDemo.skipBidders, ["google"]);
  assert.equal(electronDemo.demo, true);
  assert.deepEqual(electronDemo.sizes, [[300, 250]]);

  const webLive = buildNitroPlacementConfig({
    id: "banter-top-display",
    platform: "web",
    siteId: "1234",
  });
  assert.deepEqual(webLive.skipBidders, []);
  assert.equal(webLive.demo, false);
});

test("Nitro customization enforces plan entitlements", () => {
  const freeCustom = sanitizeCustomizationForPlan("free", {
    frameStyle: "holo-prism",
    bannerStyle: "aurora-mesh",
    accentHex: "#00ffaa",
    badgeText: "VIP",
  });
  assert.equal(freeCustom.frameStyle, "none");
  assert.equal(freeCustom.bannerStyle, "graphite");
  assert.equal(freeCustom.customEmojiUnlocked, false);

  const nitroPlusCustom = sanitizeCustomizationForPlan("nitro_plus", {
    frameStyle: "holo-prism",
    bannerStyle: "aurora-mesh",
    accentHex: "#38bdf8",
    badgeText: "founder",
  });
  assert.equal(nitroPlusCustom.frameStyle, "holo-prism");
  assert.equal(nitroPlusCustom.bannerStyle, "aurora-mesh");
  assert.equal(nitroPlusCustom.badgeText, "FOUNDER");
  assert.equal(nitroPlusCustom.customEmojiUnlocked, true);
  assert.equal(BANTER_PLANS.nitro_plus.maxUploadMb, 500);
});

test("Edge Worker serves IAB one-hop 301 redirect for /ads.txt when NITROPAY_SITE_ID is configured", async () => {
  assert.equal(buildNitroAdsTxtRedirect("9876"), "https://api.nitropay.com/v1/ads-9876.txt");
  assert.equal(buildNitroAdsTxtRedirect("invalid"), null);

  const liveRes = await handleEdgeRequest(new Request("https://banter.vants.cc/ads.txt"), {
    NITROPAY_SITE_ID: "9876",
  });
  assert.equal(liveRes.status, 301);
  assert.equal(liveRes.headers.get("location"), "https://api.nitropay.com/v1/ads-9876.txt");

  const pendingRes = await handleEdgeRequest(new Request("https://banter.vants.cc/ads.txt"), {
    NITROPAY_SITE_ID: "",
  });
  assert.equal(pendingRes.status, 200);
  assert.ok((await pendingRes.text()).includes("NITROPAY_SITE_ID"));
});

test("Google Sheets bridge validates registration and request payloads", () => {
  assert.equal(
    validateRegistrationPayload({
      kind: "usuario_registro",
      handle: "FEISS",
      email: "feiss@vants.cc",
      platform: "desktop-electron",
      planId: "nitro",
      country: "VE",
    }),
    null,
  );
  assert.ok(
    validateRequestPayload({
      kind: "solicitud_banter",
      requester: "A",
      email: "bad",
      requestType: "Acceso Beta",
      platform: "android-capacitor",
      priority: "Alta",
      summary: "corto",
    }),
  );
});
