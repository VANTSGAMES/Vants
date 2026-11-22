import { useState, type FormEvent } from "react";
import {
  BANTER_PLANS,
  DEFAULT_BANTER_MOTOR_URL,
  DEFAULT_CUSTOMIZATION,
  detectPlatform,
  platformLabel,
  resolveMonetization,
  sanitizeCustomizationForPlan,
  submitToBanterGoogleSheet,
  validateRegistrationPayload,
  validateRequestPayload,
  type BanterPlanId,
  type BanterPlatform,
  type BanterProfileCustomization,
  type BanterRequestPayload,
} from "@banter/core";
import { AdSlot } from "./components/AdSlot";
import { NitroPersonalizer } from "./components/NitroPersonalizer";
import { resurfacePrivacyConsent } from "./lib/nitropay";

const SHEETS_WEBHOOK_URL = String(
  import.meta.env.VITE_SHEETS_WEBHOOK_URL ||
    import.meta.env.VITE_BANTER_API_URL ||
    DEFAULT_BANTER_MOTOR_URL,
).trim();
const GOOGLE_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1i0t2hRSAO4WT7nKlK3rzgsx4oulmrYmpTqIe6CA5ozU/edit";

export function App() {
  const detected = detectPlatform();
  const [platform, setPlatform] = useState<BanterPlatform>(detected);
  const [planId, setPlanId] = useState<BanterPlanId>("free");
  const [customization, setCustomization] = useState<BanterProfileCustomization>(DEFAULT_CUSTOMIZATION);

  // Registro de usuarios -> Google Sheets / Forms
  const [regHandle, setRegHandle] = useState("FEISS");
  const [regEmail, setRegEmail] = useState("");
  const [regCountry, setRegCountry] = useState("Venezuela");
  const [regNotes, setRegNotes] = useState("");
  const [regStatus, setRegStatus] = useState<string | null>(null);
  const [regBusy, setRegBusy] = useState(false);

  // Control de solicitudes -> Google Sheets / Forms
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqType, setReqType] = useState<BanterRequestPayload["requestType"]>("Solicitud NitroPay/Ads");
  const [reqPriority, setReqPriority] = useState<BanterRequestPayload["priority"]>("Alta");
  const [reqSummary, setReqSummary] = useState("");
  const [reqStatus, setReqStatus] = useState<string | null>(null);
  const [reqBusy, setReqBusy] = useState(false);

  const decision = resolveMonetization(platform, planId);

  const cambiarPlan = (next: BanterPlanId) => {
    setPlanId(next);
    setCustomization((prev) => sanitizeCustomizationForPlan(next, prev));
  };

  const enviarRegistro = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      kind: "usuario_registro" as const,
      handle: regHandle.trim(),
      email: regEmail.trim(),
      platform,
      planId,
      country: regCountry.trim(),
      notes: regNotes.trim(),
    };
    const err = validateRegistrationPayload(payload);
    if (err) return setRegStatus(err);
    setRegBusy(true);
    setRegStatus(null);
    try {
      const res = await submitToBanterGoogleSheet(SHEETS_WEBHOOK_URL, payload);
      setRegStatus(
        res.mode === "remote"
          ? `Registro guardado en Google Sheets (${res.id}).`
          : `Validado (${res.id}). Configura VITE_SHEETS_WEBHOOK_URL con tu Apps Script para escritura directa.`,
      );
      setRegNotes("");
    } catch (ex: any) {
      setRegStatus(ex?.message || "No se pudo guardar el registro.");
    } finally {
      setRegBusy(false);
    }
  };

  const enviarSolicitud = async (e: FormEvent) => {
    e.preventDefault();
    const payload: BanterRequestPayload = {
      kind: "solicitud_banter",
      requester: reqName.trim(),
      email: reqEmail.trim(),
      requestType: reqType,
      platform,
      priority: reqPriority,
      summary: reqSummary.trim(),
    };
    const err = validateRequestPayload(payload);
    if (err) return setReqStatus(err);
    setReqBusy(true);
    setReqStatus(null);
    try {
      const res = await submitToBanterGoogleSheet(SHEETS_WEBHOOK_URL, payload);
      setReqStatus(
        res.mode === "remote"
          ? `Solicitud registrada en Solicitudes_Banter (${res.id}).`
          : `Validada (${res.id}). Despliega google-workspace/setup-banter-forms.gs para conectarla en vivo.`,
      );
      setReqSummary("");
    } catch (ex: any) {
      setReqStatus(ex?.message || "No se pudo enviar la solicitud.");
    } finally {
      setReqBusy(false);
    }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">B</span>
          <div>
            <strong>BANTER</strong>
            <span className="muted small">Escritorio · Android · Web</span>
          </div>
        </div>

        <div className="switcher" role="group" aria-label="Simular plataforma">
          {(["web", "desktop-electron", "android-capacitor"] as BanterPlatform[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`chip ${platform === p ? "chip--active" : ""}`}
              onClick={() => setPlatform(p)}
            >
              {platformLabel(p)}
            </button>
          ))}
        </div>
      </header>

      <main className="main">
        <section className="hero card">
          <span className="eyebrow">Ecosistema Multiplataforma · Monetización Híbrida</span>
          <h1>Banter: Nitro + NitroPay + Google Workspace</h1>
          <p className="muted">
            Núcleo compartido para <strong>Escritorio (Electron)</strong>, <strong>Android (Capacitor)</strong> y <strong>Web</strong>.
            Suscripciones tipo Nitro para personalización y experiencia sin anuncios, combinadas con <strong>NitroPay (Overwolf)</strong> en Web/PC y <strong>Google AdMob</strong> en Android.
          </p>
          <div className="meta-row">
            <span className="pill">Plataforma: {platformLabel(platform)}</span>
            <span className="pill">Red activa: {decision.adProvider}</span>
            <span className="pill">Facturación: {decision.billingChannel}</span>
            <a className="pill pill--link" href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer">
              Abrir Google Sheet Maestra ↗
            </a>
          </div>
        </section>

        <AdSlot
          id="banter-top-display"
          platform={platform}
          planId={planId}
          format="display"
          onUpgradeClick={() => cambiarPlan("nitro")}
        />

        <section className="card">
          <div className="card__head">
            <div>
              <span className="eyebrow">Suscripciones tipo Nitro</span>
              <h2>Modelo híbrido de ingresos</h2>
            </div>
          </div>
          <div className="grid-3">
            {(Object.keys(BANTER_PLANS) as BanterPlanId[]).map((id) => {
              const p = BANTER_PLANS[id];
              const active = planId === id;
              return (
                <article key={id} className={`plan-card ${active ? "plan-card--active" : ""}`}>
                  <div className="plan-card__top">
                    <strong>{p.name}</strong>
                    <span className="price">
                      {p.priceMonthlyUsd === 0 ? "Gratis" : `$${p.priceMonthlyUsd.toFixed(2)}/mes`}
                    </span>
                  </div>
                  <p className="muted small">{p.tagline}</p>
                  <ul className="perks">
                    {p.perks.map((perk) => (
                      <li key={perk}>{perk}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`btn ${active ? "btn--ghost" : "btn--primary"}`}
                    onClick={() => cambiarPlan(id)}
                  >
                    {active ? "Plan activo" : `Activar ${p.name}`}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <NitroPersonalizer
          planId={planId}
          handle={regHandle}
          customization={customization}
          onChange={setCustomization}
        />

        <section className="grid-2">
          <form className="card form" onSubmit={enviarRegistro}>
            <span className="eyebrow">Google Forms + Google Sheets</span>
            <h2>Registro de usuarios Banter</h2>
            <p className="muted small">
              Escribe en la pestaña <code>Usuarios_Registro</code> de la Google Sheet maestra.
            </p>
            <div className="field">
              <label htmlFor="reg-handle">Nombre o Handle</label>
              <input id="reg-handle" className="input" required value={regHandle} onChange={(e) => setRegHandle(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="reg-email">Correo electrónico</label>
              <input id="reg-email" className="input" type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="jugador@vants.cc" />
            </div>
            <div className="field">
              <label htmlFor="reg-country">País</label>
              <input id="reg-country" className="input" value={regCountry} onChange={(e) => setRegCountry(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="reg-notes">Notas / Juegos</label>
              <input id="reg-notes" className="input" value={regNotes} onChange={(e) => setRegNotes(e.target.value)} placeholder="VALORANT, CS2, comunidad..." />
            </div>
            <button type="submit" className="btn btn--primary" disabled={regBusy}>
              {regBusy ? "Registrando…" : "Registrar usuario"}
            </button>
            {regStatus && <p className="small status-msg">{regStatus}</p>}
          </form>

          <form className="card form" onSubmit={enviarSolicitud}>
            <span className="eyebrow">Control de solicitudes</span>
            <h2>Solicitudes, Beta y Alianzas</h2>
            <p className="muted small">
              Registra solicitudes en <code>Solicitudes_Banter</code> y actualiza KPIs automáticamente.
            </p>
            <div className="field">
              <label htmlFor="req-name">Nombre o Marca</label>
              <input id="req-name" className="input" required value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="Tu nombre o estudio" />
            </div>
            <div className="field">
              <label htmlFor="req-email">Correo de contacto</label>
              <input id="req-email" className="input" type="email" required value={reqEmail} onChange={(e) => setReqEmail(e.target.value)} placeholder="equipo@marca.com" />
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="req-type">Tipo</label>
                <select id="req-type" className="input" value={reqType} onChange={(e) => setReqType(e.target.value as BanterRequestPayload["requestType"])}>
                  <option value="Acceso Beta">Acceso Beta</option>
                  <option value="Verificación Creador">Verificación Creador</option>
                  <option value="Soporte Técnico">Soporte Técnico</option>
                  <option value="Alianza / Patrocinio">Alianza / Patrocinio</option>
                  <option value="Solicitud NitroPay/Ads">Solicitud NitroPay/Ads</option>
                  <option value="Reembolso / Facturación">Reembolso / Facturación</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="req-prio">Prioridad</label>
                <select id="req-prio" className="input" value={reqPriority} onChange={(e) => setReqPriority(e.target.value as BanterRequestPayload["priority"])}>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="req-summary">Descripción</label>
              <textarea id="req-summary" className="input" rows={3} required value={reqSummary} onChange={(e) => setReqSummary(e.target.value)} placeholder="Detalla tu solicitud..." />
            </div>
            <button type="submit" className="btn btn--primary" disabled={reqBusy}>
              {reqBusy ? "Enviando…" : "Enviar solicitud"}
            </button>
            {reqStatus && <p className="small status-msg">{reqStatus}</p>}
          </form>
        </section>
      </main>

      <footer className="footer">
        <span className="muted small">Banter Ecosystem · Cumplimiento NitroPay (Overwolf) + Google Play AdMob/Billing</span>
        {decision.requiresCmpResurfaceButton && (
          <button type="button" className="btn-link" onClick={() => resurfacePrivacyConsent()}>
            Gestionar preferencias de privacidad / CMP (GDPR)
          </button>
        )}
      </footer>
    </div>
  );
}
