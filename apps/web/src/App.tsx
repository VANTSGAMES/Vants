import { useEffect, useMemo, useState } from "react";
import {
  fetchClipsComunidad,
  fetchDirectos,
  fetchEquiposFaceit,
  fetchInsignias,
  fetchJugadores,
  fetchMisInsignias,
  fetchPerfilPublico,
  getDesktopBridge,
  getSavedSession,
  openInApp,
  openUrl,
  saveSession,
  startEmailOtp,
  verifyEmailOtp,
  type AuthSession,
  type ClipComunidadItem,
  type DirectoItem,
  type EquipoFaceitItem,
  type InsigniaCatalogItem,
  type JugadorItem,
  type LocalClipItem,
  type PerfilPublicoData,
  type ShieldReport,
} from "./lib/vantsApi";

type TabId = "inicio" | "juegos" | "clips" | "directos" | "ranking" | "perfil" | "planes" | "shield";

interface PlanCard {
  id: string;
  nombre: string;
  badge: string;
  color: string;
  destacado?: boolean;
  beneficios: string[];
}

const PLANES_VANTS: PlanCard[] = [
  {
    id: "pase",
    nombre: "PASE S4",
    badge: "TEMPORADA",
    color: "#4cc9f0",
    beneficios: [
      "Insignia oficial PLUS en tu perfil VANTS",
      "2 Shorts automáticos y 2 optimizaciones SEO al día",
      "Acceso a misiones y recompensas de temporada",
    ],
  },
  {
    id: "pro",
    nombre: "VANTS PRO",
    badge: "MÁS POPULAR",
    color: "#ff0d2e",
    destacado: true,
    beneficios: [
      "Sello PRO junto a tu nick y ficha pública",
      "0% fee en inscripciones a torneos abiertos",
      "Cola prioritaria en VANTS Ranked + 3 Shorts/día",
      "Crea tus propios torneos de comunidad",
    ],
  },
  {
    id: "creator",
    nombre: "VANTS CREATOR",
    badge: "CREADORES",
    color: "#b44cff",
    beneficios: [
      "Sello CREATOR y difusión automática en Discord",
      "5 Shorts automáticos y 5 optimizaciones SEO al día",
      "Prioridad en vitrina de clips y directos VANTS",
    ],
  },
  {
    id: "socio",
    nombre: "SOCIO VANTS",
    badge: "INVITACIÓN",
    color: "#f5c044",
    beneficios: [
      "Sello mítico SOCIO VANTS y voto en el circuito",
      "Acceso al canal privado de socios en Discord",
      "15 Shorts automáticos y 15 optimizaciones SEO al día",
    ],
  },
];

const DEFAULT_INSIGNIAS: InsigniaCatalogItem[] = [
  {
    code: "MEMBER",
    nombre: "Miembro VANTS",
    categoria: "comunidad",
    rareza: "common",
    color: "#8892b0",
    forma: "shield",
    icono: "shield",
    descripcion: "Registrado oficialmente en la comunidad competitiva VANTS.",
    requisito: "Crear cuenta en VANTS",
  },
  {
    code: "FOUNDER",
    nombre: "Fundador VANTS",
    categoria: "honor",
    rareza: "legendary",
    color: "#f5c044",
    forma: "crown",
    icono: "crown",
    descripcion: "Miembro fundador de la primera generación de VANTS GAMES.",
    requisito: "Primera temporada VANTS",
  },
  {
    code: "FACEIT_LINKED",
    nombre: "Competidor FACEIT",
    categoria: "competitivo",
    rareza: "rare",
    color: "#ff5500",
    forma: "hexagon",
    icono: "crosshair",
    descripcion: "Cuenta de FACEIT CS2 vinculada y verificada en el Ranking.",
    requisito: "Vincular FACEIT",
  },
  {
    code: "VALORANT_LINKED",
    nombre: "Agente VALORANT",
    categoria: "competitivo",
    rareza: "rare",
    color: "#ff4655",
    forma: "diamond",
    icono: "val",
    descripcion: "Riot ID vinculado con seguimiento de rango y RR.",
    requisito: "Vincular Riot ID",
  },
  {
    code: "FORTNITE_LINKED",
    nombre: "Competidor Fortnite",
    categoria: "competitivo",
    rareza: "rare",
    color: "#9d4dff",
    forma: "star",
    icono: "bolt",
    descripcion: "Cuenta de Epic Games vinculada al circuito VANTS.",
    requisito: "Vincular Epic Games",
  },
  {
    code: "PRO",
    nombre: "VANTS PRO",
    categoria: "membresia",
    rareza: "epic",
    color: "#ff0d2e",
    forma: "octagon",
    icono: "flame",
    descripcion: "Suscriptor activo de VANTS PRO con prioridad competitiva.",
    requisito: "Membresía VANTS PRO",
  },
  {
    code: "CREATOR",
    nombre: "VANTS CREATOR",
    categoria: "creadores",
    rareza: "legendary",
    color: "#b44cff",
    forma: "star",
    icono: "video",
    descripcion: "Creador oficial de contenido y directos en el ecosistema VANTS.",
    requisito: "Membresía VANTS CREATOR",
  },
  {
    code: "SOCIO",
    nombre: "SOCIO VANTS",
    categoria: "honor",
    rareza: "mythic",
    color: "#f5c044",
    forma: "crown",
    icono: "gem",
    descripcion: "Rango mítico de Socio VANTS con voz y voto en el circuito.",
    requisito: "Invitación / Socio VANTS",
  },
];

