// apps/desktop/shieldHeartbeat.js
// Puente firmado (HMAC-SHA256) entre el detector oficial de Riot Vanguard / FACEIT AC
// de VANTS PC y VANTS Sentinel AI (https://int.vants.cc/ai/anticheat/*).
const crypto = require('node:crypto');
const os = require('node:os');

const OFFICIAL_ANTICHEATS = [
  { id: 'vanguard', name: 'Riot Vanguard', procs: ['vgtray.exe', 'vgc.exe'], services: ['vgc', 'vgk'] },
  { id: 'faceit', name: 'FACEIT Anti-Cheat', procs: ['faceitclient.exe', 'faceitservice.exe'], services: ['FACEITService', 'faceit'] },
  { id: 'eac', name: 'Easy Anti-Cheat', procs: ['easyanticheat.exe', 'easyanticheat_eos.exe'], services: ['EasyAntiCheat', 'EasyAntiCheat_EOS'] },
  { id: 'battleye', name: 'BattlEye', procs: ['beservice.exe'], services: ['BEService'] },
];

const FLAGGED_TOOLS = [
  { label: 'Cheat Engine', match: /^cheatengine/i, hardFlag: 'blacklisted_cheat_process' },
  { label: 'x64dbg / x32dbg', match: /^x(64|32)dbg\.exe$/i, hardFlag: 'blacklisted_cheat_process' },
  { label: 'OllyDbg', match: /^ollydbg\.exe$/i, hardFlag: 'blacklisted_cheat_process' },
  { label: 'Process Hacker / System Informer', match: /^(processhacker|systeminformer)\.exe$/i, hardFlag: 'blacklisted_cheat_process' },
  { label: 'DLL Injector', match: /(extreme.?injector|gh_injector|process.?injector)/i, hardFlag: 'unsigned_dll_injection' },
  { label: 'ArtMoney / WeMod', match: /^(artmoney|wemod)/i, hardFlag: 'blacklisted_cheat_process' },
];

const HEARTBEAT_INTERVAL_MS = 30_000;

function canonicalHeartbeatMessage({
  nonce,
  userSub,
  ts,
  hwid = '',
  vanguardOn = false,
  faceitAcOn = false,
  hardFlags = [],
}) {
  const flags = Array.isArray(hardFlags)
    ? [...new Set(hardFlags.map((f) => String(f).trim().toLowerCase()).filter(Boolean))].sort().join(',')
    : '';
  return `${String(nonce || '')}.${String(userSub || '')}.${String(ts || '')}.${String(hwid || '')}.${vanguardOn ? 1 : 0}.${faceitAcOn ? 1 : 0}.${flags}`;
}

function signHeartbeatHmac(secret, message) {
  return crypto.createHmac('sha256', String(secret)).update(String(message)).digest('hex');
}

function buildMachineHwid() {
  const cpu = (os.cpus() && os.cpus()[0] && os.cpus()[0].model) || '';
  const user = (() => {
    try {
      return os.userInfo().username || '';
    } catch {
      return '';
    }
  })();
  return crypto
    .createHash('sha256')
    .update(`vants-pc-hwid|${os.hostname()}|${os.platform()}|${os.arch()}|${cpu}|${user}`)
    .digest('hex')
    .slice(0, 48);
}

/**
 * Envía un ciclo completo de Challenge (60s nonce) + Heartbeat firmado HMAC-SHA256
 * a `vants-integraciones` (/ai/anticheat/challenge y /ai/anticheat/heartbeat).
 */
async function sendSignedAcHeartbeat({
  accessToken,
  acSecret,
  shieldReport,
  apiOrigin = 'https://int.vants.cc',
  torneoId = null,
  nick = null,
  hwid = buildMachineHwid(),
  fetchImpl = globalThis.fetch,
}) {
  if (!accessToken) return { ok: false, error: 'sin_sesion' };
  if (!acSecret) return { ok: false, error: 'ac_secret_no_configurado' };

  const base = String(apiOrigin || 'https://int.vants.cc').replace(/\/+$/, '');

  // 1) Obtener nonce único (60s TTL) atado al user_sub autenticado
  const chRes = await fetchImpl(`${base}/ai/anticheat/challenge`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });
  const chData = await chRes.json().catch(() => null);
  if (!chRes.ok || !chData || !chData.ok || !chData.nonce || !chData.user_sub) {
    return { ok: false, status: chRes.status, error: (chData && chData.error) || 'challenge_fallido' };
  }

  const activeIds = new Set((shieldReport?.activeAntiCheats || []).map((a) => String(a.id || '').toLowerCase()));
  const vanguardOn = activeIds.has('vanguard');
  const faceitAcOn = activeIds.has('faceit');
  const eacOn = activeIds.has('eac');
  const battleyeOn = activeIds.has('battleye');
  const hardFlags = [...new Set((shieldReport?.flaggedTools || []).map((t) => t.hardFlag).filter(Boolean))];
  const ts = String(Date.now());

  const canonical = canonicalHeartbeatMessage({
    nonce: chData.nonce,
    userSub: chData.user_sub,
    ts,
    hwid,
    vanguardOn,
    faceitAcOn,
    hardFlags,
  });
  const signature = signHeartbeatHmac(acSecret, canonical);

  // 2) Enviar heartbeat firmado
  const hbRes = await fetchImpl(`${base}/ai/anticheat/heartbeat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Vants-AC-Signature': signature,
    },
    body: JSON.stringify({
      nonce: chData.nonce,
      ts,
      hwid,
      app_version: shieldReport?.appVersion || '1.0.0',
      vanguard_on: vanguardOn,
      faceit_ac_on: faceitAcOn,
      eac_on: eacOn,
      battleye_on: battleyeOn,
      hard_flags: hardFlags,
      torneo_id: torneoId || undefined,
      nick: nick || undefined,
      signature,
    }),
    signal: AbortSignal.timeout(8000),
  });
  const hbData = await hbRes.json().catch(() => null);
  if (!hbRes.ok || !hbData || !hbData.ok) {
    return {
      ok: false,
      status: hbRes.status,
      bloqueado: Boolean(hbData && hbData.bloqueado),
      error: (hbData && hbData.error) || 'heartbeat_fallido',
    };
  }

  return {
    ok: true,
    ttl: hbData.ttl || 60,
    ac: hbData.ac,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  OFFICIAL_ANTICHEATS,
  FLAGGED_TOOLS,
  HEARTBEAT_INTERVAL_MS,
  canonicalHeartbeatMessage,
  signHeartbeatHmac,
  buildMachineHwid,
  sendSignedAcHeartbeat,
};
