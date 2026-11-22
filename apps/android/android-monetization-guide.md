# Banter Android — Monetización Híbrida (AdMob + Google Play Billing)

Para cumplir simultáneamente con **Google Play Store** y con la exclusividad web/escritorio de **NitroPay (Overwolf)**:

1. **Publicidad en Android (solo plan Banter Free):**
   - Usa **Google AdMob** a través de `@capacitor-community/admob` (nunca inyectar tags web de NitroPay dentro de un WebView móvil).
   - Configura tu `ADMOB_APP_ID` en `android/app/src/main/AndroidManifest.xml` y publica `apps/web/public/app-ads.txt` en la raíz del dominio asociado a tu ficha de Google Play.
2. **Suscripciones tipo Nitro en Android (Google Play Billing):**
   - Crea los productos de suscripción en Google Play Console con los SKU definidos en `@banter/core`:
     - `banter_nitro_monthly` — **$4.99 USD / mes** (0 anuncios + marcos/banners + 1080p60)
     - `banter_nitro_plus_monthly` — **$9.99 USD / mes** (0 anuncios + personalización total + 4K60 + 2 Boosts)
   - Al verificarse la suscripción activa, `resolveMonetization('android-capacitor', planId)` retorna `adFree: true` y ejecuta `AdMob.removeBanner()` inmediatamente.
3. **Generar proyecto Android nativo:**
   ```bash
   npm install
   npm run build:web
   cd apps/android
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
4. **Actualizaciones automáticas en Android (Google Play In-App Updates):**
   - El plugin `@capawesome/capacitor-app-update` ya está instalado en `apps/android/package.json` y conectado desde `apps/web/src/lib/appUpdater.ts`.
   - Al abrir la app, consulta a Google Play Core (`getAppUpdateInfo()`). Cuando subes una nueva versión `.aab` a Play Console, la app inicia automáticamente una actualización `FLEXIBLE` en segundo plano (100 % conforme con las políticas de Google Play y compatible con AdMob + Play Billing).