interface GameEntry {
  id: string;
  name: string;
  subtitle: string;
  accent: string;
  platformLabel: string;
  webFallback: string;
  cover: string;
}

const PC_GAMES: GameEntry[] = [
  {
    id: "valorant",
    name: "VALORANT",
    subtitle: "Riot Client · Competitivo y torneos VANTS",
    accent: "#ff4655",
    platformLabel: "Riot Client",
    webFallback: "https://vants.cc/torneos?juego=valorant",
    cover: "./img/juegos/valorant.jpg",
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    subtitle: "Steam · FACEIT CS2 y Ranking VANTS",
    accent: "#f5c044",
    platformLabel: "Steam",
    webFallback: "https://vants.cc/torneos?juego=cs2",
    cover: "./img/juegos/cs2.jpg",
  },
  {
    id: "fortnite",
    name: "Fortnite",
    subtitle: "Epic Games · Battle Royale y Arena",
    accent: "#9d4dff",
    platformLabel: "Epic Games",
    webFallback: "https://vants.cc/torneos?juego=fortnite",
    cover: "./img/juegos/fortnite.jpg",
  },
  {
    id: "lol",
    name: "League of Legends",
    subtitle: "Riot Client · Grieta del Invocador",
    accent: "#4cc9f0",
    platformLabel: "Riot Client",
    webFallback: "https://vants.cc/torneos?juego=lol",
    cover: "./img/juegos/lol.jpg",
  },
  {
    id: "warzone",
    name: "Call of Duty: Warzone",
    subtitle: "PC · Battle Royale y escuadras VANTS",
    accent: "#3ddc84",
    platformLabel: "PC",
    webFallback: "https://vants.cc/torneos?juego=warzone",
    cover: "./img/juegos/warzone.jpg",
  },
  {
    id: "fc27",
    name: "EA SPORTS FC 27",
    subtitle: "Circuito VANTS · Copas 1v1 y clubes",
    accent: "#66c0f4",
    platformLabel: "Circuito VANTS",
    webFallback: "https://vants.cc/torneos?juego=fc27",
    cover: "./img/juegos/fc27.jpg",
  },
];

const MOBILE_GAMES: GameEntry[] = [
  {
    id: "freefire",
    name: "Free Fire",
    subtitle: "Móvil · Salas, escuadras y torneos VANTS",
    accent: "#ff9e2c",
    platformLabel: "Android",
    webFallback: "https://vants.cc/torneos?juego=freefire",
    cover: "./img/juegos/freefire.jpg",
  },
  {
    id: "mlbb",
    name: "Mobile Legends: Bang Bang",
    subtitle: "Móvil · Circuito 5v5 LATAM",
    accent: "#4cc9f0",
    platformLabel: "Android",
    webFallback: "https://vants.cc/torneos?juego=mlbb",
    cover: "./img/juegos/mlbb.jpg",
  },
  {
    id: "wildrift",
    name: "League of Legends: Wild Rift",
    subtitle: "Móvil · Torneos competitivos",
    accent: "#3ddc84",
    platformLabel: "Android",
    webFallback: "https://vants.cc/torneos?juego=wildrift",
    cover: "./img/juegos/wildrift.jpg",
  },
  {
    id: "clashroyale",
    name: "Clash Royale",
    subtitle: "Móvil · Copas 1v1 y ligas VANTS",
    accent: "#f5c044",
    platformLabel: "Android",
    webFallback: "https://vants.cc/torneos?juego=clashroyale",
    cover: "./img/juegos/clashroyale.jpg",
  },
  {
    id: "valorant",
    name: "VALORANT",
    subtitle: "Circuito VANTS · Brackets y resultados",
    accent: "#ff4655",
    platformLabel: "Circuito VANTS",
    webFallback: "https://vants.cc/torneos?juego=valorant",
    cover: "./img/juegos/valorant.jpg",
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    subtitle: "FACEIT CS2 · Ranking y partidas en vivo",
    accent: "#ff0d2e",
    platformLabel: "Circuito VANTS",
    webFallback: "https://vants.cc/torneos?juego=cs2",
    cover: "./img/juegos/cs2.jpg",
  },
  {
    id: "fortnite",
    name: "Fortnite",
    subtitle: "Torneos Battle Royale y estadísticas",
    accent: "#9d4dff",
    platformLabel: "Circuito VANTS",
    webFallback: "https://vants.cc/torneos?juego=fortnite",
    cover: "./img/juegos/fortnite.jpg",
  },
];

