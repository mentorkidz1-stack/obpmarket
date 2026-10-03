"use client";

import { useCallback, useEffect, useState } from "react";
import { createStaff, getStaff, resetStaffPassword, updateStaff, type StaffMember, type StaffRole } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/staff-nav";
import { BackofficePage, btnGhost, btnPrimary, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

const ROLES: StaffRole[] = ["AGENT", "AGENT_MAGASIN", "GESTIONNAIRE_PRIX", "GESTIONNAIRE_LIQUIDITE", "MODERATEUR", "ADMIN"];
const EMPTY = { fullName: "", phone: "+229", email: "", role: "AGENT_MAGASIN" as StaffRole };

function Team({ token, user }: StaffContext) {
  const [team, setTeam] = useState<StaffMember[] | null>(null);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [secret, setSecret] = useState<{ who: string; password: string } | null>(null);

  const load = useCallback(() => {
    getStaff(token)
      .then(setTeam)
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

  async function create() {
    if (!form) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await createStaff(token, { fullName: form.fullName.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined, role: form.role });
      if (r.temporaryPassword) setSecret({ who: r.user.fullName, password: r.temporaryPassword });
      setMsg({ kind: "ok", text: "Compte créé." });
      setForm(null);
      load();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de la création." });
    } finally {
      setBusy(false);
    }
  }

  async function reset(m: StaffMember) {
    if (!confirm(`Réinitialiser le mot de passe de ${m.fullName} ?`)) return;
    try {
      const r = await resetStaffPassword(token, m.id);
      setSecret({ who: m.fullName, password: r.temporaryPassword });
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de la réinitialisation." });
    }
  }

  return (
    <div className="grid gap-4">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {secret && (
        <section className="grid gap-2 rounded-2xl border border-accent bg-accent-soft p-5" role="alert">
          <p className="font-display font-bold">Mot de passe provisoire de {secret.who}</p>
          <p className="select-all font-mono text-xl">{secret.password}</p>
          <p className="text-xs text-ink-2">Transmettez-le de façon sûre (en main propre ou par message privé). Il ne sera plus affiché ; la personne devra le changer dans « Mon compte ».</p>
          <button type="button" onClick={() => setSecret(null)} className={`${btnGhost} w-fit`}>
            J&apos;ai noté le mot de passe
          </button>
        </section>
      )}

      {form ? (
        <section className="grid gap-3 rounded-2xl border border-brand/40 bg-surface p-5">
          <h2 className="font-display text-lg font-bold">Nouveau compte</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-ink-2">
              Nom complet
              <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-ink-2">
              Rôle
              <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-ink-2">
              Téléphone
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-ink-2">
              E-mail {form.role === "AGENT" ? "(inutile pour un agent de terrain)" : "(obligatoire : sert à se connecter)"}
              <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
          </div>
          <p className="text-xs text-ink-2">{form.role === "AGENT" ? "L'agent de terrain se connecte avec son numéro et un code reçu." : "Un mot de passe provisoire sera généré et affiché une seule fois."}</p>
          <div className="flex gap-2">
            <button type="button" disabled={busy || !form.fullName.trim() || form.phone.trim().length < 8 || (form.role !== "AGENT" && !form.email.trim())} onClick={create} className={btnPrimary}>
              Créer le compte
            </button>
            <button type="button" onClick={() => setForm(null)} className={btnGhost}>
              Annuler
            </button>
          </div>
        </section>
      ) : (
        <div className="flex justify-end">
          <button type="button" onClick={() => setForm(EMPTY)} className={btnPrimary}>
            + Nouveau compte
          </button>
        </div>
      )}

      {!team ? (
        <Empty>Chargement…</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-2 text-left text-[11px] uppercase tracking-wide text-ink-2">
              <tr>
                <th className="px-3 py-2">Nom</th>
                <th className="px-3 py-2">Rôle</th>
                <th className="px-3 py-2">Connexion</th>
                <th className="px-3 py-2">Dernière connexion</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {team.map((m) => {
                const me = m.id === user.id;
                return (
                  <tr key={m.id} className={`border-t border-line ${m.disabled ? "opacity-60" : ""}`}>
                    <td className="px-3 py-2">
                      <span className="font-semibold">{m.fullName}</span>
                      {me && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">vous</span>}
                      {m.disabled && <span className="ml-2 rounded-full bg-down/10 px-2 py-0.5 text-[10px] font-bold text-down">désactivé</span>}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        aria-label={`Rôle de ${m.fullName}`}
                        disabled={me || busy}
                        value={m.role}
                        onChange={(e) => run(() => updateStaff(token, m.id, { role: e.target.value as StaffRole }), "Rôle modifié.")}
                        className="rounded-lg border border-line bg-bg px-2 py-1 text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-xs text-ink-2">{m.role === "AGENT" ? m.phone : (m.email ?? "—")}</td>
                    <td className="px-3 py-2 text-xs text-ink-2">{m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString("fr-FR") : "jamais"}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-bold">
                      {m.role !== "AGENT" && (
                        <button type="button" disabled={busy} className="mr-3 text-brand" onClick={() => reset(m)}>
                          Réinitialiser le mot de passe
                        </button>
                      )}
                      {!me && (
                        <button type="button" disabled={busy} className={m.disabled ? "text-brand" : "text-down"} onClick={() => run(() => updateStaff(token, m.id, { disabled: !m.disabled }), m.disabled ? "Compte réactivé." : "Compte désactivé.")}>
                          {m.disabled ? "Réactiver" : "Désactiver"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <BackofficePage roles={["ADMIN"]} title="Équipe et accès" subtitle="Qui peut se connecter au back-office, avec quel rôle. Il doit toujours rester au moins un administrateur actif." width="max-w-6xl">
      {(ctx) => <Team {...ctx} />}
    </BackofficePage>
  );
}
