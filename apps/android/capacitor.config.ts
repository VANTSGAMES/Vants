import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cc.vants.movil",
  appName: "VANTS Movil",
  webDir: "../web/dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0A0A0B",
  },
};

export default config;
