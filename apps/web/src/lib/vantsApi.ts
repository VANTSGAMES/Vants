export const VANTS_INT_ORIGIN = "https://int.vants.cc";

export interface DirectoItem {
  plataforma: "twitch" | "kick" | string;
  canal: string;
  nombre: string;
  en_vivo: boolean;
  titulo: string | null;
  juego: string | null;
  espectadores: number | null;
  miniatura: string | null;
  url: string;
  desde: string | null;
}

export interface JugadorItem {
  pid: string;
  nick: string;
  avatar: string | null;
  fundador: boolean;
  xp: number;
  sello: string | null;
  nivel: number | null;
  elo: number | null;
}

export interface EquipoFaceitItem {
  id: string;
  nombre: string;
  tag: string | null;
  avatar: string | null;
  url: string;
  jugadores?: Array<{ id: string; nickname: string; nivel: number | null; elo: number | null }>;
}

export interface ClipComunidadItem {
  id: string;
  plataforma: string;
  url: string;
  titulo: string;
  juego: string;
  miniatura: string | null;
  autor: string | null;
  creado: string | null;
}

export interface LocalClipItem {
  name: string;
  game: string;
  path: string;
  sizeMb: number;
  mtimeMs: number;
}

export interface ShieldReport {
  status: "clean" | "flagged";
  code: string;
  checkedAt: string;
  appVersion: string;
  packaged: boolean;
  platform: string;
  processCount: number;
  activeAntiCheats: Array<{ id: string; name: string }>;
  flaggedTools: Array<{ label: string; process: string }>;
}

export interface VantsDesktopBridge {
  platform: string;
  minimize: () => Promise<{ ok: boolean }>;
  toggleMaximize: () => Promise<{ maximized: boolean }>;
  close: () => Promise<{ ok: boolean }>;
  isMaximized: () => Promise<{ maximized: boolean }>;
  onWindowState?: (listener: (state: { maximized: boolean }) => void) => () => void;
  launchGame: (gameId: string) => Promise<{ ok: boolean; error?: string }>;
  openExternal: (url: string) => Promise<{ ok: boolean; error?: string }>;
  openInAppModal?: (url: string) => Promise<{ ok: boolean; error?: string }>;
  scanCortexClips: () => Promise<{ folders: string[]; clips: LocalClipItem[] }>;
  openClipFile: (filePath: string) => Promise<{ ok: boolean; error?: string }>;
  revealClipFolder: (filePath: string) => Promise<{ ok: boolean; error?: string }>;
  runShieldCheck: () => Promise<ShieldReport>;
  getAppVersion: () => Promise<{ version: string; packaged: boolean }>;
  checkForUpdates: () => Promise<{ supported: boolean; currentVersion?: string; latestVersion?: string | null; error?: string }>;
  installUpdate: () => Promise<{ ok: boolean }>;
  onUpdateStatus?: (listener: (payload: { state: string; version?: string; percent?: number; message?: string }) => void) => () => void;
}

declare global {
  interface Window {
    vantsDesktop?: VantsDesktopBridge;
  }
}

export function getDesktopBridge(): VantsDesktopBridge | null {
  return typeof window !== "undefined" && window.vantsDesktop ? window.vantsDesktop : null;
}

