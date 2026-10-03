"use client";

import { useCallback, useEffect, useState } from "react";
import {
  assignAgentToMarket,
  createMarket,
  deleteMarket,
  getAgents,
  getMarketsAdmin,
  unassignAgentFromMarket,
  updateMarket,
  type AgentUser,
  type MarketAdmin,
} from "@/lib/api";
import { BackofficePage, btnGhost, btnPrimary, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

interface MarketForm {
  name: string;
  city: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
}
const EMPTY: MarketForm = { name: "", city: "", latitude: "", longitude: "", radiusMeters: "300" };

function Markets({ token, user }: StaffContext) {
  const [markets, setMarkets] = useState<MarketAdmin[] | null>(null);
  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<MarketForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const isAdmin = user.role === "ADMIN";

  const load = useCallback(() => {
    Promise.all([getMarketsAdmin(token), getAgents(token)])
      .then(([m, a]) => {
        setMarkets(m);
        setAgents(a);
      })
      .catch((e: Error) => setMsg({ kind: "error", text: e.message }));
  }, [token]);
  useEffect(load, [load]);

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      await action();
      setMsg({ kind: "ok", text: ok });
      load();
      return true;
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de l'action." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startEdit(m: MarketAdmin | null) {
    setEditing(m ? m.id : "new");
    setForm(m ? { name: m.name, city: m.city, latitude: String(m.latitude), longitude: String(m.longitude), radiusMeters: String(m.radiusMeters) } : EMPTY);
    setMsg(null);
  }

  const lat = Number(form.latitude.replace(",", "."));
  const lng = Number(form.longitude.replace(",", "."));
  const valid = form.name.trim() && form.city.trim() && form.latitude !== "" && form.longitude !== "" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  async function save() {
    const data = { name: form.name.trim(), city: form.city.trim(), latitude: lat, longitude: lng, radiusMeters: Number(form.radiusMeters) || 300 };
    const ok = await run(() => (editing === "new" ? createMarket(token, data) : updateMarket(token, editing!, data)), editing === "new" ? "Marché créé." : "Marché modifié.");
    if (ok) setEditing(null);
  }

  return (
    <div className="grid gap-5">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {editing && (
        <section className="grid gap-3 rounded-2xl border border-brand/40 bg-surface p-5">
          <h2 className="font-display text-lg font-bold">{editing === "new" ? "Nouveau marché" : "Modifier le marché"}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ["name", "Nom"],
                ["city", "Ville"],
                ["latitude", "Latitude"],
                ["longitude", "Longitude"],
                ["radiusMeters", "Rayon (m)"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="grid gap-1 text-xs font-semibold text-ink-2">
                {label}
                <input className={inputCls} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </label>
            ))}
          </div>
          <p className="text-xs text-ink-2">Astuce : faites un clic droit sur le marché dans Google Maps pour copier ses coordonnées. Un relevé hors du rayon est signalé pour contrôle.</p>
          <div className="flex gap-2">
            <button type="button" disabled={busy || !valid} onClick={save} className={btnPrimary}>
              Enregistrer
            </button>
            <button type="button" onClick={() => setEditing(null)} className={btnGhost}>
              Annuler
            </button>
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={() => startEdit(null)} className={btnPrimary}>
          + Nouveau marché
        </button>
      </div>

      {!markets ? (
        <Empty>Chargement…</Empty>
      ) : markets.length === 0 ? (
        <Empty>Aucun marché.</Empty>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {markets.map((m) => {
            const free = agents.filter((a) => !m.assignments.some((x) => x.agent.id === a.id));
            return (
              <article key={m.id} className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display font-bold">{m.name}</h2>
                    <p className="text-xs text-ink-2">
                      {m.city} · rayon {m.radiusMeters} m · {m._count.readings} relevé(s)
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs font-bold">
                    <button type="button" className="text-brand" onClick={() => startEdit(m)}>
                      Modifier
                    </button>
                    {isAdmin && (
                      <button type="button" disabled={busy} className="text-down" onClick={() => confirm(`Supprimer le marché « ${m.name} » ?`) && run(() => deleteMarket(token, m.id), "Marché supprimé.")}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-2">Agents affectés</p>
                  {m.assignments.length === 0 ? (
                    <p className="text-sm text-down">Aucun agent : personne ne peut relever les prix ici.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {m.assignments.map((a) => (
                        <li key={a.id} className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                          {a.agent.fullName !== "Nouveau client" ? a.agent.fullName : a.agent.phone}
                          <button type="button" aria-label={`Retirer ${a.agent.fullName}`} disabled={busy} onClick={() => run(() => unassignAgentFromMarket(token, m.id, a.agent.id), "Agent retiré.")}>
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {free.length > 0 && (
                  <select
                    aria-label={`Affecter un agent à ${m.name}`}
                    className={inputCls}
                    value=""
                    disabled={busy}
                    onChange={(e) => e.target.value && run(() => assignAgentToMarket(token, m.id, e.target.value), "Agent affecté.")}
                  >
                    <option value="">+ Affecter un agent…</option>
                    {free.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName !== "Nouveau client" ? a.fullName : a.phone}
                      </option>
                    ))}
                  </select>
                )}
              </article>
            );
          })}
        </div>
      )}
      {agents.length === 0 && markets && <Notice kind="info">Aucun agent de terrain n&apos;existe encore. L&apos;administrateur peut en créer dans « Équipe et accès » (rôle Agent de terrain).</Notice>}
    </div>
  );
}

export default function MarketsPage() {
  return (
    <BackofficePage roles={["GESTIONNAIRE_PRIX", "ADMIN"]} title="Marchés et agents" subtitle="Où les prix sont relevés, et qui a le droit de les relever. Un agent ne voit que les marchés qui lui sont affectés.">
      {(ctx) => <Markets {...ctx} />}
    </BackofficePage>
  );
}