export function App() {
  const desktop = useMemo(() => getDesktopBridge(), []);
  const isPc = Boolean(desktop);

  const [tab, setTab] = useState<TabId>("inicio");
  const [maximized, setMaximized] = useState(false);
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [directos, setDirectos] = useState<DirectoItem[]>([]);
  const [jugadores, setJugadores] = useState<JugadorItem[]>([]);
  const [equipos, setEquipos] = useState<EquipoFaceitItem[]>([]);
  const [clipsComunidad, setClipsComunidad] = useState<ClipComunidadItem[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Exclusivo PC: clips locales en disco (Razer Cortex / Capturas) y VANTS Shield
  const [localClips, setLocalClips] = useState<LocalClipItem[]>([]);
  const [localFolders, setLocalFolders] = useState<string[]>([]);
  const [scanningClips, setScanningClips] = useState(false);
  const [shieldReport, setShieldReport] = useState<ShieldReport | null>(null);
  const [checkingShield, setCheckingShield] = useState(false);

  const [searchRank, setSearchRank] = useState("");
  const [clipFilter, setClipFilter] = useState("todos");

  // Sesión VANTS Identity (Email OTP + Google), perfil del jugador, banner e insignias
  const [session, setSession] = useState<AuthSession | null>(() => getSavedSession());
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [insigniasCat, setInsigniasCat] = useState<InsigniaCatalogItem[]>([]);
  const [misInsignias, setMisInsignias] = useState<string[]>(["MEMBER"]);
  const [perfilActivo, setPerfilActivo] = useState<PerfilPublicoData | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3200);
  };

  const refreshData = async () => {
    setLoading(true);
    const [d, j, e, c, ins] = await Promise.all([
      fetchDirectos(),
      fetchJugadores(),
      fetchEquiposFaceit(),
      fetchClipsComunidad(),
      fetchInsignias(),
    ]);
    setDirectos(d.directos);
    setJugadores(j.jugadores);
    setEquipos(e.equipos);
    setClipsComunidad(c.clips);
    setInsigniasCat(ins.catalogo);
    setOffline(d.offline && j.offline);
    setLoading(false);
  };

  const cargarPerfilPorPid = async (pid: string) => {
    const p = await fetchPerfilPublico(pid);
    if (p) {
      setPerfilActivo(p);
      if (p.insignias?.length) setMisInsignias(p.insignias);
    }
  };

  const handleSendOtp = async () => {
    if (!otpEmail.trim()) {
      showToast("Introduce tu correo electrónico.");
      return;
    }
    setAuthBusy(true);
    const r = await startEmailOtp(otpEmail);
    setAuthBusy(false);
    if (r.ok) {
      setOtpSent(true);
      showToast("Código de 6 dígitos enviado a tu correo.");
    } else {
      showToast("No se pudo enviar el código (" + (r.error || "verifica tu correo") + ").");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return;
    setAuthBusy(true);
    const r = await verifyEmailOtp(otpEmail, otpCode);
    setAuthBusy(false);
    if (r.ok && r.session) {
      setSession(r.session);
      setOtpSent(false);
      setOtpCode("");
      showToast(`¡Bienvenido, ${r.session.user.name}!`);
      const mias = await fetchMisInsignias(r.session.token);
      if (mias) {
        setMisInsignias(mias.conseguidas);
        if (mias.pid) await cargarPerfilPorPid(mias.pid);
      }
    } else {
      showToast("Código inválido o expirado.");
    }
  };

  const handleLogout = () => {
    saveSession(null);
    setSession(null);
    setPerfilActivo(null);
    setMisInsignias(["MEMBER"]);
    showToast("Sesión cerrada.");
  };

  const scanLocalClips = async () => {
    if (!desktop) return;
    setScanningClips(true);
    try {
      const res = await desktop.scanCortexClips();
      setLocalClips(res.clips || []);
      setLocalFolders(res.folders || []);
    } catch {
      showToast("No se pudieron leer las carpetas de clips locales.");
    } finally {
      setScanningClips(false);
    }
  };

  const runShield = async () => {
    if (!desktop || !desktop.runShieldCheck) return;
    setCheckingShield(true);
    try {
      const report = await desktop.runShieldCheck();
      setShieldReport(report);
      showToast(
        report.status === "clean"
          ? `VANTS Shield: entorno limpio (${report.code})`
          : `VANTS Shield: cierra las herramientas detectadas antes de competir.`,
      );
    } catch {
      showToast("Error al ejecutar VANTS Shield.");
    } finally {
      setCheckingShield(false);
    }
  };

  const copyShieldProof = async () => {
    if (!shieldReport) return;
    const acNames = shieldReport.activeAntiCheats.map((a) => a.name).join(", ") || "Ninguno activo aún";
    const text = [
      `[VANTS Shield · ${shieldReport.status === "clean" ? "LIMPIO" : "ALERTA"}]`,
      `Código: ${shieldReport.code}`,
      `Fecha UTC: ${shieldReport.checkedAt}`,
      `Versión: VANTS PC v${shieldReport.appVersion}`,
      `Anti-Cheats detectados: ${acNames}`,
    ].join(" | ");
    try {
      await navigator.clipboard.writeText(text);
      showToast("Comprobante VANTS Shield copiado al portapapeles.");
    } catch {
      showToast("No se pudo copiar al portapapeles.");
    }
  };

  useEffect(() => {
    void refreshData();
    if (session?.token) {
      fetchMisInsignias(session.token).then((m) => {
        if (m) {
          setMisInsignias(m.conseguidas);
          if (m.pid) void cargarPerfilPorPid(m.pid);
        }
      }).catch(() => {});
    }
    if (desktop) {
      void scanLocalClips();
      void runShield();
      desktop.getAppVersion().then((r) => setAppVersion(r.version)).catch(() => {});
      desktop.isMaximized().then((r) => setMaximized(Boolean(r.maximized))).catch(() => {});
      const offWin = desktop.onWindowState?.((s) => setMaximized(Boolean(s.maximized)));
      const offUpd = desktop.onUpdateStatus?.((u) => {
        if (u.state === "downloading") setUpdateMsg(`Descargando v${u.version || ""} (${u.percent ?? 0}%)`);
        else if (u.state === "downloaded") setUpdateMsg(`Actualización v${u.version || ""} lista`);
        else if (u.state === "available") setUpdateMsg(`Nueva versión v${u.version || ""} disponible`);
      });
      return () => {
        offWin?.();
        offUpd?.();
      };
    }
    return undefined;
  }, [desktop]);

  const vivos = useMemo(() => directos.filter((d) => d.en_vivo), [directos]);

  const filteredJugadores = useMemo(() => {
    const q = searchRank.trim().toLowerCase();
    if (!q) return jugadores.slice(0, 40);
    return jugadores.filter((j) => j.nick.toLowerCase().includes(q)).slice(0, 40);
  }, [jugadores, searchRank]);

  const filteredClips = useMemo(() => {
    if (clipFilter === "todos") return clipsComunidad;
    return clipsComunidad.filter((c) => c.juego === clipFilter);
  }, [clipsComunidad, clipFilter]);

  const handleLaunchGame = async (game: GameEntry) => {
    if (!desktop) {
      openUrl(game.webFallback);
      return;
    }
    const res = await desktop.launchGame(game.id);
    if (res.ok) {
      showToast(`Lanzando ${game.name}…`);
    } else {
      showToast(`No se encontró ${game.platformLabel} instalado en este PC.`);
    }
  };

  const activeGames = isPc ? PC_GAMES : MOBILE_GAMES;

  const navItems: Array<{ id: TabId; label: string; icon: string; badge?: string; live?: boolean }> = [
    { id: "inicio", label: "Inicio", icon: "⚡" },
    { id: "juegos", label: isPc ? "Lanzador PC" : "Torneos", icon: "🎮" },
    { id: "clips", label: isPc ? "Clips PC" : "Clips", icon: "🎬", badge: isPc && localClips.length ? String(localClips.length) : undefined },
    { id: "directos", label: "Directos", icon: "🔴", badge: vivos.length ? String(vivos.length) : undefined, live: vivos.length > 0 },
    { id: "ranking", label: "Ranking", icon: "🏆" },
    { id: "perfil", label: session ? session.user.name.slice(0, 12) : "Perfil / Entrar", icon: "👤", badge: session ? "ON" : undefined },
    { id: "planes", label: "Planes", icon: "⭐" },
    ...(isPc
      ? [
          {
            id: "shield" as TabId,
            label: "VANTS Shield",
            icon: "🛡️",
            badge: shieldReport ? (shieldReport.status === "clean" ? "OK" : "!") : undefined,
            live: shieldReport?.status === "flagged",
          },
        ]
      : []),
  ];

  // Barra inferior Android (5 pestañas táctiles cómodas >= 48px, con Perfil del jugador)
  const mobileBottomNav: Array<{ id: TabId; label: string; icon: string }> = [
    { id: "inicio", label: "Inicio", icon: "⚡" },
    { id: "juegos", label: "Torneos", icon: "🎮" },
    { id: "directos", label: "En vivo", icon: "🔴" },
    { id: "ranking", label: "Ranking", icon: "🏆" },
    { id: "perfil", label: session ? "Mi Perfil" : "Entrar", icon: "👤" },
  ];

  return (
    <div className="vants-shell">
      {/* Barra superior nativa (frameless en PC, compacta en Android) */}
      <header className="vants-titlebar">
        <div className="vants-titlebar-left">
          <img src="./brand/vants-mark.png" alt="VANTS" className="vants-mark" />
          <span className="vants-brand-title">{isPc ? "VANTS PC" : "VANTS Movil"}</span>
          <span className={`vants-pill ${offline ? "offline" : "ok"}`}>
            {offline ? "Sin conexión (caché)" : "En línea"}
          </span>
          {updateMsg && (
            <button
              type="button"
              className="btn primary"
              style={{ padding: "3px 9px", fontSize: "11px" }}
              onClick={() => desktop?.installUpdate()}
            >
              {updateMsg}
            </button>
          )}
        </div>

        <div className="vants-titlebar-right">
          <button
            type="button"
            className={`btn ${session ? "" : "primary"}`}
            style={{ padding: "4px 10px", fontSize: "11px" }}
            onClick={() => setTab("perfil")}
          >
            {session ? `👤 ${session.user.name.slice(0, 14)}` : "👤 Iniciar sesión"}
          </button>
          <button type="button" className="win-btn" title="Actualizar datos" onClick={() => void refreshData()}>
            ↻
          </button>
          {isPc && (
            <>
              <button type="button" className="win-btn" title="Minimizar" onClick={() => void desktop?.minimize()}>
                ─
              </button>
              <button
                type="button"
                className="win-btn"
                title={maximized ? "Restaurar" : "Maximizar"}
                onClick={() => void desktop?.toggleMaximize()}
              >
                {maximized ? "❐" : "□"}
              </button>
              <button type="button" className="win-btn close" title="Cerrar" onClick={() => void desktop?.close()}>
                ✕
              </button>
            </>
          )}
        </div>
      </header>

      <div className="vants-body">
        {/* Rail lateral exclusivo de escritorio */}
        <aside className="vants-rail">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className={`nav-badge ${item.live ? "live" : ""}`}>{item.badge}</span>}
            </button>
          ))}

          <div className="rail-footer">
            <button type="button" className="btn" onClick={() => openUrl("https://vants.cc")}>
              Abrir vants.cc ↗
            </button>
            <div style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
              VANTS App · v{appVersion}
            </div>
          </div>
        </aside>

        {/* Área de contenido 100% local */}
        <main className="vants-main">
          {tab === "inicio" && (
            <>
              <section className="hero-card">
                <div className="hero-brand">
                  <img src="./brand/vants-mark.png" alt="VANTS" className="hero-mark" />
                  <div>
                    <h1>{isPc ? "Centro Competitivo VANTS PC" : "VANTS Movil"}</h1>
                    <p>
                      {isPc
                        ? "App nativa de escritorio · Lanzador rápido, detector de clips Razer Cortex y datos en vivo."
                        : "App nativa Android · Directos Twitch/Kick, Ranking FACEIT y clips de la comunidad."}
                    </p>
                  </div>
                </div>
                <div className="btn-row">
                  <button type="button" className="btn primary" onClick={() => setTab("juegos")}>
                    {isPc ? "🎮 Lanzar juego" : "🎮 Juegos"}
                  </button>
                  <button type="button" className="btn" onClick={() => setTab("clips")}>
                    {isPc ? "🎬 Ver clips PC" : "🎬 Clips"}
                  </button>
                </div>
              </section>

              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-label">En directo ahora</div>
                  <div className="stat-value" style={{ color: vivos.length ? "var(--red)" : "var(--text)" }}>
                    {loading ? "…" : vivos.length}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Jugadores VANTS</div>
                  <div className="stat-value">{loading ? "…" : jugadores.length}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Equipos FACEIT</div>
                  <div className="stat-value">{loading ? "…" : equipos.length}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">{isPc ? "Clips en este PC" : "Clips comunidad"}</div>
                  <div className="stat-value">{isPc ? localClips.length : clipsComunidad.length}</div>
                </div>
              </div>

              <div className="section-head">
                <h2>{isPc ? "Acceso rápido · Juegos PC" : "Directos destacados"}</h2>
                <button type="button" className="btn" onClick={() => setTab(isPc ? "juegos" : "directos")}>
                  Ver todo →
                </button>
              </div>

              {isPc ? (
                <div className="grid-cards">
                  {PC_GAMES.slice(0, 3).map((g) => (
                    <div key={g.id} className="card">
                      <div className="game-cover-wrap">
                        <img src={g.cover} alt={g.name} className="game-cover-img" />
                        <span className="game-cover-badge">{g.platformLabel}</span>
                      </div>
                      <div className="game-accent" style={{ background: g.accent }} />
                      <h3 className="card-title">{g.name}</h3>
                      <p className="card-meta">{g.subtitle}</p>
                      <div className="btn-row">
                        <button type="button" className="btn primary" onClick={() => void handleLaunchGame(g)}>
                          ▶ Jugar ahora
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid-cards">
                  {(vivos.length ? vivos : directos.slice(0, 4)).map((d) => (
                    <div key={`${d.plataforma}:${d.canal}`} className="card">
                      {d.miniatura && <img src={d.miniatura} alt={d.nombre} className="stream-thumb" />}
                      <h3 className="card-title">
                        {d.en_vivo ? "🔴 " : ""}
                        {d.nombre}
                      </h3>
                      <p className="card-meta">
                        {d.plataforma.toUpperCase()} {d.juego ? `· ${d.juego}` : ""}
                        {d.espectadores != null ? ` · ${d.espectadores} espectadores` : ""}
                      </p>
                      <div className="btn-row">
                        <button type="button" className="btn primary" onClick={() => openUrl(d.url)}>
                          Ver canal ↗
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "juegos" && (
            <>
              <div className="section-head">
                <h2>{isPc ? "Lanzador Rápido de Juegos (PC)" : "Torneos Móvil & Esports VANTS"}</h2>
              </div>
              <div className="grid-cards">
                {activeGames.map((g) => (
                  <div key={g.id} className="card">
                    <div className="game-cover-wrap">
                      <img src={g.cover} alt={g.name} className="game-cover-img" />
                      <span className="game-cover-badge">{g.platformLabel}</span>
                    </div>
                    <div className="game-accent" style={{ background: g.accent }} />
                    <h3 className="card-title">{g.name}</h3>
                    <p className="card-meta">{g.subtitle}</p>
                    <div className="btn-row">
                      <button type="button" className="btn primary" onClick={() => void handleLaunchGame(g)}>
                        {isPc ? `▶ Abrir ${g.name}` : "Ver torneos ↗"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "clips" && (
            <>
              {isPc && (
                <>
                  <div className="section-head">
                    <h2>Clips detectados en tu PC (Razer Cortex / Capturas)</h2>
                    <button type="button" className="btn" onClick={() => void scanLocalClips()}>
                      {scanningClips ? "Escaneando…" : "↻ Re-escanear carpetas"}
                    </button>
                  </div>
                  {localClips.length === 0 ? (
                    <div className="card" style={{ marginBottom: 22 }}>
                      <h3 className="card-title">Sin clips locales detectados todavía</h3>
                      <p className="card-meta">
                        Carpetas revisadas:{" "}
                        {localFolders.length
                          ? localFolders.join(" · ")
                          : "Videos/VALORANT, Videos/CS2, Videos/Captures y Razer Cortex/GameClips"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid-cards">
                      {localClips.map((clip) => (
                        <div key={clip.path} className="card">
                          <h3 className="card-title">{clip.name}</h3>
                          <p className="card-meta">
                            {clip.game} · {clip.sizeMb} MB · {new Date(clip.mtimeMs).toLocaleDateString("es-ES")}
                          </p>
                          <div className="btn-row">
                            <button
                              type="button"
                              className="btn primary"
                              onClick={() => void desktop?.openClipFile(clip.path)}
                            >
                              ▶ Reproducir
                            </button>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => void desktop?.revealClipFolder(clip.path)}
                            >
                              📁 Carpeta
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="section-head">
                <h2>Clips de la Comunidad VANTS</h2>
                <div className="btn-row">
                  {["todos", "valorant", "cs2", "fortnite"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`btn ${clipFilter === g ? "primary" : ""}`}
                      onClick={() => setClipFilter(g)}
                    >
                      {g.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-cards">
                {filteredClips.slice(0, 18).map((c) => (
                  <div key={c.id} className="card">
                    {c.miniatura && <img src={c.miniatura} alt={c.titulo} className="stream-thumb" />}
                    <h3 className="card-title">{c.titulo}</h3>
                    <p className="card-meta">
                      {c.autor || "Jugador VANTS"} · {c.juego.toUpperCase()} · {c.plataforma}
                    </p>
                    <div className="btn-row">
                      <button type="button" className="btn primary" onClick={() => openUrl(c.url)}>
                        Ver clip ↗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "directos" && (
            <>
              <div className="section-head">
                <h2>Directos Twitch & Kick ({vivos.length} en vivo)</h2>
                <button type="button" className="btn" onClick={() => void refreshData()}>
                  ↻ Actualizar
                </button>
              </div>
              <div className="grid-cards">
                {directos.map((d) => (
                  <div key={`${d.plataforma}:${d.canal}`} className="card">
                    {d.miniatura && <img src={d.miniatura} alt={d.nombre} className="stream-thumb" />}
                    <h3 className="card-title">
                      {d.en_vivo ? "🔴 " : "⚫ "}
                      {d.nombre}
                    </h3>
                    <p className="card-meta">
                      {d.plataforma.toUpperCase()} {d.juego ? `· ${d.juego}` : ""}
                      {d.en_vivo && d.espectadores != null ? ` · ${d.espectadores} viendo` : " · Offline"}
                    </p>
                    {d.titulo && <p className="card-meta">{d.titulo}</p>}
                    <div className="btn-row">
                      <button type="button" className="btn primary" onClick={() => openUrl(d.url)}>
                        Abrir directo ↗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "ranking" && (
            <>
              <div className="section-head">
                <h2>Ranking VANTS ({jugadores.length})</h2>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Buscar jugador…"
                  value={searchRank}
                  onChange={(e) => setSearchRank(e.target.value)}
                />
              </div>
              <div className="rank-list">
                {filteredJugadores.map((j, idx) => (
                  <div
                    key={j.pid}
                    className="rank-row"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      void cargarPerfilPorPid(j.pid);
                      setTab("perfil");
                    }}
                  >
                    <div className="rank-pos">#{idx + 1}</div>
                    {j.avatar ? (
                      <img src={j.avatar} alt={j.nick} className="rank-avatar" />
                    ) : (
                      <div className="rank-avatar">{j.nick.slice(0, 2).toUpperCase()}</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {j.nick} {j.sello ? <span className="vants-pill">{j.sello}</span> : null}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {j.fundador ? "Fundador VANTS · " : ""}
                        {j.xp} XP · Ver perfil e insignias →
                      </div>
                    </div>
                    <div className="rank-metrics">
                      {j.nivel != null && <span className="vants-pill ok">LVL {j.nivel}</span>}
                      {j.elo != null && <span>{j.elo} ELO</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "perfil" && (
            <>
              <div className="section-head">
                <h2>👤 Perfil Competitivo, Banner e Insignias VANTS</h2>
                <div className="btn-row">
                  <button type="button" className="btn" onClick={() => openInApp("https://vants.cc/perfil")}>
                    🎨 Personalizar banner / Vincular cuentas
                  </button>
                  {session && (
                    <button type="button" className="btn" onClick={handleLogout}>
                      Cerrar sesión
                    </button>
                  )}
                </div>
              </div>

              {!session && (
                <div className="card" style={{ marginBottom: 22, borderColor: "rgba(255, 13, 46, 0.45)" }}>
                  <div className="game-accent" style={{ background: "#ff0d2e" }} />
                  <h3 className="card-title">Iniciar sesión en VANTS Identity</h3>
                  <p className="card-meta">
                    Entra con un código rápido a tu correo electrónico o con tu cuenta de Google para sincronizar tu
                    perfil, tu banner personalizado y tus insignias 3D.
                  </p>
                  <div className="btn-row" style={{ alignItems: "center", marginTop: 6 }}>
                    <input
                      type="email"
                      className="search-input"
                      placeholder="tu-correo@ejemplo.com"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      style={{ minWidth: 230 }}
                    />
                    {!otpSent ? (
                      <button
                        type="button"
                        className="btn primary"
                        disabled={authBusy}
                        onClick={() => void handleSendOtp()}
                      >
                        {authBusy ? "Enviando…" : "✉ Enviar código (6 dígitos)"}
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Código 6 dígitos"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          style={{ minWidth: 140, width: 150 }}
                        />
                        <button
                          type="button"
                          className="btn primary"
                          disabled={authBusy}
                          onClick={() => void handleVerifyOtp()}
                        >
                          {authBusy ? "Verificando…" : "✓ Verificar y entrar"}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn"
                      onClick={() => openInApp("https://vants.cc/entrar")}
                    >
                      🌐 Entrar con Google / Discord
                    </button>
                  </div>
                </div>
              )}

              {/* Banner oficial del jugador + Avatar + Sello */}
              <div className="profile-banner">
                <div
                  className="profile-banner-bg"
                  style={{
                    backgroundImage: `url(${perfilActivo?.banner || "./img/juegos/valorant.jpg"})`,
                  }}
                />
                <div className="profile-banner-inner">
                  {perfilActivo?.avatar || session?.user.picture ? (
                    <img
                      src={perfilActivo?.avatar || session?.user.picture || ""}
                      alt={perfilActivo?.nick || session?.user.name || "Jugador"}
                      className="profile-avatar-lg"
                    />
                  ) : (
                    <div className="profile-avatar-lg">
                      {(perfilActivo?.nick || session?.user.name || "VG").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: 22 }}>
                        {perfilActivo?.nick || session?.user.name || "Jugador VANTS"}
                      </h2>
                      {perfilActivo?.sello && <span className="vants-pill">{perfilActivo.sello}</span>}
                      {perfilActivo?.fundador && <span className="vants-pill ok">FUNDADOR VANTS</span>}
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                      {perfilActivo
                        ? `${perfilActivo.xp} XP · ${perfilActivo.insignias?.length || misInsignias.length} insignias desbloqueadas`
                        : session?.user.email || "Inicia sesión o selecciona cualquier jugador del Ranking para ver su ficha completa"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tarjetas de cuentas competitivas vinculadas (FACEIT CS2, VALORANT, Fortnite) */}
              <div className="grid-cards" style={{ marginBottom: 24 }}>
                <div className="card">
                  <div className="game-accent" style={{ background: "#ff5500" }} />
                  <h3 className="card-title">Counter-Strike 2 · FACEIT</h3>
                  {perfilActivo?.faceit ? (
                    <p className="card-meta">
                      <strong>{perfilActivo.faceit.nick}</strong> · Nivel {perfilActivo.faceit.nivel ?? "—"} ·{" "}
                      {perfilActivo.faceit.elo ?? "—"} ELO · Winrate {perfilActivo.faceit.winrate ?? "—"}% · K/D{" "}
                      {perfilActivo.faceit.kd ?? "—"}
                    </p>
                  ) : (
                    <p className="card-meta">Sin cuenta de FACEIT vinculada en este perfil.</p>
                  )}
                </div>

                <div className="card">
                  <div className="game-accent" style={{ background: "#ff4655" }} />
                  <h3 className="card-title">VALORANT · Riot ID</h3>
                  {perfilActivo?.valorant?.riot ? (
                    <p className="card-meta">
                      <strong>{perfilActivo.valorant.riot}</strong> · Rango{" "}
                      {perfilActivo.valorant.tier || "Sin clasificar"} ({perfilActivo.valorant.rr ?? 0} RR)
                      {perfilActivo.valorant.pico ? ` · Pico: ${perfilActivo.valorant.pico}` : ""}
                    </p>
                  ) : (
                    <p className="card-meta">Sin Riot ID vinculado en este perfil.</p>
                  )}
                </div>

                <div className="card">
                  <div className="game-accent" style={{ background: "#9d4dff" }} />
                  <h3 className="card-title">Fortnite · Epic Games</h3>
                  {perfilActivo?.fortnite?.nombre ? (
                    <p className="card-meta">
                      <strong>{perfilActivo.fortnite.nombre}</strong>
                      {perfilActivo.fortnite.stats
                        ? ` · ${perfilActivo.fortnite.stats.victorias ?? 0} victorias · K/D ${perfilActivo.fortnite.stats.kd ?? "—"}`
                        : " · Cuenta Epic verificada"}
                    </p>
                  ) : (
                    <p className="card-meta">Sin cuenta de Epic Games vinculada en este perfil.</p>
                  )}
                </div>
              </div>

              {/* Vitrina de Insignias Oficiales 3D */}
              <div className="section-head">
                <h2>🏅 Vitrina de Insignias Oficiales VANTS ({misInsignias.length} conseguidas)</h2>
              </div>
              <div className="badge-grid">
                {(insigniasCat.length ? insigniasCat : DEFAULT_INSIGNIAS).map((b) => {
                  const unlocked = misInsignias.includes(b.code);
                  return (
                    <div key={b.code} className={`badge-card ${unlocked ? "unlocked" : ""}`}>
                      <div
                        className="badge-hex"
                        style={{
                          background: `radial-gradient(circle at 30% 25%, ${b.color}, #10121a 85%)`,
                          boxShadow: unlocked ? `0 0 18px ${b.color}66` : "none",
                        }}
                      >
                        {b.code.slice(0, 3)}
                      </div>
                      <span className="vants-pill" style={{ borderColor: b.color, color: b.color }}>
                        {b.rareza.toUpperCase()}
                      </span>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{b.nombre}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.35 }}>{b.descripcion}</div>
                      <div style={{ fontSize: 10, color: unlocked ? "var(--green)" : "var(--muted)", fontWeight: 700 }}>
                        {unlocked ? "✓ DESBLOQUEADA" : `Requisito: ${b.requisito}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === "planes" && (
            <>
              <div className="section-head">
                <h2>⭐ Membresías y Planes VANTS</h2>
                <button type="button" className="btn primary" onClick={() => openInApp("https://vants.cc/membresias")}>
                  Abrir membresías aquí
                </button>
              </div>
              <div className="grid-cards">
                {PLANES_VANTS.map((plan) => (
                  <div
                    key={plan.id}
                    className="card"
                    style={plan.destacado ? { borderColor: "rgba(255, 13, 46, 0.6)" } : undefined}
                  >
                    <div className="game-accent" style={{ background: plan.color }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <h3 className="card-title">{plan.nombre}</h3>
                      <span className="vants-pill">{plan.badge}</span>
                    </div>
                    <ul style={{ margin: "4px 0 8px", paddingLeft: 18, color: "var(--muted)", fontSize: 12, lineHeight: 1.6 }}>
                      {plan.beneficios.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    <div className="btn-row">
                      <button
                        type="button"
                        className={`btn ${plan.destacado ? "primary" : ""}`}
                        onClick={() => openInApp("https://vants.cc/membresias")}
                      >
                        Activar {plan.nombre}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "shield" && isPc && (
            <>
              <div className="section-head">
                <h2>🛡️ VANTS Shield · Integridad Competitiva (Modo Usuario)</h2>
                <button type="button" className="btn primary" onClick={() => void runShield()} disabled={checkingShield}>
                  {checkingShield ? "Verificando…" : "↻ Ejecutar verificación"}
                </button>
              </div>

              <div className="hero-card">
                <div>
                  <h1 style={{ color: shieldReport?.status === "flagged" ? "var(--red)" : "var(--green)" }}>
                    {!shieldReport
                      ? "Pendiente de verificación"
                      : shieldReport.status === "clean"
                        ? "Entorno Limpio · Verificado"
                        : "Alerta · Cierra las herramientas detectadas"}
                  </h1>
                  <p>
                    Verificación en modo usuario (sin drivers de kernel ni permisos de administrador) · 100% compatible con
                    Microsoft Store.
                  </p>
                </div>
                {shieldReport && (
                  <div className="btn-row">
                    <button type="button" className="btn primary" onClick={() => void copyShieldProof()}>
                      📋 Copiar comprobante ({shieldReport.code})
                    </button>
                  </div>
                )}
              </div>

              {shieldReport && (
                <div className="grid-cards">
                  <div className="card">
                    <h3 className="card-title">Código SHA-256 de torneo</h3>
                    <p className="card-meta" style={{ fontFamily: "monospace", color: "var(--text)", fontSize: 13 }}>
                      {shieldReport.code}
                    </p>
                    <p className="card-meta">
                      Comprobado: {new Date(shieldReport.checkedAt).toLocaleString("es-ES")} · VANTS PC v
                      {shieldReport.appVersion}
                    </p>
                  </div>

                  <div className="card">
                    <h3 className="card-title">Anti-Cheats oficiales detectados</h3>
                    {shieldReport.activeAntiCheats.length ? (
                      <div className="btn-row">
                        {shieldReport.activeAntiCheats.map((ac) => (
                          <span key={ac.id} className="vants-pill ok">
                            ✓ {ac.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="card-meta">
                        Ningún anti-cheat de juego activo ahora (se activan al abrir VALORANT, FACEIT AC o Fortnite).
                      </p>
                    )}
                  </div>

                  <div className="card">
                    <h3 className="card-title">
                      Procesos revisados ({shieldReport.processCount})
                    </h3>
                    {shieldReport.flaggedTools.length === 0 ? (
                      <p className="card-meta" style={{ color: "var(--green)" }}>
                        ✓ Sin debuggers, editores de memoria ni injectors detectados en tu sesión.
                      </p>
                    ) : (
                      shieldReport.flaggedTools.map((f) => (
                        <p key={f.process} className="card-meta" style={{ color: "var(--red)" }}>
                          ⚠ {f.label} ({f.process}) — ciérralo y vuelve a verificar.
                        </p>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Navegación inferior nativa de Android (5 pestañas táctiles) */}
      <nav className="vants-bottom-nav">
        {mobileBottomNav.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`bottom-btn ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
