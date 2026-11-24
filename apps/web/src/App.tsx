import { useEffect, useMemo, useState } from "react";
import {
  fetchClipsComunidad,
  fetchDirectos,
  fetchEquiposFaceit,
  fetchJugadores,
  getDesktopBridge,
  openInApp,
  openUrl,
  type ClipComunidadItem,
  type DirectoItem,
  type EquipoFaceitItem,
  type JugadorItem,
  type LocalClipItem,
  type ShieldReport,
} from "./lib/vantsApi";

type TabId = "inicio" | "juegos" | "clips" | "directos" | "ranking" | "planes" | "shield";

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

interface GameEntry {
  id: string;
  name: string;
  subtitle: string;
  accent: string;
  platformLabel: string;
  webFallback: string;
}

const GAMES: GameEntry[] = [
  {
    id: "valorant",
    name: "VALORANT",
    subtitle: "Riot Client · Competitivo y torneos VANTS",
    accent: "#ff4655",
    platformLabel: "Riot Client",
    webFallback: "https://vants.cc/juegos",
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    subtitle: "Steam · FACEIT CS2 y Ranking VANTS",
    accent: "#f5c044",
    platformLabel: "Steam",
    webFallback: "https://www.faceit.com/es/cs2",
  },
  {
    id: "fortnite",
    name: "Fortnite",
    subtitle: "Epic Games · Battle Royale y Arena",
    accent: "#9d4dff",
    platformLabel: "Epic Games",
    webFallback: "https://vants.cc/juegos",
  },
  {
    id: "lol",
    name: "League of Legends",
    subtitle: "Riot Client · Grieta del Invocador",
    accent: "#4cc9f0",
    platformLabel: "Riot Client",
    webFallback: "https://vants.cc/juegos",
  },
  {
    id: "rocketleague",
    name: "Rocket League",
    subtitle: "Epic Games · Torneos 2v2 / 3v3",
    accent: "#3ddc84",
    platformLabel: "Epic Games",
    webFallback: "https://vants.cc/juegos",
  },
  {
    id: "steam",
    name: "Steam",
    subtitle: "Abrir biblioteca completa de Steam",
    accent: "#66c0f4",
    platformLabel: "Biblioteca PC",
    webFallback: "https://store.steampowered.com",
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

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3200);
  };

  const refreshData = async () => {
    setLoading(true);
    const [d, j, e, c] = await Promise.all([
      fetchDirectos(),
      fetchJugadores(),
      fetchEquiposFaceit(),
      fetchClipsComunidad(),
    ]);
    setDirectos(d.directos);
    setJugadores(j.jugadores);
    setEquipos(e.equipos);
    setClipsComunidad(c.clips);
    setOffline(d.offline && j.offline);
    setLoading(false);
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

  const navItems: Array<{ id: TabId; label: string; icon: string; badge?: string; live?: boolean }> = [
    { id: "inicio", label: "Inicio", icon: "⚡" },
    { id: "juegos", label: isPc ? "Lanzador PC" : "Juegos", icon: "🎮" },
    { id: "clips", label: isPc ? "Clips PC" : "Clips", icon: "🎬", badge: isPc && localClips.length ? String(localClips.length) : undefined },
    { id: "directos", label: "Directos", icon: "🔴", badge: vivos.length ? String(vivos.length) : undefined, live: vivos.length > 0 },
    { id: "ranking", label: "Ranking", icon: "🏆" },
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
                  {GAMES.slice(0, 3).map((g) => (
                    <div key={g.id} className="card">
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
                <h2>{isPc ? "Lanzador Rápido de Juegos (PC)" : "Títulos del Circuito VANTS"}</h2>
              </div>
              <div className="grid-cards">
                {GAMES.map((g) => (
                  <div key={g.id} className="card">
                    <div className="game-accent" style={{ background: g.accent }} />
                    <h3 className="card-title">{g.name}</h3>
                    <p className="card-meta">{g.subtitle}</p>
                    <div className="btn-row">
                      <button type="button" className="btn primary" onClick={() => void handleLaunchGame(g)}>
                        {isPc ? `▶ Abrir ${g.name}` : "Ver circuito ↗"}
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
                  <div key={j.pid} className="rank-row">
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
                        {j.xp} XP
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

      {/* Navegación inferior exclusiva de Móvil */}
      <nav className="vants-bottom-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`bottom-btn ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
