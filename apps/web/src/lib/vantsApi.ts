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
