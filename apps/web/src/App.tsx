import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeEmblem,
  IconBroadcast,
  IconCheck,
  IconCopy,
  IconCrosshair,
  IconCrown,
  IconExternal,
  IconFilm,
  IconFolder,
  IconHome,
  IconLogout,
  IconMail,
  IconPlay,
  IconRefresh,
  IconSearch,
  IconShield,
  IconTrophy,
  IconUser,
  IconUsers,
  IconWinClose,
  IconWinMax,
  IconWinMin,
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
    subtitle: "PC · Escuadras tácticas y customs privadas VANTS",
    accent: "#dce2ec",
    category: "royale",
    platformLabel: "PC · BATTLE.NET",
    webFallback: "https://vants.cc/torneos?juego=warzone",
    cover: "./img/juegos/warzone.jpg",
  },
  {
    id: "fc27",
    name: "EA SPORTS FC 27",
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
  group: "operaciones" | "transmision" | "sistema";
  label: string;
  shortLabel: string;
  icon: ReactNode;
  badge?: string;
  badgeTone?: "live" | "clean" | "default";
}

export function App() {
  const desktop = useMemo(() => getDesktopBridge(), []);
  const isPc = Boolean(desktop);

  const [tab, setTab] = useState<TabId>("inicio");
  const [maximized, setMaximized] = useState(false);
  const [appVersion, setAppVersion] = useState("1.2.5");
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [directos, setDirectos] = useState<DirectoItem[]>([]);
  const [jugadores, setJugadores] = useState<JugadorItem[]>([]);
  const [equipos, setEquipos] = useState<EquipoFaceitItem[]>([]);
  const [clipsComunidad, setClipsComunidad] = useState<ClipComunidadItem[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Exclusivo PC: clips locales en disco y VANTS Shield
  const [localClips, setLocalClips] = useState<LocalClipItem[]>([]);
  const [localFolders, setLocalFolders] = useState<string[]>([]);
  const [scanningClips, setScanningClips] = useState(false);
  const [shieldReport, setShieldReport] = useState<ShieldReport | null>(null);
  const [checkingShield, setCheckingShield] = useState(false);

  // Filtros interactivos de interfaz Carbon
  const [quickQuery, setQuickQuery] = useState("");
  const [gameCat, setGameCat] = useState<GameCategory>("todos");
  const [searchRank, setSearchRank] = useState("");
  const [rankView, setRankView] = useState<"jugadores" | "equipos">("jugadores");
  const [clipFilter, setClipFilter] = useState("todos");
  const [streamFilter, setStreamFilter] = useState<"todos" | "vivo" | "twitch" | "kick">("todos");
  const [badgeFilter, setBadgeFilter] = useState<"todas" | "mias">("todas");

  // Sesión VANTS Identity, perfil del jugador, banner e insignias
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
      showToast(`Bienvenido a VANTS Carbon, ${r.session.user.name}`);
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
        if (u.state === "downloading") setUpdateMsg(`DESCARGANDO v${u.version || ""} (${u.percent ?? 0}%)`);
        else if (u.state === "downloaded") setUpdateMsg(`INSTALAR v${u.version || ""}`);
        else if (u.state === "available") setUpdateMsg(`NUEVA v${u.version || ""}`);
      });
      return () => {
        offWin?.();
        offUpd?.();
      };
    }
    return undefined;
  }, [desktop]);

  const vivos = useMemo(() => directos.filter((d) => d.en_vivo), [directos]);

  const activeGames = isPc ? PC_GAMES : MOBILE_GAMES;

  const filteredGames = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    return activeGames.filter((g) => {
      if (gameCat !== "todos" && g.category !== gameCat) return false;
      if (q && !g.name.toLowerCase().includes(q) && !g.subtitle.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeGames, gameCat, quickQuery]);

  const filteredJugadores = useMemo(() => {
    const q = (searchRank || quickQuery).trim().toLowerCase();
    if (!q) return jugadores.slice(0, 50);
    return jugadores.filter((j) => j.nick.toLowerCase().includes(q)).slice(0, 50);
  }, [jugadores, searchRank, quickQuery]);

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

  const handleQuickSearchEnter = (val: string) => {
    const q = val.trim().toLowerCase();
    if (!q) return;
    if (activeGames.some((g) => g.name.toLowerCase().includes(q))) {
      setTab("juegos");
      return;
    }
    setSearchRank(val.trim());
    setRankView("jugadores");
    setTab("ranking");
  };

  const handleLaunchGame = async (game: GameEntry) => {
    if (!desktop) {
      openInApp(game.webFallback);
      return;
    }
    const res = await desktop.launchGame(game.id);
    if (res.ok) {
      showToast(`Iniciando ${game.name}…`);
    } else {
      showToast(`${game.platformLabel} no detectado · Abriendo hub de torneos.`);
      openInApp(game.webFallback);
    }
  };

  const navItems: NavItem[] = [
    { id: "inicio", group: "operaciones", label: "Centro de Mando", shortLabel: "Inicio", icon: <IconHome size={17} /> },
    {
      id: "juegos",
      group: "operaciones",
      label: isPc ? "Lanzador & Torneos" : "Juegos & Torneos",
      shortLabel: isPc ? "Lanzador" : "Torneos",
      icon: <IconCrosshair size={17} />,
      badge: String(activeGames.length),
    },
    {
      id: "ranking",
      group: "operaciones",
      label: "Ranking & Equipos",
      shortLabel: "Ranking",
      icon: <IconTrophy size={17} />,
    },
    {
      id: "directos",
      group: "transmision",
      label: "Directos En Vivo",
      shortLabel: "En Vivo",
      icon: <IconBroadcast size={17} />,
      badge: vivos.length ? String(vivos.length) : undefined,
      badgeTone: vivos.length ? "live" : "default",
    },
    {
      id: "clips",
      group: "transmision",
      label: isPc ? "Clips PC & Comunidad" : "Clips Comunidad",
      shortLabel: "Clips",
      icon: <IconFilm size={17} />,
      badge: isPc && localClips.length ? String(localClips.length) : undefined,
    },
    {
      id: "perfil",
      group: "sistema",
      label: session ? session.user.name.slice(0, 15) : "Perfil & Insignias",
      shortLabel: session ? "Perfil" : "Entrar",
      icon: <IconUser size={17} />,
      badge: session ? "ON" : undefined,
      badgeTone: session ? "clean" : "default",
    },
    {
      id: "planes",
      group: "sistema",
      label: "Planes & Pase S4",
      shortLabel: "Planes",
      icon: <IconCrown size={17} />,
    },
    ...(isPc
      ? [
          {
            id: "shield" as TabId,
            group: "sistema" as const,
            label: "VANTS Shield",
            shortLabel: "Shield",
            icon: <IconShield size={17} />,
            badge: shieldReport ? (shieldReport.status === "clean" ? "OK" : "!") : undefined,
            badgeTone: (shieldReport?.status === "flagged" ? "live" : "clean") as "live" | "clean",
          },
        ]
      : []),
  ];

  // Barra inferior Android (5 accesos primarios ergonómicos >= 50px)
  const mobileBottomNav: Array<{ id: TabId; label: string; icon: ReactNode }> = [
    { id: "inicio", label: "Inicio", icon: <IconHome size={19} /> },
    { id: "juegos", label: "Torneos", icon: <IconCrosshair size={19} /> },
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
      {/* ── Barra Superior Carbon (Frameless en PC / Safe-Area en Android) ── */}
      <header className="vants-titlebar">
        <div className="vants-titlebar-left">
          <div className="brand-lockup" onClick={() => setTab("inicio")} style={{ cursor: "pointer" }}>
            <img src="./brand/vants-mark.png" alt="VANTS" className="vants-mark" />
            <span className="vants-brand-title">{isPc ? "VANTS PC" : "VANTS MOVIL"}</span>
          </div>
          <span className="vants-brand-sub">CARBON v{appVersion}</span>
          <span className={`status-chip ${offline ? "offline" : ""}`}>
            <span className={`status-dot ${!offline && vivos.length > 0 ? "live" : ""}`} />
            {offline ? "CACHÉ LOCAL" : vivos.length > 0 ? `${vivos.length} EN VIVO` : "EN LÍNEA"}
          </span>

          {updateMsg && (
            <button type="button" className="btn primary sm" onClick={() => void desktop?.installUpdate()}>
              {updateMsg}
            </button>
          )}
        </div>

        {isPc && (
          <div className="titlebar-search">
            <IconSearch size={14} />
            <input
              id="carbon-global-search"
              type="search"
              placeholder="Buscar juego o competidor…"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuickSearchEnter(quickQuery);
              }}
            />
          </div>
        )}

        <div className="vants-titlebar-right">
          {isPc && (
            <button
              type="button"
              className="status-chip hide-mobile"
              style={{
                cursor: "pointer",
                borderColor: shieldReport?.status === "flagged" ? "var(--red)" : "var(--line)",
                color: shieldReport?.status === "clean" ? "var(--green)" : "var(--text-2)",
              }}
              onClick={() => setTab("shield")}
              title="Estado de integridad VANTS Shield"
            >
              <IconShield size={13} />
              <span>{shieldReport?.status === "clean" ? "SHIELD OK" : shieldReport ? "ALERTA" : "SHIELD"}</span>
            </button>
          )}

          <button
            id="carbon-identity-btn"
            type="button"
            className={`identity-trigger ${session ? "" : "guest"}`}
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
                <span>ENTRAR</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="win-btn"
            title="Sincronizar datos en vivo"
            onClick={() => void refreshData()}
          >
            <IconRefresh size={15} />
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

      {/* ── Franja Rápida Complementaria Android (sin duplicar la barra inferior de 5 pestañas) ── */}
      <div className="vants-mobile-strip" aria-label="Accesos rápidos de VANTS Móvil">
        <button
          type="button"
          className={`mobile-chip ${tab === "clips" ? "active" : ""}`}
          onClick={() => setTab("clips")}
        >
          <IconFilm size={15} />
          <span>CLIPS ({clipsComunidad.length})</span>
        </button>
        <button
          type="button"
          className={`mobile-chip ${tab === "planes" ? "active" : ""}`}
          onClick={() => setTab("planes")}
        >
          <IconCrown size={15} />
          <span>PASE S4 &amp; PRO</span>
        </button>
        <button
          type="button"
          className={`mobile-chip ${tab === "ranking" && rankView === "equipos" ? "active" : ""}`}
          onClick={() => {
            setRankView("equipos");
            setTab("ranking");
          }}
        >
          <IconUsers size={15} />
          <span>ESCUADRAS ({equipos.length})</span>
        </button>
        <button type="button" className="mobile-chip" onClick={() => openUrl("https://vants.cc")}>
          <IconExternal size={14} />
          <span>VANTS.CC</span>
        </button>
      </div>

      <div className="vants-body">
        {/* ── Rail Lateral Táctico PC ── */}
        <aside className="vants-rail" aria-label="Navegación principal">
          {(["operaciones", "transmision", "sistema"] as const).map((grp) => {
            const groupTitle =
              grp === "operaciones" ? "OPERACIONES" : grp === "transmision" ? "TRANSMISIÓN" : "CUENTA & SISTEMA";
            return (
              <div key={grp} className="rail-group">
                <div className="rail-group-label">{groupTitle}</div>
                {navItems
                  .filter((n) => n.group === grp)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`nav-btn ${tab === item.id ? "active" : ""}`}
                      onClick={() => setTab(item.id)}
                    >
                      {item.icon}
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
              </div>
            );
          })}

          <div className="rail-footer">
            <div className="rail-player-card" onClick={() => setTab("perfil")}>
              {session?.user.picture || perfilActivo?.avatar ? (
                <img
                  src={perfilActivo?.avatar || session?.user.picture || ""}
                  alt="Avatar"
                  className="rail-player-avatar"
                />
              ) : (
                <div className="rail-player-avatar">
                  {(session?.user.name || "VG").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {session ? session.user.name : "Invitado VANTS"}
                </div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                  {session ? `${misInsignias.length} insignias · NVL ${vantsLevel}` : "Sincronizar perfil →"}
                </div>
              </div>
            </div>

            <button type="button" className="btn sm" onClick={() => openUrl("https://vants.cc")}>
              <span>PORTAL VANTS.CC</span>
              <IconExternal size={13} />
            </button>

            <div className="rail-meta">
              <span>CARBON UI</span>
              <span>v{appVersion}</span>
            </div>
          </div>
        </aside>

        {/* ── Lienzo Central ── */}
        <main className="vants-main">
          <div className="vants-container">
            {/* ==================== INICIO ==================== */}
            {tab === "inicio" && (
              <>
                <section className="carbon-hero">
                  <div
                    className="carbon-hero-art"
                    style={{
                      backgroundImage: `url(${isPc ? "./img/juegos/valorant.jpg" : "./img/juegos/freefire.jpg"})`,
                    }}
                  />
                  <div className="carbon-hero-scrim" />
                  <div className="carbon-hero-inner">
                    <div className="carbon-hero-copy">
                      <div className="eyebrow">
                        {isPc ? "CLIENTE OFICIAL DE ESCRITORIO · CARBON" : "CLIENTE OFICIAL ANDROID · CARBON"}
                      </div>
                      <h1>{isPc ? "CENTRO COMPETITIVO VANTS PC" : "CIRCUITO COMPETITIVO VANTS MÓVIL"}</h1>
                      <p>
                        {isPc
                          ? "Lanzador directo de juegos, verificación limpia de procesos VANTS Shield, detector automático de clips locales y clasificación FACEIT en vivo."
                          : "Torneos móviles y esports en tiempo real, transmisiones de Twitch y Kick, vitrina de insignias 3D y tabla oficial de competidores VANTS."}
                      </p>
                      <div className="btn-row">
                        <button type="button" className="btn primary" onClick={() => setTab("juegos")}>
                          <IconCrosshair size={16} />
                          <span>{isPc ? "ABRIR LANZADOR PC" : "EXPLORAR TORNEOS"}</span>
                        </button>
                        <button type="button" className="btn" onClick={() => setTab("perfil")}>
                          <IconUser size={15} />
                          <span>{session ? "MI PERFIL E INSIGNIAS" : "CONECTAR CUENTA VANTS"}</span>
                        </button>
                        {isPc && (
                          <button type="button" className="btn" onClick={() => setTab("shield")}>
                            <IconShield size={15} />
                            <span>VANTS SHIELD</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Franja de Telemetría Interactiva */}
                <div className="telemetry-strip">
                  <div className={`telemetry-cell ${vivos.length ? "hot" : ""}`} onClick={() => setTab("directos")}>
                    <div className="telemetry-top">
                      <span>EN DIRECTO</span>
                      <IconBroadcast size={14} />
                    </div>
                    <div className="telemetry-val" style={{ color: vivos.length ? "var(--red)" : "var(--text)" }}>
                      {loading ? "—" : vivos.length}
                    </div>
                    <div className="telemetry-sub">Canales Twitch &amp; Kick activos</div>
                  </div>

                  <div className="telemetry-cell" onClick={() => setTab("ranking")}>
                    <div className="telemetry-top">
                      <span>COMPETIDORES</span>
                      <IconTrophy size={14} />
                    </div>
                    <div className="telemetry-val">{loading ? "—" : jugadores.length}</div>
                    <div className="telemetry-sub">Ranking oficial VANTS</div>
                  </div>

                  <div
                    className="telemetry-cell"
                    onClick={() => {
                      setRankView("equipos");
                      setTab("ranking");
                    }}
                  >
                    <div className="telemetry-top">
                      <span>ESCUADRAS</span>
                      <IconUsers size={14} />
                    </div>
                    <div className="telemetry-val">{loading ? "—" : equipos.length}</div>
                    <div className="telemetry-sub">Equipos FACEIT registrados</div>
                  </div>

                  <div className="telemetry-cell" onClick={() => setTab("clips")}>
                    <div className="telemetry-top">
                      <span>{isPc ? "CLIPS LOCALES" : "CLIPS COMUNIDAD"}</span>
                      <IconFilm size={14} />
                    </div>
                    <div className="telemetry-val">{isPc ? localClips.length : clipsComunidad.length}</div>
                    <div className="telemetry-sub">{isPc ? "Detectados en este equipo" : "Destacados del circuito"}</div>
                  </div>
                </div>

                {/* Acceso rápido de juegos */}
                <div className="section-head">
                  <div className="section-head-titles">
                    <div className="eyebrow">{isPc ? "LANZADOR DIRECTO" : "DISCIPLINAS ACTIVAS"}</div>
                    <h2>{isPc ? "JUEGOS COMPETITIVOS EN PC" : "JUEGOS Y LIGAS DESTACADAS"}</h2>
                  </div>
                  <button type="button" className="btn sm" onClick={() => setTab("juegos")}>
                    <span>VER CATÁLOGO ({activeGames.length})</span>
                  </button>
                </div>

                <div className="grid-cards">
                  {activeGames.slice(0, isPc ? 3 : 4).map((g) => (
                    <article key={g.id} className="card game-card">
                      <div className="game-cover-wrap">
                        <img src={g.cover} alt={g.name} className="game-cover-img" loading="lazy" />
                        <div className="game-cover-scrim" />
                        <span className="game-cover-badge">{g.platformLabel}</span>
                      </div>
                      <div className="game-card-body">
                        <div style={{ width: 32, height: 2, background: g.accent }} />
                        <h3 className="card-title">{g.name}</h3>
                        <p className="card-meta">{g.subtitle}</p>
                        <div className="card-actions">
                          <button type="button" className="btn primary sm" onClick={() => void handleLaunchGame(g)}>
                            <IconPlay size={13} />
                            <span>{isPc ? "JUGAR AHORA" : "TORNEOS"}</span>
                          </button>
                          {isPc && (
                            <button
                              type="button"
                              className="btn sm"
                              onClick={() => openInApp(g.webFallback)}
                              title="Abrir brackets de torneos en VANTS"
                            >
                              <span>TORNEOS</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Vista dual inferior: Directos + Top Ranking */}
                <div className="grid-split-home">
                  <div>
                    <div className="section-head">
                      <div className="section-head-titles">
                        <h2>TRANSMISIONES DESTACADAS</h2>
                      </div>
                      <button type="button" className="btn sm" onClick={() => setTab("directos")}>
                        <span>TODOS LOS CANALES</span>
                      </button>
                    </div>
                    <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", marginBottom: 0 }}>
                      {(vivos.length ? vivos : directos).slice(0, 2).map((d) => (
                        <article key={`${d.plataforma}:${d.canal}`} className="card media-card">
                          <div className="media-thumb-wrap">
                            {d.miniatura ? (
                              <img src={d.miniatura} alt={d.nombre} className="media-thumb" loading="lazy" />
                            ) : (
                              <div className="media-thumb-fallback">
                                <IconBroadcast size={26} />
                              </div>
                            )}
                            <div className="media-badge-tl">
                              <span className={`tag ${d.en_vivo ? "red" : ""}`}>
                                {d.en_vivo ? "EN VIVO" : d.plataforma.toUpperCase()}
                              </span>
                            </div>
                            {d.espectadores != null && d.en_vivo && (
                              <span className="media-badge-br">{d.espectadores} VIENDO</span>
                            )}
                          </div>
                          <div className="media-body">
                            <h3 className="card-title" style={{ fontSize: 17 }}>
                              {d.nombre}
                            </h3>
                            <p className="card-meta">
                              {d.plataforma.toUpperCase()} {d.juego ? `· ${d.juego}` : ""}
                            </p>
                            <div className="card-actions">
                              <button type="button" className="btn primary sm" onClick={() => openUrl(d.url)}>
                                <span>VER CANAL</span>
                                <IconExternal size={13} />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="section-head">
                      <div className="section-head-titles">
                        <h2>TOP COMPETIDORES</h2>
                      </div>
                      <button type="button" className="btn sm" onClick={() => setTab("ranking")}>
                        <span>TABLA COMPLETA</span>
                      </button>
                    </div>
                    <div className="rank-list">
                      {jugadores.slice(0, 5).map((j, idx) => (
                        <div
                          key={j.pid}
                          className="rank-row"
                          onClick={() => {
                            void cargarPerfilPorPid(j.pid);
                            setTab("perfil");
                          }}
                        >
                          <div
                            className="rank-pos"
                            style={{ color: idx === 0 ? "var(--gold)" : idx === 1 ? "#dce2ec" : idx === 2 ? "#e08b56" : undefined }}
                          >
                            #{idx + 1}
                          </div>
                          {j.avatar ? (
                            <img src={j.avatar} alt={j.nick} className="rank-avatar" loading="lazy" />
                          ) : (
                            <div className="rank-avatar">{j.nick.slice(0, 2).toUpperCase()}</div>
                          )}
                          <div className="rank-info">
                            <div className="rank-nick">
                              <span>{j.nick}</span>
                              {j.sello && <span className="tag red">{j.sello}</span>}
                            </div>
                            <div className="rank-sub mono">{j.xp} XP</div>
                          </div>
                          <div className="rank-metrics">
                            {j.elo != null ? <span>{j.elo} ELO</span> : <span className="tag">PERFIL</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
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
                            <span>{isPc ? `ABRIR ${g.name}` : "VER TORNEOS"}</span>
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
                          <span className={`tag ${d.en_vivo ? "red" : ""}`}>
                            {d.en_vivo ? "EN VIVO" : "OFFLINE"}
                          </span>
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
                    {/* Podio Top 3 cuando no hay búsqueda activa */}
                    {!searchRank.trim() && !quickQuery.trim() && filteredJugadores.length >= 3 && (
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
                                <img src={j.avatar} alt={j.nick} className="rank-avatar" style={{ width: 46, height: 46 }} />
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
                            <img src={eq.avatar} alt={eq.nombre} className="rank-avatar" style={{ width: 44, height: 44 }} />
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

                {/* Banner Cinematográfico del Jugador */}
                <section className="profile-banner">
                  <div
                    className="profile-banner-bg"
                    style={{
                      backgroundImage: `url(${perfilActivo?.banner || "./img/juegos/valorant.jpg"})`,
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

                {/* Módulos de Cuentas Competitivas Vinculadas */}
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

                {/* Vitrina de Insignias 3D Metálicas */}
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
                    <p>Potencia tu cuenta competitiva con sellos exclusivos, torneos sin comisión y herramientas para creadores.</p>
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
                  <div className="carbon-hero-scrim" />
                  <div className="carbon-hero-inner">
                    <div className="carbon-hero-copy">
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
                      <p>
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

      {/* ── Navegación Inferior Nativa Android (5 Pestañas con Iconos Vectoriales) ── */}
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
