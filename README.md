# VANTS PC (`VANTS.exe`) & VANTS Movil — App Nativa Oficial

Aplicación nativa multiplataforma 100 % independiente de **VANTS GAMES** para **Windows (PC)** y **Android (Móvil)**, construida sobre una sola base React + TypeScript + Electron + Capacitor conectada a la infraestructura oficial en **`https://int.vants.cc`** y **`https://bot.vants.cc`**.

---

## Características principales

### Exclusivas de PC (`VANTS.exe` · Electron)
- **Ventana nativa sin bordes (frameless):** barra superior propia con controles minimizar/maximizar/cerrar e icono oficial de marca VANTS.
- **Lanzador rápido de juegos PC:** abre en 1 clic **VALORANT**, **Counter-Strike 2**, **Fortnite**, **League of Legends**, **Rocket League** y **Steam** mediante protocolos nativos.
- **Detector local de clips:** escanea automáticamente carpetas de **Razer Cortex** y **Videos/Capturas de Windows** para reproducir clips o abrir su carpeta en el Explorador.
- **VANTS Shield (modo usuario):** verificación competitiva pre-torneo en 1 clic — detecta anti-cheats oficiales activos (Riot Vanguard, FACEIT AC, Easy Anti-Cheat, BattlEye), revisa procesos de usuario (`tasklist`, sin drivers NT ni permisos de administrador) y genera un comprobante **SHA-256** (`VANTS-SHIELD-…`) listo para copiar en check-in de torneos o Discord.
- **Auto-actualización:** vía GitHub Releases (`electron-updater`).

### PC & Móvil (`VANTS Movil` · Android Capacitor)
- **Directos en vivo:** canales de Twitch y Kick del circuito VANTS (`https://int.vants.cc/directos`).
- **Ranking y equipos FACEIT:** tabla de jugadores VANTS con ELO, nivel FACEIT, XP y sellos (`https://int.vants.cc/jugadores`).
- **Clips de la comunidad:** galería filtrable por juego (`https://int.vants.cc/clips/comunidad`).
- **Planes y Membresías:** catálogo de planes **PASE S4**, **VANTS PRO**, **VANTS CREATOR** y **SOCIO VANTS** con ventana integrada dentro de la app (sin salir de `VANTS.exe`).
- **Modo sin conexión:** caché local automática en `localStorage`.

---

## Estructura del repositorio

```text
banter/
├── apps/web/               # Interfaz nativa React + Vite (PC rail lateral + Móvil barra inferior)
├── apps/desktop/           # Cliente Electron Windows (VANTS.exe / VANTS-Setup-<ver>.exe + icon.ico)
├── apps/android/           # App Android Capacitor (cc.vants.movil · VANTS Movil)
├── apps/edge/              # Worker edge auxiliar
├── packages/core/          # Lógica compartida y puente con bot.vants.cc
├── google-workspace/       # Integración opcional Google Forms / Sheets
└── tests/                  # Suite de pruebas unitarias
```

---

## Instalación y distribución

- **Microsoft Store:** disponible como app Win32 (`VANTS`), descargada sin redirecciones desde `https://int.vants.cc/descargas/vants-pc/<ver>/VANTS-Setup-<ver>.exe` con instalación silenciosa `/S`.
- **WinGet:** `winget install VANTSGAMES.Banter`
- **GitHub Releases:** instalador NSIS firmado `VANTS-Setup-<version>.exe` generado automáticamente por [`.github/workflows/release-desktop.yml`](./.github/workflows/release-desktop.yml).

---

## Desarrollo y pruebas

```bash
npm install
npm run check          # TypeScript check (@banter/core + @banter/web)
npm test               # Suite de tests
npm run build:web      # Compila apps/web/dist para PC y Android
npm run dev:desktop    # Abre VANTS PC en local
npm run sync:android   # Sincroniza bundle local con Capacitor Android
```

---

## Ecosistema VANTS (`vants.cc`)

- **Web oficial:** https://vants.cc
- **Integraciones API:** https://int.vants.cc
- **Bot Discord:** https://bot.vants.cc
- **Bus de eventos:** https://bus.vants.cc
- **Privacidad / Términos:** https://vants.cc/privacidad · https://vants.cc/terminos
