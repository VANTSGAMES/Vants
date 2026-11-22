import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cc.vants.banter",
  appName: "Banter",
  webDir: "../web/dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    AdMob: {
      // IDs de prueba oficiales de Google AdMob; sustituir por los IDs de producción al publicar en Google Play.
      initializeForTesting: true,
    },
  },
};

export default config;
