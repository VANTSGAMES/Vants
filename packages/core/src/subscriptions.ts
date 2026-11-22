export type BanterPlanId = "free" | "nitro" | "nitro_plus";

export interface BanterProfileCustomization {
  accentHex: string;
  frameStyle: "none" | "neon-crimson" | "cyber-gold" | "holo-prism";
  bannerStyle: "graphite" | "obsidian-grid" | "crimson-pulse" | "aurora-mesh";
  badgeText: string;
  customEmojiUnlocked: boolean;
}

export interface BanterPlanDefinition {
  id: BanterPlanId;
  name: string;
  tagline: string;
  priceMonthlyUsd: number;
  adFree: boolean;
  maxUploadMb: number;
  streamQuality: "720p30" | "1080p60" | "4k60";
  dailyShortsLimit: number;
  dailyVidiqLimit: number;
  googlePlaySku: string | null;
  stripePriceEnv: string | null;
  perks: string[];
  allowedFrames: BanterProfileCustomization["frameStyle"][];
  allowedBanners: BanterProfileCustomization["bannerStyle"][];
}

export const BANTER_PLANS: Record<BanterPlanId, BanterPlanDefinition> = {
  free: {
    id: "free",
    name: "Banter Free",
    tagline: "Acceso completo con anuncios no intrusivos (NitroPay / AdMob)",
    priceMonthlyUsd: 0,
    adFree: false,
    maxUploadMb: 25,
    streamQuality: "720p30",
    dailyShortsLimit: 0,
    dailyVidiqLimit: 0,
    googlePlaySku: null,
    stripePriceEnv: null,
    perks: [
      "Salas de voz, chat, auto-updates (PC y Android) y comunidad multiplataforma",
      "App VANTS Clipper PC: recorte local 9:16 gratis en tu PC (subida manual)",
      "Subida de archivos hasta 25 MB y streams 720p 30fps",
      "Sostenido por anuncios gaming NitroPay (Web/PC) y AdMob (Android)",
    ],
    allowedFrames: ["none"],
    allowedBanners: ["graphite"],
  },
  nitro: {
    id: "nitro",
    name: "Banter Nitro",
    tagline: "0 anuncios + personalización + 3 YouTube Shorts y 3 Créditos VANTS IA al día",
    priceMonthlyUsd: 4.99,
    adFree: true,
    maxUploadMb: 150,
    streamQuality: "1080p60",
    dailyShortsLimit: 3,
    dailyVidiqLimit: 3,
    googlePlaySku: "banter_nitro_monthly",
    stripePriceEnv: "STRIPE_PRICE_BANTER_NITRO",
    perks: [
      "Experiencia 100 % sin anuncios en Web, Escritorio y Android",
      "VANTS Clipper PC → 3 YouTube Shorts/día + 3 Créditos VANTS IA/día",
      "Marcos animados de avatar (Crimson y Cyber Gold) + banners HD",
      "Insignia NITRO en salas y chats + subidas hasta 150 MB y 1080p 60fps",
    ],
    allowedFrames: ["none", "neon-crimson", "cyber-gold"],
    allowedBanners: ["graphite", "obsidian-grid", "crimson-pulse"],
  },
  nitro_plus: {
    id: "nitro_plus",
    name: "Banter Nitro+",
    tagline: "Personalización total, 4K60 y 5 YouTube Shorts + 5 Créditos VANTS IA al día",
    priceMonthlyUsd: 9.99,
    adFree: true,
    maxUploadMb: 500,
    streamQuality: "4k60",
    dailyShortsLimit: 5,
    dailyVidiqLimit: 5,
    googlePlaySku: "banter_nitro_plus_monthly",
    stripePriceEnv: "STRIPE_PRICE_BANTER_NITRO_PLUS",
    perks: [
      "Todo lo incluido en Banter Nitro (0 anuncios en todas las plataformas)",
      "VANTS Clipper PC → 5 YouTube Shorts/día + 5 Créditos VANTS IA/día + Discord",
      "Marco exclusivo Holo Prism + banner animado Aurora Mesh + color libre",
      "2 Boosts mensuales, subidas hasta 500 MB y streaming 4K 60fps",
    ],
    allowedFrames: ["none", "neon-crimson", "cyber-gold", "holo-prism"],
    allowedBanners: ["graphite", "obsidian-grid", "crimson-pulse", "aurora-mesh"],
  },
};

export const DEFAULT_CUSTOMIZATION: BanterProfileCustomization = {
  accentHex: "#ff0d2e",
  frameStyle: "none",
  bannerStyle: "graphite",
  badgeText: "BANTER",
  customEmojiUnlocked: false,
};

export function sanitizeCustomizationForPlan(
  planId: BanterPlanId,
  draft: Partial<BanterProfileCustomization>,
): BanterProfileCustomization {
  const plan = BANTER_PLANS[planId];
  const frameStyle =
    draft.frameStyle && plan.allowedFrames.includes(draft.frameStyle)
      ? draft.frameStyle
      : plan.allowedFrames[0];
  const bannerStyle =
    draft.bannerStyle && plan.allowedBanners.includes(draft.bannerStyle)
      ? draft.bannerStyle
      : plan.allowedBanners[0];
  const accentHex =
    planId === "free"
      ? "#ff0d2e"
      : /^#[0-9a-fA-F]{6}$/.test(draft.accentHex || "")
        ? String(draft.accentHex)
        : "#ff0d2e";
  const badgeText =
    planId === "free"
      ? "MEMBER"
      : String(draft.badgeText || (planId === "nitro_plus" ? "NITRO+" : "NITRO"))
          .trim()
          .toUpperCase()
          .slice(0, 14) || "NITRO";

  return {
    accentHex,
    frameStyle,
    bannerStyle,
    badgeText,
    customEmojiUnlocked: planId !== "free",
  };
}