export function openUrl(url: string): void {
  const bridge = getDesktopBridge();
  if (bridge && bridge.openExternal) {
    void bridge.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openInApp(url: string): void {
  const bridge = getDesktopBridge();
  if (bridge && bridge.openInAppModal) {
    void bridge.openInAppModal(url);
    return;
  }
  window.location.href = url;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem("vants_app_cache_" + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T };
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem("vants_app_cache_" + key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // ignorar cuota llena
  }
}

async function fetchJsonCached<T>(cacheKey: string, path: string, fallback: T): Promise<{ data: T; fromCache: boolean }> {
  try {
    const res = await fetch(VANTS_INT_ORIGIN + path, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("http_" + res.status);
    const data = (await res.json()) as T;
    writeCache(cacheKey, data);
    return { data, fromCache: false };
  } catch {
    const cached = readCache<T>(cacheKey);
    return { data: cached ?? fallback, fromCache: true };
  }
}

export async function fetchDirectos(): Promise<{ directos: DirectoItem[]; offline: boolean }> {
  const { data, fromCache } = await fetchJsonCached<{ ok?: boolean; directos?: DirectoItem[] }>(
    "directos",
    "/directos",
    { directos: [] },
  );
  return { directos: Array.isArray(data.directos) ? data.directos : [], offline: fromCache };
}

export async function fetchJugadores(): Promise<{ jugadores: JugadorItem[]; offline: boolean }> {
  const { data, fromCache } = await fetchJsonCached<{ ok?: boolean; jugadores?: JugadorItem[] }>(
    "jugadores",
    "/jugadores",
    { jugadores: [] },
  );
  return { jugadores: Array.isArray(data.jugadores) ? data.jugadores : [], offline: fromCache };
}

export async function fetchEquiposFaceit(): Promise<{ equipos: EquipoFaceitItem[]; offline: boolean }> {
  const { data, fromCache } = await fetchJsonCached<{ ok?: boolean; equipos?: EquipoFaceitItem[] }>(
    "equipos",
    "/equipos-faceit",
    { equipos: [] },
  );
  return { equipos: Array.isArray(data.equipos) ? data.equipos : [], offline: fromCache };
}

export async function fetchClipsComunidad(): Promise<{ clips: ClipComunidadItem[]; offline: boolean }> {
  const { data, fromCache } = await fetchJsonCached<{ ok?: boolean; clips?: ClipComunidadItem[] }>(
    "clips",
    "/clips/comunidad",
    { clips: [] },
  );
  return { clips: Array.isArray(data.clips) ? data.clips : [], offline: fromCache };
}

export interface InsigniaCatalogItem {
  code: string;
  nombre: string;
  categoria: string;
  rareza: "common" | "rare" | "epic" | "legendary" | "mythic" | string;
  color: string;
  forma: string;
  icono: string;
  descripcion: string;
  requisito: string;
  titulares?: number;
}

export interface PerfilPublicoData {
  pid: string;
  nick: string;
  avatar: string | null;
  fundador: boolean;
  xp: number;
  desde: string | null;
  banner: string | null;
  sello: string | null;
  insignias: string[];
  faceit: {
    nick: string;
    nivel: number | null;
    elo: number | null;
    partidas: number | null;
    winrate: number | null;
    kd: number | null;
    url: string;
  } | null;
  valorant: {
    riot: string | null;
    tier: string | null;
    rr: number | null;
    icono: string | null;
    pico: string | null;
  } | null;
  fortnite: {
    nombre: string | null;
    stats?: { victorias: number | null; kd: number | null; partidas: number | null } | null;
  } | null;
  logros: { faceit: number; valorant: number; total: number };
}

export interface AuthSession {
  token: string;
  user: {
    sub: string;
    email: string | null;
    name: string;
    picture: string | null;
  };
}

const SESSION_KEY = "vants_app_session_v1";

export function getSavedSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(sess: AuthSession | null): void {
  try {
    if (!sess) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  } catch {
    // ignorar
  }
}

export async function startEmailOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(VANTS_INT_ORIGIN + "/auth/email/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    return { ok: Boolean(res.ok && j.ok), error: j.error };
  } catch {
    return { ok: false, error: "red_no_disponible" };
  }
}

export async function verifyEmailOtp(email: string, code: string): Promise<{ ok: boolean; session?: AuthSession; error?: string }> {
  try {
    const res = await fetch(VANTS_INT_ORIGIN + "/auth/email/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      access_token?: string;
      user?: { sub: string; email: string | null; name: string; picture: string | null };
      error?: string;
    };
    if (!res.ok || !j.ok || !j.access_token || !j.user) {
      return { ok: false, error: j.error || "codigo_incorrecto" };
    }
    const session: AuthSession = { token: j.access_token, user: j.user };
    saveSession(session);
    return { ok: true, session };
  } catch {
    return { ok: false, error: "red_no_disponible" };
  }
}

export async function fetchInsignias(): Promise<{ catalogo: InsigniaCatalogItem[]; offline: boolean }> {
  const { data, fromCache } = await fetchJsonCached<{ ok?: boolean; catalogo?: InsigniaCatalogItem[] }>(
    "insignias",
    "/insignias",
    { catalogo: [] },
  );
  return { catalogo: Array.isArray(data.catalogo) ? data.catalogo : [], offline: fromCache };
}

export async function fetchPerfilPublico(pid: string): Promise<PerfilPublicoData | null> {
  if (!pid) return null;
  const { data } = await fetchJsonCached<{ ok?: boolean; perfil?: PerfilPublicoData }>(
    "perfil_" + pid,
    "/u/" + encodeURIComponent(pid),
    {},
  );
  return data.perfil || null;
}

export async function fetchMisInsignias(token: string): Promise<{ pid: string | null; sello: string | null; conseguidas: string[] } | null> {
  try {
    const res = await fetch(VANTS_INT_ORIGIN + "/insignias/mias", {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { ok?: boolean; pid?: string; sello?: string | null; conseguidas?: string[] };
    return j && j.ok ? { pid: j.pid || null, sello: j.sello || null, conseguidas: j.conseguidas || ["MEMBER"] } : null;
  } catch {
    return null;
  }
}
