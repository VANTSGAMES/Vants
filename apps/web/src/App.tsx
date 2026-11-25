import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeEmblem,
  IconBolt,
  IconBroadcast,
  IconCalendar,
  IconCheck,
  IconClapper,
  IconCopy,
  IconCrown,
  IconDiscord,
  IconExternal,
  IconFilm,
  IconFolder,
  IconGamepad,
  IconHome,
  IconLiveDot,
  IconLogout,
  IconMail,
  IconPlay,
  IconPulse,
  IconRefresh,
  IconSearch,
  IconShield,
  IconStar,
  IconTrophy,
  IconUser,
  IconUserPlus,
  IconUsers,
  IconWinClose,
  IconWinMax,
  IconWinMin,
  SparklineArea,
} from "./components/CarbonIcons";
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
type GameCategory = "todos" | "fps" | "royale" | "moba";

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
    color: "#38bdf8",
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
      "0% comisión en inscripciones a torneos abiertos",
      "Cola prioritaria en VANTS Ranked + 3 Shorts/día",
      "Crea tus propios torneos de comunidad",
    ],
  },
  {
    id: "creator",
    nombre: "VANTS CREATOR",
    badge: "CREADORES",
    color: "#dce2ec",
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
    color: "#9aa4b8",
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
    color: "#ff6b1a",
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
    color: "#38bdf8",
    forma: "hexagon",
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
    color: "#dce2ec",
    forma: "diamond",
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
  shortTitle: string;
  subtitle: string;
  accent: string;
  category: Exclude<GameCategory, "todos">;
  platformLabel: string;
  webFallback: string;
  cover: string;
}

const PC_GAMES: GameEntry[] = [
  {
    id: "valorant",
    name: "VALORANT",
    shortTitle: "VALORANT",
    subtitle: "Riot Client · Competitivo 5v5, Premier y copas VANTS",
    accent: "#ff4655",
    category: "fps",
    platformLabel: "RIOT CLIENT",
    webFallback: "https://vants.cc/torneos?juego=valorant",
    cover: "./img/juegos/valorant.jpg",
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    shortTitle: "CS2",
    subtitle: "Steam · Integración oficial FACEIT ELO y Ranking VANTS",
    accent: "#f5c044",
    category: "fps",
    platformLabel: "STEAM · FACEIT",
    webFallback: "https://vants.cc/torneos?juego=cs2",
    cover: "./img/juegos/cs2.jpg",
  },
  {
    id: "fortnite",
    name: "Fortnite",
    shortTitle: "Fortnite",
    subtitle: "Epic Games · Copas Battle Royale, Zero Build y Arena",
    accent: "#38bdf8",
    category: "royale",
    platformLabel: "EPIC GAMES",
    webFallback: "https://vants.cc/torneos?juego=fortnite",
    cover: "./img/juegos/fortnite.jpg",
  },
  {
    id: "lol",
    name: "League of Legends",
    shortTitle: "LEAGUE OF LEGENDS",
    subtitle: "Riot Client · Grieta del Invocador y ligas 5v5",
    accent: "#2ee58d",
    category: "moba",
    platformLabel: "RIOT CLIENT",
    webFallback: "https://vants.cc/torneos?juego=lol",
    cover: "./img/juegos/lol.jpg",
  },
  {
    id: "warzone",
    name: "Call of Duty: Warzone",
    shortTitle: "WARZONE",
    subtitle: "PC · Escuadras tácticas y customs privadas VANTS",
    accent: "#dce2ec",
    category: "royale",
    platformLabel: "PC · STEAM",
    webFallback: "https://vants.cc/torneos?juego=warzone",
    cover: "./img/juegos/warzone.jpg",
  },
  {
    id: "fc27",
    name: "EA SPORTS FC 27",
    shortTitle: "EA SPORTS FC 27",
    subtitle: "Circuito VANTS · Copas 1v1 y clubes competitivos",
    accent: "#38bdf8",
    category: "moba",
    platformLabel: "CIRCUITO VANTS",
    webFallback: "https://vants.cc/torneos?juego=fc27",
    cover: "./img/juegos/fc27.jpg",
  },
];

const MOBILE_GAMES: GameEntry[] = [
  {
    id: "freefire",
    name: "Free Fire",
    shortTitle: "FREE FIRE",
    subtitle: "Android · Salas privadas, escuadras 4v4 y torneos VANTS",
    accent: "#ff6b1a",
    category: "royale",
    platformLabel: "ANDROID",
    webFallback: "https://vants.cc/torneos?juego=freefire",
    cover: "./img/juegos/freefire.jpg",
  },
  {
    id: "mlbb",
    name: "Mobile Legends: Bang Bang",
    shortTitle: "MOBILE LEGENDS",
    subtitle: "Android · Circuito competitivo 5v5 LATAM",
    accent: "#38bdf8",
    category: "moba",
    platformLabel: "ANDROID",
    webFallback: "https://vants.cc/torneos?juego=mlbb",
    cover: "./img/juegos/mlbb.jpg",
  },
  {
    id: "wildrift",
    name: "LoL: Wild Rift",
    shortTitle: "WILD RIFT",
    subtitle: "Android · Copas tácticas 5v5 y ranking móvil",
    accent: "#2ee58d",
    category: "moba",
    platformLabel: "ANDROID",
    webFallback: "https://vants.cc/torneos?juego=wildrift",
    cover: "./img/juegos/wildrift.jpg",
  },
  {
    id: "clashroyale",
    name: "Clash Royale",
    shortTitle: "CLASH ROYALE",
    subtitle: "Android · Brackets 1v1 en tiempo real y ligas VANTS",
    accent: "#f5c044",
    category: "moba",
    platformLabel: "ANDROID",
    webFallback: "https://vants.cc/torneos?juego=clashroyale",
    cover: "./img/juegos/clashroyale.jpg",
  },
  {
    id: "valorant",
    name: "VALORANT",
    shortTitle: "VALORANT",
    subtitle: "Circuito VANTS · Brackets, resultados y seguimiento RR",
    accent: "#ff4655",
    category: "fps",
    platformLabel: "CIRCUITO VANTS",
    webFallback: "https://vants.cc/torneos?juego=valorant",
    cover: "./img/juegos/valorant.jpg",
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    shortTitle: "CS2",
    subtitle: "FACEIT CS2 · Tabla ELO y partidas de la comunidad",
    accent: "#ff0d2e",
    category: "fps",
    platformLabel: "FACEIT · VANTS",
    webFallback: "https://vants.cc/torneos?juego=cs2",
    cover: "./img/juegos/cs2.jpg",
  },
  {
    id: "fortnite",
    name: "Fortnite",
    shortTitle: "FORTNITE",
    subtitle: "Battle Royale · Torneos abiertos y estadísticas Epic",
    accent: "#38bdf8",
    category: "royale",
    platformLabel: "EPIC · VANTS",
    webFallback: "https://vants.cc/torneos?juego=fortnite",
    cover: "./img/juegos/fortnite.jpg",
  },
  {
    id: "smash",
    name: "Super Smash Bros.",
    shortTitle: "SMASH BROS",
    subtitle: "Comunidad Fighting · Brackets dobles y eventos presenciales",
    accent: "#dce2ec",
    category: "moba",
    platformLabel: "EVENTOS VANTS",
    webFallback: "https://vants.cc/torneos",
    cover: "./img/juegos/smash.jpg",
  },
];

interface NavItem {
  id: TabId;
  label: string;
  icon: ReactNode;
  badge?: string;
  badgeTone?: "live" | "clean" | "default";
}

function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-ES");
}

