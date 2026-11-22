import {
  BANTER_PLANS,
  sanitizeCustomizationForPlan,
  type BanterPlanId,
  type BanterProfileCustomization,
} from "@banter/core";

interface Props {
  planId: BanterPlanId;
  handle: string;
  customization: BanterProfileCustomization;
  onChange: (next: BanterProfileCustomization) => void;
}

const FRAMES: Array<{ id: BanterProfileCustomization["frameStyle"]; label: string; minPlan: string }> = [
  { id: "none", label: "Clásico", minPlan: "Free" },
  { id: "neon-crimson", label: "Neon Crimson", minPlan: "Nitro" },
  { id: "cyber-gold", label: "Cyber Gold", minPlan: "Nitro" },
  { id: "holo-prism", label: "Holo Prism", minPlan: "Nitro+" },
];

const BANNERS: Array<{ id: BanterProfileCustomization["bannerStyle"]; label: string; minPlan: string }> = [
  { id: "graphite", label: "Grafito", minPlan: "Free" },
  { id: "obsidian-grid", label: "Obsidian Grid", minPlan: "Nitro" },
  { id: "crimson-pulse", label: "Crimson Pulse", minPlan: "Nitro" },
  { id: "aurora-mesh", label: "Aurora Mesh", minPlan: "Nitro+" },
];

export function NitroPersonalizer({ planId, handle, customization, onChange }: Props) {
  const plan = BANTER_PLANS[planId];
  const safe = sanitizeCustomizationForPlan(planId, customization);

  const update = (patch: Partial<BanterProfileCustomization>) => {
    onChange(sanitizeCustomizationForPlan(planId, { ...safe, ...patch }));
  };

  return (
    <section className="card">
      <div className="card__head">
        <div>
          <span className="eyebrow">Estudio de personalización</span>
          <h2>Perfil Banter · {plan.name}</h2>
        </div>
        <span className="pill" style={{ borderColor: safe.accentHex, color: safe.accentHex }}>
          {plan.streamQuality.toUpperCase()} · {plan.maxUploadMb} MB
        </span>
      </div>

      <div className={`profile-preview banner--${safe.bannerStyle}`} style={{ borderColor: safe.accentHex }}>
        <div className={`avatar-ring frame--${safe.frameStyle}`}>
          <div className="avatar-core">{(handle || "BN").slice(0, 2).toUpperCase()}</div>
        </div>
        <div className="profile-preview__meta">
          <div className="profile-preview__row">
            <strong>{handle || "JugadorBanter"}</strong>
            <span className="pill" style={{ background: safe.accentHex, color: "#fff", borderColor: safe.accentHex }}>
              {safe.badgeText}
            </span>
          </div>
          <span className="muted small">
            {plan.adFree ? "Sin anuncios en Web, Escritorio y Android" : "Plan Free sostenido por publicidad"}
          </span>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Marco de avatar</label>
          <div className="chip-row">
            {FRAMES.map((f) => {
              const allowed = plan.allowedFrames.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={!allowed}
                  className={`chip ${safe.frameStyle === f.id ? "chip--active" : ""}`}
                  onClick={() => update({ frameStyle: f.id })}
                >
                  {f.label} {!allowed ? `(${f.minPlan})` : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label>Banner de perfil</label>
          <div className="chip-row">
            {BANNERS.map((b) => {
              const allowed = plan.allowedBanners.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={!allowed}
                  className={`chip ${safe.bannerStyle === b.id ? "chip--active" : ""}`}
                  onClick={() => update({ bannerStyle: b.id })}
                >
                  {b.label} {!allowed ? `(${b.minPlan})` : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label htmlFor="banter-badge">Etiqueta de insignia {planId === "free" ? "(requiere Nitro)" : ""}</label>
          <input
            id="banter-badge"
            className="input"
            disabled={planId === "free"}
            maxLength={14}
            value={safe.badgeText}
            onChange={(e) => update({ badgeText: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="banter-accent">Color de acento {planId === "free" ? "(requiere Nitro)" : ""}</label>
          <input
            id="banter-accent"
            className="input"
            type="color"
            disabled={planId === "free"}
            value={safe.accentHex}
            onChange={(e) => update({ accentHex: e.target.value })}
            style={{ height: 40, padding: 4 }}
          />
        </div>
      </div>
    </section>
  );
}
