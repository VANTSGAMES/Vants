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

/**
 * Envía el registro o solicitud al Web App de Google Apps Script conectado a la
 * Google Sheet maestra (o devuelve modo local si aún no se configura VITE_SHEETS_WEBHOOK_URL).
 */
export async function submitToBanterGoogleSheet(
  webhookUrl: string,
  payload: BanterSheetWebhookPayload,
): Promise<{ ok: boolean; mode: "remote" | "local_preview"; id: string }> {
  const id = (payload.kind === "usuario_registro" ? "BNT-" : "SOL-") + Date.now().toString(36).toUpperCase();
  const cleanUrl = String(webhookUrl || "").trim();
  if (!cleanUrl) {
    return { ok: true, mode: "local_preview", id };
  }

  const res = await fetch(cleanUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, clientId: id }),
  });

  if (!res.ok) {
    throw new Error(`No se pudo registrar en Google Sheets (HTTP ${res.status}).`);
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
  if (data.ok === false) {
    throw new Error(data.error || "Google Sheets rechazó el envío.");
  }
  return { ok: true, mode: "remote", id: data.id || id };
}