export function App() {
  const desktop = useMemo(() => getDesktopBridge(), []);
  const isPc = Boolean(desktop);

  const [tab, setTab] = useState<TabId>("inicio");
  const [heroIdx, setHeroIdx] = useState(0);
  const [maximized, setMaximized] = useState(false);
  const [appVersion, setAppVersion] = useState("1.2.6");
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [directos, setDirectos] = useState<DirectoItem[]>([]);
  const [jugadores, setJugadores] = useState<JugadorItem[]>([]);
  const [equipos, setEquipos] = useState<EquipoFaceitItem[]>([]);
  const [clipsComunidad, setClipsComunidad] = useState<ClipComunidadItem[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Exclusivo PC: clips locales y VANTS Shield
  const [localClips, setLocalClips] = useState<LocalClipItem[]>([]);
  const [localFolders, setLocalFolders] = useState<string[]>([]);
  const [scanningClips, setScanningClips] = useState(false);
  const [shieldReport, setShieldReport] = useState<ShieldReport | null>(null);
  const [checkingShield, setCheckingShield] = useState(false);

  // Filtros interactivos
  const [gameCat, setGameCat] = useState<GameCategory>("todos");
  const [searchRank, setSearchRank] = useState("");
  const [rankView, setRankView] = useState<"jugadores" | "equipos">("jugadores");
  const [clipFilter, setClipFilter] = useState("todos");
  const [streamFilter, setStreamFilter] = useState<"todos" | "vivo" | "twitch" | "kick">("todos");
  const [badgeFilter, setBadgeFilter] = useState<"todas" | "mias">("todas");

  // Sesión VANTS Identity, perfil, banner e insignias
  const [session, setSession] = useState<AuthSession | null>(() => getSavedSession());
  const [myPid, setMyPid] = useState<string | null>(null);
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

  const volverAMiPerfil = async () => {
    if (myPid) {
      await cargarPerfilPorPid(myPid);
    } else {
      setPerfilActivo(null);
      setMisInsignias(["MEMBER"]);
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
      showToast(`Bienvenido a VANTS, ${r.session.user.name}`);
      const mias = await fetchMisInsignias(r.session.token);
      if (mias) {
        setMisInsignias(mias.conseguidas);
        setMyPid(mias.pid);
        if (mias.pid) await cargarPerfilPorPid(mias.pid);
      }
    } else {
      showToast("Código inválido o expirado.");
    }
  };

  const handleLogout = () => {
    saveSession(null);
    setSession(null);
    setMyPid(null);
    setPerfilActivo(null);
    setMisInsignias(["MEMBER"]);
    showToast("Sesión cerrada correctamente.");
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
          ? `VANTS Shield verificado · ${report.code}`
          : "VANTS Shield: cierra las herramientas marcadas antes de competir.",
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
      showToast("Comprobante SHA-256 copiado al portapapeles.");
    } catch {
      showToast("No se pudo copiar al portapapeles.");
    }
  };

  useEffect(() => {
    void refreshData();
    if (session?.token) {
      fetchMisInsignias(session.token)
        .then((m) => {
          if (m) {
            setMisInsignias(m.conseguidas);
            setMyPid(m.pid);
            if (m.pid) void cargarPerfilPorPid(m.pid);
          }
        })
        .catch(() => {});
    }
    if (desktop) {
      void scanLocalClips();
      void runShield();
      desktop
        .getAppVersion()
        .then((r) => setAppVersion(r.version))
        .catch(() => {});
      desktop
        .isMaximized()
        .then((r) => setMaximized(Boolean(r.maximized)))
        .catch(() => {});
      const offWin = desktop.onWindowState?.((s) => setMaximized(Boolean(s.maximized)));
      const offUpd = desktop.onUpdateStatus?.((u) => {
        if (u.state === "downloading") setUpdateMsg(`Descargando v${u.version || ""} (${u.percent ?? 0}%)`);
        else if (u.state === "downloaded") setUpdateMsg(`Instalar v${u.version || ""}`);
        else if (u.state === "available") setUpdateMsg(`Nueva v${u.version || ""}`);
      });
      return () => {
        offWin?.();
        offUpd?.();
      };
    }
    return undefined;
  }, [desktop]);

  // Auto-rotación suave del Hero Banner (pausable al cambiar de pestaña)
  useEffect(() => {
    if (tab !== "inicio") return undefined;
    const t = window.setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % 4);
    }, 6500);
    return () => window.clearInterval(t);
  }, [tab]);

  const vivos = useMemo(() => directos.filter((d) => d.en_vivo), [directos]);
  const activeGames = isPc ? PC_GAMES : MOBILE_GAMES;

  const filteredGames = useMemo(() => {
    return activeGames.filter((g) => gameCat === "todos" || g.category === gameCat);
  }, [activeGames, gameCat]);

  const filteredJugadores = useMemo(() => {
    const q = searchRank.trim().toLowerCase();
    if (!q) return jugadores.slice(0, 50);
    return jugadores.filter((j) => j.nick.toLowerCase().includes(q)).slice(0, 50);
  }, [jugadores, searchRank]);

  const filteredDirectos = useMemo(() => {
    return directos.filter((d) => {
      if (streamFilter === "vivo") return d.en_vivo;
      if (streamFilter === "twitch") return d.plataforma.toLowerCase() === "twitch";
      if (streamFilter === "kick") return d.plataforma.toLowerCase() === "kick";
      return true;
    });
  }, [directos, streamFilter]);

  const filteredClips = useMemo(() => {
    if (clipFilter === "todos") return clipsComunidad;
    return clipsComunidad.filter((c) => c.juego.toLowerCase() === clipFilter);
  }, [clipsComunidad, clipFilter]);

  const catalogBadges = insigniasCat.length ? insigniasCat : DEFAULT_INSIGNIAS;
  const visibleBadges = useMemo(() => {
    if (badgeFilter === "mias") {
      return catalogBadges.filter((b) => misInsignias.includes(b.code));
    }
    return catalogBadges;
  }, [catalogBadges, badgeFilter, misInsignias]);

  const handleLaunchGame = async (game: GameEntry) => {
    if (!desktop) {
      openInApp(game.webFallback);
      return;
    }
    const res = await desktop.launchGame(game.id);
    if (res.ok) {
      showToast(`Iniciando ${game.name}…`);
    } else {
      showToast(`${game.platformLabel} no detectado · Abriendo torneos de ${game.name}.`);
      openInApp(game.webFallback);
    }
  };

  // Diapositivas del Hero Showcase (Diapositiva 0 = Diseño exacto VANTS PC / Móvil)
  const heroSlides = [
    {
      prefix: "V",
      titleRest: isPc ? "ANTS PC" : "ANTS MÓVIL",
      words: ["JUEGA", "COMPITE", "CONECTA"],
      sub: "La plataforma definitiva para la comunidad VANTS",
      cta: "Explorar Torneos ↗",
      bg: "./img/ui/hero-vants.jpg",
      onClick: () => openInApp("https://vants.cc/torneos"),
    },
    {
      prefix: "V",
      titleRest: "ANTS OPEN 2026",
      words: ["VALORANT", "CS2", "FORTNITE"],
      sub: "Inscripciones abiertas para escuadras y copas individuales en LATAM",
      cta: isPc ? "Abrir Lanzador ↗" : "Ver Disciplinas ↗",
      bg: "./img/juegos/valorant.jpg",
      onClick: () => setTab("juegos"),
    },
    {
      prefix: "D",
      titleRest: "IRECTOS & CLIPS",
      words: ["TWITCH", "KICK", "HIGHLIGHTS"],
      sub: "Transmisiones verificadas en vivo y las mejores jugadas de la comunidad",
      cta: "Ver Directos ↗",
      bg: "./img/juegos/cs2.jpg",
      onClick: () => setTab("directos"),
    },
    {
      prefix: "P",
      titleRest: "ERFIL & INSIGNIAS",
      words: ["FACEIT", "RIOT ID", "EPIC GAMES"],
      sub: "Sincroniza tus cuentas competitivas y desbloquea emblemas 3D oficiales",
      cta: "Ir a Mi Perfil ↗",
      bg: "./img/juegos/fortnite.jpg",
      onClick: () => setTab("perfil"),
    },
  ];

  const activeSlide = heroSlides[heroIdx] || heroSlides[0];

  // Métricas dinámicas reales para las 4 tarjetas KPI con Sparklines
  const totalCircuitoXp = useMemo(() => {
    const sum = jugadores.reduce((acc, j) => acc + (Number(j.xp) || 0), 0);
    return sum > 0 ? sum : 4850;
  }, [jugadores]);

  const myRankIndex = useMemo(() => {
    if (!myPid) return -1;
    return jugadores.findIndex((j) => j.pid === myPid);
  }, [jugadores, myPid]);

  const topPlayer = jugadores[0];
  const secondPlayer = jugadores[1];
  const latestClip = clipsComunidad[0];

  // Feed de Actividad Reciente alimentado con datos reales de VANTS
  const activityFeed = useMemo(
    () => [
      {
        id: "act-1",
        icon: <IconTrophy size={18} style={{ color: "#f5c044" }} />,
        title: "Líder actual del Ranking VANTS",
        sub: topPlayer
          ? `🔥 ${topPlayer.nick} encabeza con ${topPlayer.xp.toLocaleString("es-ES")} XP`
          : "🔥 Leyenda VANTS · Clasificación activa",
        time: "En vivo",
        action: () => setTab("ranking"),
      },
      {
        id: "act-2",
        icon: <IconUserPlus size={18} style={{ color: "#2ee58d" }} />,
        title: "Competidor destacado en comunidad",
        sub: secondPlayer
          ? `${secondPlayer.nick} compite en el circuito VANTS`
          : "Nuevos competidores vinculados a FACEIT & Riot",
        time: "Reciente",
        action: () => setTab("ranking"),
      },
      {
        id: "act-3",
        icon: <IconClapper size={18} style={{ color: "#8ea1ff" }} />,
        title: "Nuevo clip destacado",
        sub: latestClip
          ? `${latestClip.titulo} · ${latestClip.juego.toUpperCase()}`
          : "Jugadas épicas en VALORANT y CS2",
        time: "Destacado",
        action: () => setTab("clips"),
      },
      {
        id: "act-4",
        icon: <img src="./brand/vants-mark.png" alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />,
        title: "Temporada competitiva activa",
        sub: "PASE S4 – Torneos Semanales Abiertos",
        time: "Abierto",
        action: () => setTab("planes"),
      },
    ],
    [topPlayer, secondPlayer, latestClip],
  );

  // Rail lateral con los iconos de color exactos al diseño VANTS PC
  const navItems: NavItem[] = [
    {
      id: "inicio",
      label: "Inicio",
      icon: <IconHome size={18} style={{ color: tab === "inicio" ? "#fff" : "#f43f5e" }} />,
    },
    {
      id: "juegos",
      label: isPc ? "Lanzador PC" : "Torneos",
      icon: <IconGamepad size={18} style={{ color: "#818cf8" }} />,
    },
    {
      id: "clips",
      label: isPc ? "Clips PC" : "Clips",
      icon: <IconClapper size={18} style={{ color: "#93c5fd" }} />,
      badge: isPc ? String(localClips.length || clipsComunidad.length || 0) : String(clipsComunidad.length || 0),
    },
    {
      id: "directos",
      label: "Directos",
      icon: <IconLiveDot size={17} />,
      badge: vivos.length ? String(vivos.length) : undefined,
      badgeTone: "live",
    },
    {
      id: "ranking",
      label: "Ranking",
      icon: <IconTrophy size={18} style={{ color: "#f5c044" }} />,
    },
    {
      id: "perfil",
      label: session ? session.user.name.slice(0, 14) : "Perfil / Entrar",
      icon: <IconUser size={18} style={{ color: "#fb7185" }} />,
    },
    {
      id: "planes",
      label: "Planes",
      icon: <IconStar size={18} style={{ color: "#f5c044" }} />,
    },
    ...(isPc
      ? [
          {
            id: "shield" as TabId,
            label: "VANTS Shield",
            icon: <IconShield size={18} style={{ color: "#60a5fa" }} />,
            badge: shieldReport ? (shieldReport.status === "clean" ? "OK" : "!") : "OK",
            badgeTone: (shieldReport?.status === "flagged" ? "live" : "clean") as "live" | "clean",
          },
        ]
      : []),
  ];

  const mobileBottomNav: Array<{ id: TabId; label: string; icon: ReactNode }> = [
    { id: "inicio", label: "Inicio", icon: <IconHome size={19} /> },
    { id: "juegos", label: "Torneos", icon: <IconGamepad size={19} /> },
    { id: "directos", label: "En Vivo", icon: <IconBroadcast size={19} /> },
    { id: "ranking", label: "Ranking", icon: <IconTrophy size={19} /> },
    { id: "perfil", label: session ? "Perfil" : "Entrar", icon: <IconUser size={19} /> },
  ];

  const currentXp = perfilActivo?.xp ?? 0;
  const vantsLevel = Math.max(1, Math.floor(currentXp / 250) + 1);
  const xpProgressPct = Math.min(100, Math.round(((currentXp % 250) / 250) * 100));
  const viewingOtherPlayer = Boolean(perfilActivo && (!myPid || perfilActivo.pid !== myPid));

  return (
    <div className="vants-shell">
      {/* ── Barra Superior Nativa ── */}
      <header className="vants-titlebar">
        <div className="vants-titlebar-left">
          <div className="brand-lockup" onClick={() => setTab("inicio")} style={{ cursor: "pointer" }}>
            <img src="./brand/vants-mark.png" alt="VANTS" className="vants-mark" />
            <span className="vants-brand-title">{isPc ? "VANTS PC" : "VANTS MÓVIL"}</span>
          </div>
          <span className={`online-pill ${offline ? "offline" : ""}`}>
            <span>{offline ? "MODO CACHÉ" : "EN LÍNEA"}</span>
            <span className="online-pill-dot" />
          </span>

          {updateMsg && (
            <button type="button" className="btn primary sm" onClick={() => void desktop?.installUpdate()}>
              {updateMsg}
            </button>
          )}
        </div>

        <div className="vants-titlebar-right">
          <button
            id="carbon-identity-btn"
            type="button"
            className={`login-pill-btn ${session ? "logged" : ""}`}
            onClick={() => setTab("perfil")}
          >
            {session ? (
              <>
                {session.user.picture ? (
                  <img src={session.user.picture} alt={session.user.name} className="identity-avatar-xs" />
                ) : (
                  <span className="identity-avatar-xs">{session.user.name.slice(0, 2).toUpperCase()}</span>
                )}
                <span>{session.user.name.slice(0, 14)}</span>
              </>
            ) : (
              <>
                <IconUser size={14} />
                <span>Iniciar sesión</span>
              </>
            )}
          </button>

          <button type="button" className="win-btn" title="Sincronizar datos" onClick={() => void refreshData()}>
            <IconRefresh size={14} />
          </button>

          {isPc && (
            <div className="win-controls">
              <button type="button" className="win-btn" title="Minimizar" onClick={() => void desktop?.minimize()}>
                <IconWinMin />
              </button>
              <button
                type="button"
                className="win-btn"
                title={maximized ? "Restaurar" : "Maximizar"}
                onClick={() => void desktop?.toggleMaximize()}
              >
                <IconWinMax maximized={maximized} />
              </button>
              <button type="button" className="win-btn close" title="Cerrar" onClick={() => void desktop?.close()}>
                <IconWinClose />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Franja Rápida Complementaria Android ── */}
      <div className="vants-mobile-strip" aria-label="Accesos rápidos de VANTS Móvil">
        <button
          type="button"
          className={`mobile-chip ${tab === "clips" ? "active" : ""}`}
          onClick={() => setTab("clips")}
        >
          <IconClapper size={14} />
          <span>Clips ({clipsComunidad.length})</span>
        </button>
        <button
          type="button"
          className={`mobile-chip ${tab === "planes" ? "active" : ""}`}
          onClick={() => setTab("planes")}
        >
          <IconCrown size={14} />
          <span>VANTS PRO &amp; S4</span>
        </button>
        <button
          type="button"
          className={`mobile-chip ${tab === "ranking" && rankView === "equipos" ? "active" : ""}`}
          onClick={() => {
            setRankView("equipos");
            setTab("ranking");
          }}
        >
          <IconUsers size={14} />
          <span>Escuadras ({equipos.length})</span>
        </button>
        <button type="button" className="mobile-chip" onClick={() => openUrl("https://vants.cc")}>
          <IconExternal size={13} />
          <span>vants.cc</span>
        </button>
      </div>

      <div className="vants-body">
        {/* ── Sidebar Izquierda Futurista (PC) ── */}
        <aside className="vants-rail" aria-label="Navegación principal">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-icon-slot">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`nav-badge ${
                    item.badgeTone === "live" ? "live" : item.badgeTone === "clean" ? "clean" : ""
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="rail-brand-footer">
            <div className="rail-crest-glow">
              <img src="./brand/vants-mark.png" alt="VANTS Crest" />
            </div>
            <div className="rail-brand-name">{isPc ? "VANTS PC" : "VANTS MÓVIL"}</div>
            <p className="rail-brand-desc">Tu plataforma de esports y gaming competitivo</p>
            <button type="button" className="rail-portal-btn" onClick={() => openUrl("https://vants.cc")}>
              <span>Abrir vants.cc</span>
              <IconExternal size={13} />
            </button>
            <div className="rail-version-label">VANTS App · v{appVersion}</div>
          </div>
        </aside>

        {/* ── Lienzo Principal ── */}
        <main className="vants-main">
          <div className="vants-container">
            {/* ==================== INICIO (NUEVO DASHBOARD FUTURISTA) ==================== */}
            {tab === "inicio" && (
              <div className="home-dashboard-grid">
                {/* COLUMNA IZQUIERDA PRINCIPAL */}
                <div className="home-left-stack">
                  {/* 1) Hero Showcase con Soldado Táctico & Carrusel */}
                  <section className="hero-showcase">
                    <div
                      className="hero-showcase-bg"
                      style={{ backgroundImage: `url(${activeSlide.bg})` }}
                    />
                    <div className="hero-showcase-scrim" />
                    <div className="hero-showcase-content">
                      <h1 className="hero-futuristic-title">
                        <span className="v-accent">{activeSlide.prefix}</span>
                        {activeSlide.titleRest}
                      </h1>
                      <div className="hero-futuristic-tagline">
                        <span>{activeSlide.words[0]}</span>
                        <span className="hero-diamond">♦</span>
                        <span>{activeSlide.words[1]}</span>
                        <span className="hero-diamond">♦</span>
                        <span>{activeSlide.words[2]}</span>
                      </div>
                      <p className="hero-futuristic-sub">{activeSlide.sub}</p>
                      <button type="button" className="hero-glow-cta" onClick={activeSlide.onClick}>
                        <span>{activeSlide.cta}</span>
                      </button>
                    </div>

                    <div className="hero-dots" role="tablist" aria-label="Diapositivas destacadas">
                      {heroSlides.map((s, idx) => (
                        <button
                          key={s.titleRest}
                          type="button"
                          aria-label={`Diapositiva ${idx + 1}`}
                          className={`hero-dot ${heroIdx === idx ? "active" : ""}`}
                          onClick={() => setHeroIdx(idx)}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 2) Fila de 4 Tarjetas KPI con Sparklines */}
                  <div className="kpi-spark-grid">
                    <div className="kpi-card" onClick={() => setTab("ranking")}>
                      <div className="kpi-head">
                        <span className="kpi-icon-badge" style={{ background: "rgba(255, 13, 46, 0.16)", color: "#ff3352" }}>
                          <IconUsers size={16} />
                        </span>
                        <span>Jugadores VANTS</span>
                      </div>
                      <div className="kpi-bottom">
                        <div>
                          <div className="kpi-value">
                            {loading ? "…" : formatCompactNumber(Math.max(jugadores.length, 1))}
                          </div>
                          <div className="kpi-delta">↑ Comunidad activa</div>
                        </div>
                        <SparklineArea
                          id="players"
                          points={[18, 24, 21, 32, 29, 41, 38, 52]}
                          stroke="#2ee58d"
                          secondaryPoints={[14, 19, 17, 22, 26, 23, 30, 34]}
                          secondaryStroke="#ff2946"
                        />
                      </div>
                    </div>

                    <div className="kpi-card" onClick={() => openInApp("https://vants.cc/torneos")}>
                      <div className="kpi-head">
                        <span className="kpi-icon-badge" style={{ background: "rgba(168, 85, 247, 0.16)", color: "#c084fc" }}>
                          <IconTrophy size={16} />
                        </span>
                        <span>Torneos &amp; Directos</span>
                      </div>
                      <div className="kpi-bottom">
                        <div>
                          <div className="kpi-value">{loading ? "…" : vivos.length || Math.max(directos.length, 3)}</div>
                          <div className="kpi-delta neutral">Ver agenda →</div>
                        </div>
                        <SparklineArea
                          id="tourneys"
                          points={[12, 16, 15, 23, 21, 29, 34, 44]}
                          stroke="#a855f7"
                        />
                      </div>
                    </div>

                    <div className="kpi-card" onClick={() => setTab("ranking")}>
                      <div className="kpi-head">
                        <span className="kpi-icon-badge" style={{ background: "rgba(245, 192, 68, 0.16)", color: "#f5c044" }}>
                          <IconCrown size={16} />
                        </span>
                        <span>Ranking Global</span>
                      </div>
                      <div className="kpi-bottom">
                        <div>
                          <div className="kpi-value">
                            {myRankIndex >= 0 ? `#${myRankIndex + 1}` : "#1"}
                          </div>
                          <div className="kpi-delta">
                            ↑ {topPlayer ? `${topPlayer.nick} Top` : "Tabla oficial"}
                          </div>
                        </div>
                        <SparklineArea
                          id="rank"
                          points={[20, 18, 25, 22, 30, 27, 35, 42]}
                          stroke="#f5c044"
                        />
                      </div>
                    </div>

                    <div className="kpi-card" onClick={() => setTab("perfil")}>
                      <div className="kpi-head">
                        <span className="kpi-icon-badge" style={{ background: "rgba(56, 189, 248, 0.16)", color: "#38bdf8" }}>
                          <IconBolt size={16} />
                        </span>
                        <span>XP Total Circuito</span>
                      </div>
                      <div className="kpi-bottom">
                        <div>
                          <div className="kpi-value">{formatCompactNumber(totalCircuitoXp)}</div>
                          <div className="kpi-delta">↑ Temporada S4</div>
                        </div>
                        <SparklineArea
                          id="xp"
                          points={[10, 15, 19, 18, 27, 33, 39, 49]}
                          stroke="#38bdf8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3) Paneles Inferiores: Actividad Reciente + Juegos Disponibles 3x2 */}
                  <div className="home-bottom-split">
                    <section className="glass-panel crimson-edge">
                      <div className="panel-header-row">
                        <h2 className="panel-header-title">
                          <IconPulse size={17} style={{ color: "var(--red)" }} />
                          <span>Actividad Reciente</span>
                        </h2>
                        <button type="button" className="pill-ghost-btn" onClick={() => setTab("ranking")}>
                          Ver todo →
                        </button>
                      </div>

                      <div className="activity-list">
                        {activityFeed.map((item) => (
                          <div key={item.id} className="activity-item" onClick={item.action}>
                            <div className="activity-icon-box">{item.icon}</div>
                            <div className="activity-copy">
                              <div className="activity-title">{item.title}</div>
                              <div className="activity-sub">{item.sub}</div>
                            </div>
                            <div className="activity-time">{item.time}</div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="glass-panel">
                      <div className="panel-header-row">
                        <h2 className="panel-header-title">
                          <IconPulse size={17} style={{ color: "var(--red)" }} />
                          <span>Juegos Disponibles</span>
                        </h2>
                        <button type="button" className="pill-ghost-btn" onClick={() => setTab("juegos")}>
                          {isPc ? "Lanzar todos →" : "Ver todos →"}
                        </button>
                      </div>

                      <div className="poster-mini-grid">
                        {activeGames.slice(0, 6).map((g) => (
                          <div key={g.id} className="poster-tile" onClick={() => void handleLaunchGame(g)}>
                            <img src={g.cover} alt={g.name} className="poster-tile-img" loading="lazy" />
                            <div className="poster-tile-scrim" />
                            <div className="poster-tile-name">{g.shortTitle}</div>
                            <span className="poster-play-pill">{isPc ? "Jugar →" : "Torneos →"}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>

                {/* COLUMNA DERECHA DE WIDGETS TÁCTICOS */}
                <div className="home-right-stack">
                  {/* Widget 1: VANTS SHIELD (PC) / VANTS IDENTITY (Android) */}
                  <section className="widget-shield-card">
                    <img src="./img/ui/shield-crest.jpg" alt="VANTS Shield" className="widget-shield-art" />
                    <div className="widget-shield-body">
                      <h2 className="widget-shield-title">{isPc ? "VANTS SHIELD" : "VANTS IDENTITY"}</h2>
                      {isPc ? (
                        <>
                          <div className={`shield-ok-row ${shieldReport?.status === "flagged" ? "flagged" : ""}`}>
                            <IconCheck size={15} />
                            <span>{shieldReport?.status === "flagged" ? "Revisar procesos" : "Todo en orden"}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.35 }}>
                            Entorno verificado · Anti-Cheat activo
                            <br />
                            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                              {shieldReport ? shieldReport.code.slice(0, 12) : "SHA-256 OK"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="shield-ok-row">
                            <IconCheck size={15} />
                            <span>{session ? "Cuenta verificada" : "Acceso seguro"}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.35 }}>
                            Sincroniza tus insignias 3D y rango competitivo
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      className="widget-dark-pill"
                      onClick={() => setTab(isPc ? "shield" : "perfil")}
                    >
                      Ver detalles →
                    </button>
                  </section>

                  {/* Widget 2: Próximos Torneos */}
                  <section className="widget-tourney-card">
                    <div className="panel-header-row" style={{ marginBottom: 9 }}>
                      <h2 className="panel-header-title" style={{ fontSize: 14 }}>
                        Próximos Torneos
                      </h2>
                      <span
                        style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer" }}
                        onClick={() => openInApp("https://vants.cc/torneos")}
                      >
                        Ver todos →
                      </span>
                    </div>

                    <div className="tourney-mini-box" onClick={() => openInApp("https://vants.cc/torneos")}>
                      <img src="./img/ui/hero-vants.jpg" alt="VANTS Open" className="tourney-thumb" />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "var(--f-display)",
                            fontSize: 16,
                            fontWeight: 800,
                            letterSpacing: "0.03em",
                            lineHeight: 1.05,
                          }}
                        >
                          VANTS OPEN 2026
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                          Valorant &amp; CS2 • LATAM
                        </div>
                        <div className="tourney-date-pill">
                          <IconCalendar size={11} />
                          <span>Circuito Abierto · 19:00 (VE)</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Widget 3: VANTS PRO Jersey */}
                  <section className="widget-pro-card">
                    <img src="./img/ui/pro-jersey.jpg" alt="Jersey VANTS PRO" className="widget-pro-art" />
                    <div className="widget-pro-body">
                      <IconCrown size={22} style={{ color: "#f5c044" }} />
                      <h2 className="widget-pro-title">VANTS PRO</h2>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--text-2)", lineHeight: 1.35 }}>
                        Beneficios exclusivos y mercancía oficial: jersey VANTS PRO
                      </p>
                      <button type="button" className="widget-red-pill" onClick={() => setTab("planes")}>
                        Conoce más →
                      </button>
                    </div>
                  </section>

                  {/* Widget 4: Comunidad Discord */}
                  <section className="widget-discord-card">
                    <div className="discord-icon-circle">
                      <IconDiscord size={20} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Únete a nuestra comunidad</div>
                      <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.35 }}>
                        Conecta con jugadores, participa en torneos y sé parte de VANTS.
                      </p>
                      <button
                        type="button"
                        className="discord-cta-btn"
                        onClick={() => openInApp("https://vants.cc/comunidad")}
                      >
                        Entrar al Discord →
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* ==================== JUEGOS / LANZADOR ==================== */}
            {tab === "juegos" && (
              <>
                <div className="section-head">
                  <div className="section-head-titles">
                    <div className="eyebrow">{isPc ? "EJECUCIÓN DIRECTA" : "CIRCUITO MÓVIL & MULTIPLATAFORMA"}</div>
                    <h1>{isPc ? "LANZADOR DE JUEGOS Y TORNEOS PC" : "TORNEOS Y JUEGOS VANTS MÓVIL"}</h1>
                    <p>
                      {isPc
                        ? "Inicia tus títulos instalados en Riot Client, Steam o Epic Games con un clic o consulta sus torneos activos."
                        : "Selecciona tu disciplina competitiva para inscribirte en salas, copas 1v1 o torneos de escuadra."}
                    </p>
                  </div>
                  <div className="carbon-tabs" role="tablist">
                    {(
                      [
                        { id: "todos", label: "TODOS" },
                        { id: "fps", label: "TACTICAL FPS" },
                        { id: "royale", label: "BATTLE ROYALE" },
                        { id: "moba", label: "MOBA & LIGAS" },
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        role="tab"
                        aria-selected={gameCat === cat.id}
                        className={`carbon-tab ${gameCat === cat.id ? "active" : ""}`}
                        onClick={() => setGameCat(cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid-cards">
                  {filteredGames.map((g) => (
                    <article key={g.id} className="card game-card">
                      <div className="game-cover-wrap">
                        <img src={g.cover} alt={g.name} className="game-cover-img" loading="lazy" />
                        <div className="game-cover-scrim" />
                        <span className="game-cover-badge">{g.platformLabel}</span>
                      </div>
                      <div className="game-card-body">
                        <div style={{ width: 36, height: 2, background: g.accent }} />
                        <h2 className="card-title">{g.name}</h2>
                        <p className="card-meta">{g.subtitle}</p>
                        <div className="card-actions">
                          <button type="button" className="btn primary" onClick={() => void handleLaunchGame(g)}>
                            <IconPlay size={14} />
                            <span>{isPc ? `ABRIR ${g.shortTitle}` : "VER TORNEOS"}</span>
                          </button>
                          {isPc && (
                            <button type="button" className="btn" onClick={() => openInApp(g.webFallback)}>
                              <span>BRACKETS</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* ==================== CLIPS ==================== */}
            {tab === "clips" && (
              <>
                {isPc && (
                  <>
                    <div className="section-head">
                      <div className="section-head-titles">
                        <div className="eyebrow">DISCO LOCAL · RAZER CORTEX &amp; VIDEOS</div>
                        <h1>CLIPS DETECTADOS EN ESTE PC ({localClips.length})</h1>
                      </div>
                      <button type="button" className="btn" onClick={() => void scanLocalClips()}>
                        <IconRefresh size={14} />
                        <span>{scanningClips ? "ESCANEANDO…" : "RE-ESCANEAR CARPETAS"}</span>
                      </button>
                    </div>

                    {localClips.length === 0 ? (
                      <div className="card" style={{ marginBottom: 24 }}>
                        <h3 className="card-title">SIN GRABACIONES LOCALES DETECTADAS</h3>
                        <p className="card-meta">
                          Rutas monitorizadas:{" "}
                          <span className="mono">
                            {localFolders.length
                              ? localFolders.join(" · ")
                              : "Videos/VALORANT · Videos/CS2 · Videos/Captures · Razer Cortex/GameClips"}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="grid-cards">
                        {localClips.map((clip) => (
                          <article key={clip.path} className="card">
                            <div className="card-accent-top" style={{ background: "var(--red)" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <span className="tag red">{clip.game}</span>
                              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                                {clip.sizeMb} MB
                              </span>
                            </div>
                            <h3 className="card-title" style={{ fontSize: 16, wordBreak: "break-word" }}>
                              {clip.name}
                            </h3>
                            <p className="card-meta mono">
                              {new Date(clip.mtimeMs).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <div className="card-actions">
                              <button
                                type="button"
                                className="btn primary sm"
                                onClick={() => void desktop?.openClipFile(clip.path)}
                              >
                                <IconPlay size={13} />
                                <span>REPRODUCIR</span>
                              </button>
                              <button
                                type="button"
                                className="btn sm"
                                onClick={() => void desktop?.revealClipFolder(clip.path)}
                              >
                                <IconFolder size={14} />
                                <span>CARPETA</span>
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="section-head">
                  <div className="section-head-titles">
                    <div className="eyebrow">HIGHLIGHTS VERIFICADOS</div>
                    <h2>CLIPS DE LA COMUNIDAD VANTS</h2>
                  </div>
                  <div className="carbon-tabs" role="tablist">
                    {["todos", "valorant", "cs2", "fortnite"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        role="tab"
                        aria-selected={clipFilter === g}
                        className={`carbon-tab ${clipFilter === g ? "active" : ""}`}
                        onClick={() => setClipFilter(g)}
                      >
                        {g.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredClips.length === 0 ? (
                  <div className="card">
                    <h3 className="card-title">NO HAY CLIPS EN ESTE FILTRO</h3>
                    <p className="card-meta">Prueba seleccionando otra disciplina o sincroniza nuevamente.</p>
                  </div>
                ) : (
                  <div className="grid-cards">
                    {filteredClips.slice(0, 18).map((c) => (
                      <article key={c.id} className="card media-card">
                        <div className="media-thumb-wrap">
                          {c.miniatura ? (
                            <img src={c.miniatura} alt={c.titulo} className="media-thumb" loading="lazy" />
                          ) : (
                            <div className="media-thumb-fallback">
                              <IconFilm size={26} />
                            </div>
                          )}
                          <div className="media-badge-tl">
                            <span className="tag">{c.juego.toUpperCase()}</span>
                          </div>
                          <span className="media-badge-br">{c.plataforma.toUpperCase()}</span>
                        </div>
                        <div className="media-body">
                          <h3 className="card-title" style={{ fontSize: 16 }}>
                            {c.titulo}
                          </h3>
                          <p className="card-meta">{c.autor || "Competidor VANTS"}</p>
                          <div className="card-actions">
                            <button type="button" className="btn primary sm" onClick={() => openUrl(c.url)}>
                              <IconPlay size={13} />
                              <span>VER JUGADA</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ==================== DIRECTOS ==================== */}
            {tab === "directos" && (
              <>
                <div className="section-head">
                  <div className="section-head-titles">
                    <div className="eyebrow">TRANSMISIONES DEL CIRCUITO</div>
                    <h1>DIRECTOS TWITCH &amp; KICK ({vivos.length} EN VIVO)</h1>
                  </div>
                  <div className="btn-row">
                    <div className="carbon-tabs" role="tablist">
                      {(
                        [
                          { id: "todos", label: "TODOS" },
                          { id: "vivo", label: `EN VIVO (${vivos.length})` },
                          { id: "twitch", label: "TWITCH" },
                          { id: "kick", label: "KICK" },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          role="tab"
                          aria-selected={streamFilter === f.id}
                          className={`carbon-tab ${streamFilter === f.id ? "active" : ""}`}
                          onClick={() => setStreamFilter(f.id)}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="btn sm" onClick={() => void refreshData()}>
                      <IconRefresh size={14} />
                      <span>ACTUALIZAR</span>
                    </button>
                  </div>
                </div>

                <div className="grid-cards">
                  {filteredDirectos.map((d) => (
                    <article key={`${d.plataforma}:${d.canal}`} className="card media-card">
                      <div className="media-thumb-wrap">
                        {d.miniatura ? (
                          <img src={d.miniatura} alt={d.nombre} className="media-thumb" loading="lazy" />
                        ) : (
                          <div className="media-thumb-fallback">
                            <IconBroadcast size={28} />
                          </div>
                        )}
                        <div className="media-badge-tl">
                          <span className={`tag ${d.en_vivo ? "red" : ""}`}>{d.en_vivo ? "EN VIVO" : "OFFLINE"}</span>
                        </div>
                        <span className="media-badge-br">
                          {d.en_vivo && d.espectadores != null
                            ? `${d.espectadores} ESPECTADORES`
                            : d.plataforma.toUpperCase()}
                        </span>
                      </div>
                      <div className="media-body">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <h2 className="card-title" style={{ fontSize: 18 }}>
                            {d.nombre}
                          </h2>
                          <span className="tag">{d.plataforma.toUpperCase()}</span>
                        </div>
                        <p className="card-meta">{d.titulo || d.juego || "Canal verificado de la red VANTS"}</p>
                        <div className="card-actions">
                          <button type="button" className="btn primary sm" onClick={() => openUrl(d.url)}>
                            <span>ABRIR TRANSMISIÓN</span>
                            <IconExternal size={13} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* ==================== RANKING & EQUIPOS ==================== */}
            {tab === "ranking" && (
              <>
                <div className="section-head">
                  <div className="section-head-titles">
                    <div className="eyebrow">CLASIFICACIÓN OFICIAL</div>
                    <h1>
                      {rankView === "jugadores"
                        ? `RANKING DE COMPETIDORES (${jugadores.length})`
                        : `EQUIPOS FACEIT REGISTRADOS (${equipos.length})`}
                    </h1>
                  </div>
                  <div className="btn-row">
                    <div className="carbon-tabs" role="tablist">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={rankView === "jugadores"}
                        className={`carbon-tab ${rankView === "jugadores" ? "active" : ""}`}
                        onClick={() => setRankView("jugadores")}
                      >
                        JUGADORES TOP
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={rankView === "equipos"}
                        className={`carbon-tab ${rankView === "equipos" ? "active" : ""}`}
                        onClick={() => setRankView("equipos")}
                      >
                        EQUIPOS FACEIT ({equipos.length})
                      </button>
                    </div>

                    {rankView === "jugadores" && (
                      <div className="search-wrap">
                        <IconSearch size={15} />
                        <input
                          id="ranking-player-search"
                          type="search"
                          className="search-input"
                          placeholder="Filtrar por nick…"
                          value={searchRank}
                          onChange={(e) => setSearchRank(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {rankView === "jugadores" ? (
                  <>
                    {!searchRank.trim() && filteredJugadores.length >= 3 && (
                      <div className="podium-grid">
                        {filteredJugadores.slice(0, 3).map((j, idx) => {
                          const accent = idx === 0 ? "#f5c044" : idx === 1 ? "#dce2ec" : "#e08b56";
                          return (
                            <div
                              key={j.pid}
                              className="podium-card"
                              onClick={() => {
                                void cargarPerfilPorPid(j.pid);
                                setTab("perfil");
                              }}
                            >
                              <div className="card-accent-top" style={{ background: accent }} />
                              <div className="podium-rank" style={{ color: accent }}>
                                #{idx + 1}
                              </div>
                              {j.avatar ? (
                                <img
                                  src={j.avatar}
                                  alt={j.nick}
                                  className="rank-avatar"
                                  style={{ width: 46, height: 46 }}
                                />
                              ) : (
                                <div className="rank-avatar" style={{ width: 46, height: 46 }}>
                                  {j.nick.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div className="rank-nick">
                                  <span>{j.nick}</span>
                                  {j.sello && <span className="tag gold">{j.sello}</span>}
                                </div>
                                <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                                  {j.elo != null ? `${j.elo} ELO · ` : ""}
                                  {j.xp} XP
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="rank-list">
                      {filteredJugadores.map((j, idx) => (
                        <div
                          key={j.pid}
                          className="rank-row"
                          onClick={() => {
                            void cargarPerfilPorPid(j.pid);
                            setTab("perfil");
                          }}
                        >
                          <div className="rank-pos">#{idx + 1}</div>
                          {j.avatar ? (
                            <img src={j.avatar} alt={j.nick} className="rank-avatar" loading="lazy" />
                          ) : (
                            <div className="rank-avatar">{j.nick.slice(0, 2).toUpperCase()}</div>
                          )}
                          <div className="rank-info">
                            <div className="rank-nick">
                              <span>{j.nick}</span>
                              {j.sello && <span className="tag red">{j.sello}</span>}
                              {j.fundador && <span className="tag gold">FUNDADOR</span>}
                            </div>
                            <div className="rank-sub">
                              <span className="mono">{j.xp} XP</span> · Toca para inspeccionar banner e insignias
                            </div>
                          </div>
                          <div className="rank-metrics">
                            {j.nivel != null && <span className="tag ok">LVL {j.nivel}</span>}
                            {j.elo != null && <span>{j.elo} ELO</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="grid-cards">
                    {equipos.map((eq) => (
                      <article key={eq.id} className="card">
                        <div className="card-accent-top" style={{ background: "var(--orange)" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {eq.avatar ? (
                            <img
                              src={eq.avatar}
                              alt={eq.nombre}
                              className="rank-avatar"
                              style={{ width: 44, height: 44 }}
                            />
                          ) : (
                            <div className="rank-avatar" style={{ width: 44, height: 44 }}>
                              {(eq.tag || eq.nombre).slice(0, 3).toUpperCase()}
                            </div>
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h3 className="card-title" style={{ fontSize: 18 }}>
                              {eq.nombre}
                            </h3>
                            <span className="tag">{eq.tag ? `[${eq.tag}]` : "ESCUADRA FACEIT"}</span>
                          </div>
                        </div>

                        {eq.jugadores && eq.jugadores.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                            {eq.jugadores.slice(0, 6).map((m) => (
                              <span key={m.id} className="tag">
                                {m.nickname} {m.nivel ? `· L${m.nivel}` : ""}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="card-actions">
                          <button type="button" className="btn sm" onClick={() => openUrl(eq.url)}>
                            <span>FICHA EN FACEIT</span>
                            <IconExternal size={13} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ==================== PERFIL & INSIGNIAS ==================== */}
            {tab === "perfil" && (
              <>
                <div className="section-head">
                  <div className="section-head-titles">
                    <div className="eyebrow">VANTS IDENTITY &amp; REPUTACIÓN</div>
                    <h1>PERFIL COMPETITIVO, BANNER E INSIGNIAS 3D</h1>
                  </div>
                  <div className="btn-row">
                    {viewingOtherPlayer && (
                      <button type="button" className="btn primary sm" onClick={() => void volverAMiPerfil()}>
                        <span>← VOLVER A MI CUENTA</span>
                      </button>
                    )}
                    <button type="button" className="btn sm" onClick={() => openInApp("https://vants.cc/perfil")}>
                      <span>EDITAR BANNER / VINCULAR CUENTAS</span>
                      <IconExternal size={13} />
                    </button>
                    {session && (
                      <button type="button" className="btn sm" onClick={handleLogout}>
                        <IconLogout size={14} />
                        <span>SALIR</span>
                      </button>
                    )}
                  </div>
                </div>

                {!session && !viewingOtherPlayer && (
                  <section className="auth-panel" aria-label="Acceso VANTS Identity">
                    <div>
                      <div className="eyebrow">ACCESO RÁPIDO SIN CONTRASEÑA</div>
                      <h2 className="card-title" style={{ fontSize: 22, marginBottom: 6 }}>
                        CONECTA TU CUENTA VANTS IDENTITY
                      </h2>
                      <p className="card-meta" style={{ marginBottom: 14 }}>
                        Recibe un código temporal de 6 dígitos en tu correo para sincronizar tu perfil competitivo, tu
                        banner personalizado y tus insignias desbloqueadas en PC y Android.
                      </p>
                      <div className="btn-row">
                        <input
                          id="auth-email-input"
                          type="email"
                          className="search-input plain"
                          placeholder="tu-correo@ejemplo.com"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          style={{ maxWidth: 260 }}
                        />
                        {!otpSent ? (
                          <button
                            id="auth-send-otp-btn"
                            type="button"
                            className="btn primary"
                            disabled={authBusy}
                            onClick={() => void handleSendOtp()}
                          >
                            <IconMail size={15} />
                            <span>{authBusy ? "ENVIANDO…" : "ENVIAR CÓDIGO"}</span>
                          </button>
                        ) : (
                          <>
                            <input
                              id="auth-otp-code-input"
                              type="text"
                              className="search-input plain mono"
                              placeholder="000000"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              style={{ width: 120 }}
                            />
                            <button
                              id="auth-verify-otp-btn"
                              type="button"
                              className="btn primary"
                              disabled={authBusy}
                              onClick={() => void handleVerifyOtp()}
                            >
                              <IconCheck size={15} />
                              <span>{authBusy ? "VALIDANDO…" : "VERIFICAR"}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="auth-divider">
                      <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        OAUTH SINGLE SIGN-ON
                      </div>
                      <button type="button" className="btn" onClick={() => openInApp("https://vants.cc/entrar")}>
                        <IconUser size={15} />
                        <span>CONTINUAR CON GOOGLE / DISCORD</span>
                      </button>
                      <p className="card-meta" style={{ fontSize: 11.5 }}>
                        Sincronización instantánea con FACEIT CS2, Riot ID (VALORANT) y Epic Games (Fortnite).
                      </p>
                    </div>
                  </section>
                )}

                <section className="profile-banner">
                  <div
                    className="profile-banner-bg"
                    style={{
                      backgroundImage: `url(${perfilActivo?.banner || "./img/ui/hero-vants.jpg"})`,
                    }}
                  />
                  <div className="profile-banner-scrim" />
                  <div className="profile-banner-inner">
                    {perfilActivo?.avatar || (!viewingOtherPlayer && session?.user.picture) ? (
                      <img
                        src={perfilActivo?.avatar || session?.user.picture || ""}
                        alt="Avatar del jugador"
                        className="profile-avatar-lg"
                      />
                    ) : (
                      <div className="profile-avatar-lg">
                        {(perfilActivo?.nick || session?.user.name || "VG").slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h2
                          style={{
                            margin: 0,
                            fontFamily: "var(--f-display)",
                            fontSize: 30,
                            lineHeight: 1,
                            textTransform: "uppercase",
                            fontWeight: 800,
                          }}
                        >
                          {perfilActivo?.nick || session?.user.name || "COMPETIDOR VANTS"}
                        </h2>
                        {perfilActivo?.sello && <span className="tag red">{perfilActivo.sello}</span>}
                        {perfilActivo?.fundador && <span className="tag gold">FUNDADOR VANTS</span>}
                        <span className="tag ok">NIVEL {vantsLevel}</span>
                      </div>

                      <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--text-2)" }}>
                        {perfilActivo
                          ? `${perfilActivo.xp} XP acumulados · ${perfilActivo.insignias?.length || misInsignias.length} insignias activas`
                          : session?.user.email ||
                            "Inicia sesión o selecciona un jugador en el Ranking para inspeccionar su ficha completa."}
                      </p>

                      <div className="xp-track" title={`Progreso al Nivel ${vantsLevel + 1}: ${xpProgressPct}%`}>
                        <div className="xp-fill" style={{ width: `${Math.max(8, xpProgressPct)}%` }} />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid-cards">
                  <article className="card">
                    <div className="card-accent-top" style={{ background: "var(--orange)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 className="card-title">COUNTER-STRIKE 2 · FACEIT</h3>
                      <span className={`tag ${perfilActivo?.faceit ? "ok" : ""}`}>
                        {perfilActivo?.faceit ? "VERIFICADO" : "PENDIENTE"}
                      </span>
                    </div>
                    {perfilActivo?.faceit ? (
                      <>
                        <p className="card-meta">
                          Nick oficial: <strong style={{ color: "var(--text)" }}>{perfilActivo.faceit.nick}</strong>
                        </p>
                        <div className="stat-mini-grid">
                          <div className="stat-mini-box">
                            <span>NIVEL</span>
                            <strong>{perfilActivo.faceit.nivel ?? "—"}</strong>
                          </div>
                          <div className="stat-mini-box">
                            <span>ELO</span>
                            <strong>{perfilActivo.faceit.elo ?? "—"}</strong>
                          </div>
                          <div className="stat-mini-box">
                            <span>WIN / K·D</span>
                            <strong>
                              {perfilActivo.faceit.winrate != null ? `${perfilActivo.faceit.winrate}%` : "—"} /{" "}
                              {perfilActivo.faceit.kd ?? "—"}
                            </strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="card-meta">Cuenta de FACEIT CS2 aún no vinculada en esta ficha.</p>
                    )}
                  </article>

                  <article className="card">
                    <div className="card-accent-top" style={{ background: "#ff4655" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 className="card-title">VALORANT · RIOT ID</h3>
                      <span className={`tag ${perfilActivo?.valorant?.riot ? "ok" : ""}`}>
                        {perfilActivo?.valorant?.riot ? "VERIFICADO" : "PENDIENTE"}
                      </span>
                    </div>
                    {perfilActivo?.valorant?.riot ? (
                      <>
                        <p className="card-meta">
                          Riot ID: <strong style={{ color: "var(--text)" }}>{perfilActivo.valorant.riot}</strong>
                        </p>
                        <div className="stat-mini-grid">
                          <div className="stat-mini-box">
                            <span>RANGO</span>
                            <strong>{perfilActivo.valorant.tier || "Unranked"}</strong>
                          </div>
                          <div className="stat-mini-box">
                            <span>PUNTOS RR</span>
                            <strong>{perfilActivo.valorant.rr ?? 0} RR</strong>
                          </div>
                          <div className="stat-mini-box">
                            <span>PICO</span>
                            <strong>{perfilActivo.valorant.pico || "—"}</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="card-meta">Riot ID de VALORANT aún no vinculado en esta ficha.</p>
                    )}
                  </article>

                  <article className="card">
                    <div className="card-accent-top" style={{ background: "var(--cyan)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 className="card-title">FORTNITE · EPIC GAMES</h3>
                      <span className={`tag ${perfilActivo?.fortnite?.nombre ? "ok" : ""}`}>
                        {perfilActivo?.fortnite?.nombre ? "VERIFICADO" : "PENDIENTE"}
                      </span>
                    </div>
                    {perfilActivo?.fortnite?.nombre ? (
                      <>
                        <p className="card-meta">
                          Epic ID: <strong style={{ color: "var(--text)" }}>{perfilActivo.fortnite.nombre}</strong>
                        </p>
                        <div className="stat-mini-grid">
                          <div className="stat-mini-box">
                            <span>VICTORIAS</span>
                            <strong>{perfilActivo.fortnite.stats?.victorias ?? 0}</strong>
                          </div>
                          <div className="stat-mini-box">
                            <span>K / D</span>
                            <strong>{perfilActivo.fortnite.stats?.kd ?? "—"}</strong>
                          </div>
                          <div className="stat-mini-box">
                            <span>PARTIDAS</span>
                            <strong>{perfilActivo.fortnite.stats?.partidas ?? "—"}</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="card-meta">Cuenta de Epic Games aún no vinculada en esta ficha.</p>
                    )}
                  </article>
                </div>

                <div className="section-head">
                  <div className="section-head-titles">
                    <div className="eyebrow">COLECCIÓN OFICIAL</div>
                    <h2>VITRINA DE INSIGNIAS VANTS ({misInsignias.length} DESBLOQUEADAS)</h2>
                  </div>
                  <div className="carbon-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={badgeFilter === "todas"}
                      className={`carbon-tab ${badgeFilter === "todas" ? "active" : ""}`}
                      onClick={() => setBadgeFilter("todas")}
                    >
                      CATÁLOGO ({catalogBadges.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={badgeFilter === "mias"}
                      className={`carbon-tab ${badgeFilter === "mias" ? "active" : ""}`}
                      onClick={() => setBadgeFilter("mias")}
                    >
                      DESBLOQUEADAS ({misInsignias.length})
                    </button>
                  </div>
                </div>

                <div className="badge-grid">
                  {visibleBadges.map((b) => {
                    const unlocked = misInsignias.includes(b.code);
                    return (
                      <div key={b.code} className={`badge-card ${unlocked ? "unlocked" : ""}`}>
                        <BadgeEmblem forma={b.forma} color={b.color} code={b.code} unlocked={unlocked} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                            <strong
                              style={{
                                fontFamily: "var(--f-display)",
                                fontSize: 16,
                                letterSpacing: "0.03em",
                                textTransform: "uppercase",
                              }}
                            >
                              {b.nombre}
                            </strong>
                            <span className="tag" style={{ color: unlocked ? b.color : "var(--muted)" }}>
                              {b.rareza.toUpperCase()}
                            </span>
                          </div>
                          <p className="card-meta" style={{ fontSize: 11.5, margin: "4px 0 6px" }}>
                            {b.descripcion}
                          </p>
                          <div
                            className="mono"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: unlocked ? "var(--green)" : "var(--muted-2)",
                            }}
                          >
                            {unlocked ? "✓ DESBLOQUEADA" : `REQUISITO: ${b.requisito.toUpperCase()}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ==================== PLANES & MEMBRESÍAS ==================== */}
            {tab === "planes" && (
              <>
                <div className="section-head">
                  <div className="section-head-titles">
                    <div className="eyebrow">SUSCRIPCIONES Y TEMPORADA</div>
                    <h1>MEMBRESÍAS OFICIALES Y PASE S4 VANTS</h1>
                    <p>
                      Potencia tu cuenta competitiva con sellos exclusivos, torneos sin comisión y herramientas para
                      creadores.
                    </p>
                  </div>
                  <button type="button" className="btn primary" onClick={() => openInApp("https://vants.cc/membresias")}>
                    <IconCrown size={15} />
                    <span>GESTIONAR MEMBRESÍA</span>
                  </button>
                </div>

                <div className="plans-grid">
                  {PLANES_VANTS.map((plan) => (
                    <article
                      key={plan.id}
                      className="card"
                      style={plan.destacado ? { borderColor: "var(--red)" } : undefined}
                    >
                      <div className="card-accent-top" style={{ background: plan.color }} />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <h2 className="card-title" style={{ fontSize: 22 }}>
                          {plan.nombre}
                        </h2>
                        <span className={`tag ${plan.destacado ? "red" : ""}`}>{plan.badge}</span>
                      </div>

                      <ul className="plan-list">
                        {plan.beneficios.map((b) => (
                          <li key={b}>
                            <IconCheck size={14} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="card-actions">
                        <button
                          type="button"
                          className={`btn ${plan.destacado ? "primary" : ""}`}
                          style={{ width: "100%" }}
                          onClick={() => openInApp("https://vants.cc/membresias")}
                        >
                          <span>ACTIVAR {plan.nombre}</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* ==================== VANTS SHIELD (PC) ==================== */}
            {tab === "shield" && isPc && (
              <>
                <div className="section-head">
                  <div className="section-head-titles">
                    <div className="eyebrow">INTEGRIDAD COMPETITIVA EN MODO USUARIO</div>
                    <h1>CONSOLA DE VERIFICACIÓN VANTS SHIELD</h1>
                  </div>
                  <button type="button" className="btn primary" onClick={() => void runShield()} disabled={checkingShield}>
                    <IconRefresh size={14} />
                    <span>{checkingShield ? "ANALIZANDO ENTORNO…" : "EJECUTAR ANÁLISIS"}</span>
                  </button>
                </div>

                <section className="carbon-hero">
                  <div className="carbon-hero-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                    <div style={{ maxWidth: 620 }}>
                      <div className="eyebrow">DIAGNÓSTICO DE TORNEO · SIN DRIVERS DE KERNEL</div>
                      <h2
                        style={{
                          margin: "0 0 8px",
                          fontFamily: "var(--f-display)",
                          fontSize: 34,
                          lineHeight: 0.96,
                          textTransform: "uppercase",
                          color: shieldReport?.status === "flagged" ? "var(--red)" : "var(--green)",
                        }}
                      >
                        {!shieldReport
                          ? "PENDIENTE DE VERIFICACIÓN"
                          : shieldReport.status === "clean"
                            ? "ENTORNO LIMPIO · APTO PARA COMPETIR"
                            : "ALERTA · CIERRA LAS HERRAMIENTAS DETECTADAS"}
                      </h2>
                      <p style={{ margin: "0 0 16px", color: "var(--text-2)" }}>
                        Inspección ligera de sesión compatible con Microsoft Store y Windows 10/11 sin requerir permisos
                        de administrador. Comparte tu código SHA-256 con el árbitro del torneo.
                      </p>
                      {shieldReport && (
                        <button type="button" className="btn primary" onClick={() => void copyShieldProof()}>
                          <IconCopy size={15} />
                          <span>COPIAR COMPROBANTE ({shieldReport.code})</span>
                        </button>
                      )}
                    </div>
                    <img
                      src="./img/ui/shield-crest.jpg"
                      alt="VANTS Shield"
                      style={{ width: 150, height: 150, objectFit: "cover", mixBlendMode: "lighten" }}
                    />
                  </div>
                </section>

                {shieldReport && (
                  <div className="grid-cards">
                    <article className="card">
                      <div className="card-accent-top" style={{ background: "var(--green)" }} />
                      <h3 className="card-title">FIRMA SHA-256 DE SESIÓN</h3>
                      <div
                        className="mono"
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: "var(--carbon-0)",
                          border: "1px solid var(--line)",
                          fontSize: 13,
                          color: "var(--text)",
                        }}
                      >
                        {shieldReport.code}
                      </div>
                      <p className="card-meta mono">
                        {new Date(shieldReport.checkedAt).toLocaleString("es-ES")} · VANTS PC v{shieldReport.appVersion}
                      </p>
                    </article>

                    <article className="card">
                      <div className="card-accent-top" style={{ background: "var(--cyan)" }} />
                      <h3 className="card-title">ANTI-CHEATS OFICIALES ACTIVOS</h3>
                      {shieldReport.activeAntiCheats.length ? (
                        <div className="btn-row">
                          {shieldReport.activeAntiCheats.map((ac) => (
                            <span key={ac.id} className="tag ok">
                              ✓ {ac.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="card-meta">
                          Ningún anti-cheat externo en ejecución ahora (Riot Vanguard, FACEIT AC o Easy Anti-Cheat se
                          detectan automáticamente al abrir el juego).
                        </p>
                      )}
                    </article>

                    <article className="card">
                      <div
                        className="card-accent-top"
                        style={{ background: shieldReport.flaggedTools.length === 0 ? "var(--green)" : "var(--red)" }}
                      />
                      <h3 className="card-title">PROCESOS AUDITADOS ({shieldReport.processCount})</h3>
                      {shieldReport.flaggedTools.length === 0 ? (
                        <p className="card-meta" style={{ color: "var(--green)" }}>
                          ✓ Cero debuggers, inyectores DLL o editores de memoria activos en tu sesión.
                        </p>
                      ) : (
                        shieldReport.flaggedTools.map((f) => (
                          <p key={f.process} className="card-meta" style={{ color: "var(--red)" }}>
                            ⚠ {f.label} ({f.process}) — ciérralo y ejecuta nuevamente el análisis.
                          </p>
                        ))
                      )}
                    </article>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── Navegación Inferior Nativa Android ── */}
      <nav className="vants-bottom-nav" aria-label="Navegación inferior móvil">
        {mobileBottomNav.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`bottom-btn ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
