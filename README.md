# Banter — Ecosistema Multiplataforma (Escritorio, Android y Web)

Monorepo multiplataforma del ecosistema **Banter** con monetización híbrida (**Suscripciones tipo Nitro** + **NitroPay by Overwolf** en Web/Escritorio + **Google AdMob** en Android) y gestión de datos en **Google Forms + Google Sheets**.

## Arquitectura del Monorepo

```text
banter/
├── packages/core/          # Lógica compartida: plataforma, planes Nitro, motor de anuncios y puente Google Sheets
├── apps/web/               # App React + TypeScript + Vite (alimenta Web, Electron y Android) + /app/cmp.html y /app/nitro-ads.html
├── apps/desktop/           # Cliente Electron Windows/macOS/Linux 100% conforme a NitroPay Electron Docs
├── apps/android/           # App Android nativa (Capacitor + Google AdMob + Google Play Billing)
├── apps/edge/              # Cloudflare Worker con redirect 301 IAB one-hop /ads.txt -> api.nitropay.com/v1/ads-<ID>.txt
├── google-workspace/       # Apps Script preconfigurado con la Google Sheet maestra para crear los 2 Google Forms + Webhook
└── tests/                  # Suite de tests de monetización, personalización y cumplimiento NitroPay
```

## Modelo de Monetización Híbrido

| Superficie | Plan Free (Anuncios) | Banter Nitro ($4.99) / Nitro+ ($9.99) | Facturación |
| :--- | :--- | :--- | :--- |
| **Web** | **NitroPay** (`s.nitropay.com/ads-<ID>.js` + 301 `/ads.txt`) | **0 anuncios** + personalización + 1080p60 / 4K60 | Stripe |
| **Escritorio (Electron)** | **NitroPay Electron** (`BrowserView` remoto, `data-cmp-mode="5"`, `cmp.html` modal, `skipBidders: ['google']`) | **0 anuncios** (desmonta `BrowserView` vía IPC) | Stripe |
| **Android (Capacitor)** | **Google AdMob** (`@capacitor-community/admob` + `app-ads.txt`) | **0 anuncios** (`AdMob.removeBanner()`) | Google Play Billing |

## Checklist de Colaboración con NitroPay (Overwolf)
- Script oficial cargado siempre de forma remota desde `https://s.nitropay.com/ads-<SITE_ID>.js` con `data-cfasync="false"`.
- Redirect **301 permanente** desde `/ads.txt` hacia `https://api.nitropay.com/v1/ads-<SITE_ID>.txt` en [`apps/edge/src/index.js`](./apps/edge/src/index.js).
- Sin redes programáticas competidoras en Web/Escritorio (AdMob corre exclusivamente en la app Android nativa con `app-ads.txt`).
- En Electron: `cmp.html` + `nitro-ads.html` alojados en dominio aprobado, partición `persist:adpartition`, limpieza de `Electron/` en User-Agent, `skipBidders: ['google']` y botón GDPR (`resurfaceCmp`).
- En modo previo a aprobación (sin `NITROPAY_SITE_ID`), los slots corren en modo `demo: true` listos para revisión en vivo.

## Gestión de Datos (Google Forms + Google Sheets)
- **Google Sheet Maestra:** https://docs.google.com/spreadsheets/d/1i0t2hRSAO4WT7nKlK3rzgsx4oulmrYmpTqIe6CA5ozU/edit
- **Script automático de Google Forms + Webhook:** [`google-workspace/setup-banter-forms.gs`](./google-workspace/setup-banter-forms.gs) (ver [`google-workspace/README.md`](./google-workspace/README.md)).

## Desarrollo y Pruebas

```bash
npm install
npm run check
npm test
npm run build:web
```
