import type { BanterPlatform } from "./platform.ts";
import type { BanterPlanId } from "./subscriptions.ts";

export interface BanterRegistrationPayload {
  kind: "usuario_registro";
  handle: string;
  email: string;
  platform: BanterPlatform;
  planId: BanterPlanId;
  country: string;
  notes?: string;
}

export interface BanterRequestPayload {
  kind: "solicitud_banter";
  requester: string;
  email: string;
  requestType:
    | "Acceso Beta"
    | "Verificación Creador"
    | "Soporte Técnico"
    | "Alianza / Patrocinio"
    | "Solicitud NitroPay/Ads"
    | "Reembolso / Facturación";
  platform: BanterPlatform;
  priority: "Alta" | "Media" | "Baja";
  summary: string;
}

export type BanterSheetWebhookPayload = BanterRegistrationPayload | BanterRequestPayload;

export function validateRegistrationPayload(p: BanterRegistrationPayload): string | null {
  if (!p.handle || p.handle.trim().length < 2) return "Escribe un nombre o handle válido (mín. 2 caracteres).";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email.trim())) return "Escribe un correo electrónico válido.";
  return null;
}

export function validateRequestPayload(p: BanterRequestPayload): string | null {
  if (!p.requester || p.requester.trim().length < 2) return "Indica tu nombre o marca.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email.trim())) return "Escribe un correo electrónico válido.";
  if (!p.summary || p.summary.trim().length < 8) return "Describe tu solicitud con al menos 8 caracteres.";
  return null;
}

export const DEFAULT_BANTER_MOTOR_URL = "https://bot.vants.cc";

/**
 * Envía el registro o solicitud al motor Cloudflare `vantsbot` (que guarda en D1,
 * dispara VANTS-BUS -> Discord y sincroniza con Google Sheets) o directamente
 * al Web App de Google Apps Script si se pasa una URL de script.google.com.
 */
export async function submitToBanterGoogleSheet(
  endpointUrl: string,
  payload: BanterSheetWebhookPayload,
): Promise<{ ok: boolean; mode: "remote" | "local_preview"; id: string }> {
  const id = (payload.kind === "usuario_registro" ? "BNT-" : "SOL-") + Date.now().toString(36).toUpperCase();
  const cleanUrl = String(endpointUrl || "").trim().replace(/\/$/, "");
  if (!cleanUrl) {
    return { ok: true, mode: "local_preview", id };
  }

  const isAppsScript = /script\.google\.com/i.test(cleanUrl);
  const targetUrl = isAppsScript
    ? cleanUrl
    : cleanUrl + (payload.kind === "usuario_registro" ? "/banter/registro" : "/banter/solicitud");

  const res = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": isAppsScript ? "text/plain;charset=utf-8" : "application/json" },
    body: JSON.stringify({ ...payload, clientId: id }),
  });

  if (!res.ok) {
    throw new Error(`No se pudo registrar en el motor Banter (HTTP ${res.status}).`);
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
  if (data.ok === false) {
    throw new Error(data.error || "El servidor rechazó el envío.");
  }
  return { ok: true, mode: "remote", id: data.id || id };
}
